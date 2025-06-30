import { supabase } from '../supabaseClient';
import { BiometricTemplate } from '../utils/biometric-capture';

export interface BiometricTemplateRecord {
  id: string;
  worker_id: string;
  company_id: string;
  template_type: 'fingerprint' | 'face' | 'both';
  template_data: string;
  template_features: number[];
  quality_score: number;
  algorithm_version: string;
  capture_device?: string;
  capture_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBiometricTemplateParams {
  worker_id: string;
  company_id: string;
  template: BiometricTemplate;
}

export interface GetBiometricTemplatesParams {
  worker_id?: string;
  company_id?: string;
  template_type?: 'fingerprint' | 'face' | 'both';
  active_only?: boolean;
}

export interface VerifyBiometricTemplateParams {
  worker_id: string;
  company_id: string;
  template_type: 'fingerprint' | 'face' | 'both';
  captured_template: BiometricTemplate;
  match_threshold?: number;
}

export class BiometricTemplatesService {
  // Create a new biometric template
  static async createTemplate(params: CreateBiometricTemplateParams): Promise<{
    success: boolean;
    template_id?: string;
    error?: string;
  }> {
    try {
      console.log('Creating biometric template for worker:', params.worker_id);
      
      const { data, error } = await supabase
        .from('biometric_templates')
        .insert({
          worker_id: params.worker_id,
          company_id: params.company_id,
          template_type: params.template.type,
          template_data: params.template.template,
          template_features: params.template.features,
          quality_score: params.template.quality,
          algorithm_version: params.template.metadata.algorithm,
          capture_device: params.template.metadata.device,
          capture_date: params.template.metadata.captureDate
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating biometric template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Biometric template created successfully:', data.id);
      return {
        success: true,
        template_id: data.id
      };

    } catch (error) {
      console.error('Unexpected error creating biometric template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get biometric templates for a worker
  static async getTemplates(params: GetBiometricTemplatesParams): Promise<{
    success: boolean;
    templates?: BiometricTemplateRecord[];
    error?: string;
  }> {
    try {
      console.log('Fetching biometric templates with params:', params);
      
      let query = supabase
        .from('biometric_templates')
        .select('*');

      if (params.worker_id) {
        query = query.eq('worker_id', params.worker_id);
      }

      if (params.company_id) {
        query = query.eq('company_id', params.company_id);
      }

      if (params.template_type) {
        query = query.eq('template_type', params.template_type);
      }

      if (params.active_only !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching biometric templates:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`Found ${data?.length || 0} biometric templates`);
      return {
        success: true,
        templates: data || []
      };

    } catch (error) {
      console.error('Unexpected error fetching biometric templates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Verify a biometric template against stored templates
  static async verifyTemplate(params: VerifyBiometricTemplateParams): Promise<{
    success: boolean;
    is_match: boolean;
    match_score: number;
    matched_template_id?: string;
    error?: string;
  }> {
    try {
      console.log('Verifying biometric template for worker:', params.worker_id);
      
      // Get stored templates for the worker
      const templatesResult = await this.getTemplates({
        worker_id: params.worker_id,
        company_id: params.company_id,
        template_type: params.template_type,
        active_only: true
      });

      if (!templatesResult.success || !templatesResult.templates) {
        return {
          success: false,
          is_match: false,
          match_score: 0,
          error: templatesResult.error || 'No templates found'
        };
      }

      if (templatesResult.templates.length === 0) {
        return {
          success: true,
          is_match: false,
          match_score: 0,
          error: 'No biometric templates found for this worker'
        };
      }

      // Convert stored templates to BiometricTemplate format
      const storedTemplates: BiometricTemplate[] = templatesResult.templates.map(record => ({
        id: record.id,
        type: record.template_type,
        template: record.template_data,
        quality: record.quality_score,
        features: record.template_features,
        metadata: {
          device: record.capture_device || 'unknown',
          captureDate: record.capture_date,
          algorithm: record.algorithm_version,
          version: record.algorithm_version
        }
      }));

      // Import the biometric capture manager
      const { biometricCaptureManager } = await import('../utils/biometric-capture');
      
      // Verify the template
      const verificationResult = await biometricCaptureManager.verifyBiometricTemplate(
        params.captured_template,
        storedTemplates
      );

      const matchThreshold = params.match_threshold || 0.85;
      const isMatch = verificationResult.success && verificationResult.matchScore >= matchThreshold;

      console.log('Template verification result:', {
        isMatch,
        matchScore: verificationResult.matchScore,
        threshold: matchThreshold
      });

      return {
        success: true,
        is_match: isMatch,
        match_score: verificationResult.matchScore,
        matched_template_id: verificationResult.matchedTemplate?.id
      };

    } catch (error) {
      console.error('Unexpected error verifying biometric template:', error);
      return {
        success: false,
        is_match: false,
        match_score: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Deactivate a biometric template
  static async deactivateTemplate(template_id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Deactivating biometric template:', template_id);
      
      const { error } = await supabase
        .from('biometric_templates')
        .update({ is_active: false })
        .eq('id', template_id);

      if (error) {
        console.error('Error deactivating biometric template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Biometric template deactivated successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('Unexpected error deactivating biometric template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete a biometric template
  static async deleteTemplate(template_id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Deleting biometric template:', template_id);
      
      const { error } = await supabase
        .from('biometric_templates')
        .delete()
        .eq('id', template_id);

      if (error) {
        console.error('Error deleting biometric template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Biometric template deleted successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('Unexpected error deleting biometric template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get template statistics for a worker
  static async getTemplateStats(worker_id: string): Promise<{
    success: boolean;
    stats?: {
      total_templates: number;
      active_templates: number;
      fingerprint_templates: number;
      face_templates: number;
      average_quality: number;
      last_updated: string;
    };
    error?: string;
  }> {
    try {
      console.log('Getting template statistics for worker:', worker_id);
      
      const { data, error } = await supabase
        .from('biometric_templates')
        .select('template_type, quality_score, is_active, updated_at')
        .eq('worker_id', worker_id);

      if (error) {
        console.error('Error fetching template statistics:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const templates = data || [];
      const activeTemplates = templates.filter(t => t.is_active);
      
      const stats = {
        total_templates: templates.length,
        active_templates: activeTemplates.length,
        fingerprint_templates: templates.filter(t => t.template_type === 'fingerprint').length,
        face_templates: templates.filter(t => t.template_type === 'face').length,
        average_quality: templates.length > 0 
          ? Math.round(templates.reduce((sum, t) => sum + t.quality_score, 0) / templates.length)
          : 0,
        last_updated: templates.length > 0 
          ? new Date(Math.max(...templates.map(t => new Date(t.updated_at).getTime()))).toISOString()
          : new Date().toISOString()
      };

      console.log('Template statistics:', stats);
      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('Unexpected error getting template statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 