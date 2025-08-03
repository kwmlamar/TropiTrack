"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');
  const [authStatus, setAuthStatus] = useState<string>('Not tested');
  const [profileStatus, setProfileStatus] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('Testing...');
    
    try {
      const supabase = createClient();
      
      // Test basic connection
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
      } else {
        setConnectionStatus('✅ Connected successfully');
      }
    } catch (error) {
      setConnectionStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    setAuthStatus('Testing...');
    
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        setAuthStatus(`Error: ${error.message}`);
      } else if (!user) {
        setAuthStatus('⚠️ No authenticated user');
      } else {
        setAuthStatus(`✅ Authenticated as ${user.email}`);
      }
    } catch (error) {
      setAuthStatus(`❌ Auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testProfile = async () => {
    setIsLoading(true);
    setProfileStatus('Testing...');
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setProfileStatus('❌ No authenticated user');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setProfileStatus(`Error: ${profileError.message}`);
      } else if (!profile) {
        setProfileStatus('⚠️ No profile found for user');
      } else {
        setProfileStatus(`✅ Profile found: ${profile.name || 'No name'}`);
      }
    } catch (error) {
      setProfileStatus(`❌ Profile test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Connection Test</h1>
        <p className="text-gray-500">Test Supabase connection and authentication</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge variant={connectionStatus.includes('✅') ? "default" : "destructive"}>
                {connectionStatus}
              </Badge>
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full"
            >
              Test Connection
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge variant={authStatus.includes('✅') ? "default" : "destructive"}>
                {authStatus}
              </Badge>
            </div>
            <Button 
              onClick={testAuth} 
              disabled={isLoading}
              className="w-full"
            >
              Test Auth
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge variant={profileStatus.includes('✅') ? "default" : "destructive"}>
                {profileStatus}
              </Badge>
            </div>
            <Button 
              onClick={testProfile} 
              disabled={isLoading}
              className="w-full"
            >
              Test Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>SUPABASE_URL:</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SUPABASE_ANON_KEY:</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 