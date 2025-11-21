import { Resend } from 'resend';
import type { Invoice } from '@/lib/types/invoice';
import { LeadNotificationEmail, WelcomeEmail, InvoiceEmailTemplate } from './templates';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface Lead {
  name: string;
  company_name: string;
  email: string;
  phone_number: string;
}

export class EmailService {
  /**
   * Send notification email to admin about new lead
   */
  static async sendLeadNotification(lead: Lead) {
    try {
      if (!process.env.ADMIN_EMAIL) {
        console.warn('ADMIN_EMAIL environment variable not set, skipping lead notification');
        return { success: false, error: 'Admin email not configured' };
      }

      const emailHtml = LeadNotificationEmail(lead);

      const { data, error } = await resend.emails.send({
        from: 'TropiTrack <noreply@tropitrack.org>',
        to: [process.env.ADMIN_EMAIL],
        subject: `New Lead: ${lead.name} from ${lead.company_name}`,
        html: emailHtml,
      });

      if (error) {
        console.error('Error sending lead notification:', error);
        return { success: false, error: error.message };
      }

      console.log('Lead notification sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error sending lead notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send welcome email to the lead
   */
  static async sendWelcomeEmail(lead: Lead) {
    try {
      const emailHtml = WelcomeEmail(lead);

      const { data, error } = await resend.emails.send({
        from: 'TropiTrack <noreply@tropitrack.org>',
        to: [lead.email],
        subject: 'Thank you for your interest in TropiTrack!',
        html: emailHtml,
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error.message };
      }

      console.log('Welcome email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: 'Failed to send welcome email' };
    }
  }

  /**
   * Send invoice email with optional PDF attachment
   */
  static async sendInvoiceEmail({
    invoice,
    to,
    message,
    pdfBuffer,
    subject,
  }: {
    invoice: Invoice
    to: string
    message?: string
    pdfBuffer?: Buffer
    subject?: string
  }) {
    try {
      const html = InvoiceEmailTemplate({ invoice, message })

      const attachments = pdfBuffer
        ? [
            {
              filename: `invoice-${invoice.invoice_number}.pdf`,
              content: pdfBuffer.toString("base64"),
              type: "application/pdf",
            },
          ]
        : undefined

      const { error } = await resend.emails.send({
        from: 'TropiTrack <noreply@tropitrack.org>',
        to: [to],
        subject: subject || `Invoice ${invoice.invoice_number}`,
        html,
        attachments,
      })

      if (error) {
        console.error('Error sending invoice email:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { success: false, error: 'Failed to send invoice email' };
    }
  }

  /**
   * Send both notification and welcome emails for a new lead
   */
  static async sendLeadEmails(lead: Lead) {
    const results = {
      notification: await this.sendLeadNotification(lead),
      welcome: await this.sendWelcomeEmail(lead),
    };

    return results;
  }
}
