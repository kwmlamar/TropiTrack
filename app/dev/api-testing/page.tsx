"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Play, 
  Copy, 
  Check, 
  AlertCircle,
  Code,
  Database,
  Mail,
  CreditCard,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  {
    category: 'Environment & System',
    icon: Server,
    color: 'bg-blue-500',
    endpoints: [
      { 
        name: 'Debug Environment', 
        path: '/api/debug-env', 
        method: 'GET',
        description: 'View environment variables and configuration',
        requiresAuth: false
      },
      { 
        name: 'Test Supabase', 
        path: '/api/test-supabase', 
        method: 'GET',
        description: 'Test database connection and status',
        requiresAuth: false
      },
      { 
        name: 'Test Storage', 
        path: '/api/test-storage', 
        method: 'GET',
        description: 'Test file storage functionality',
        requiresAuth: false
      },
      { 
        name: 'Check Database', 
        path: '/api/check-database', 
        method: 'GET',
        description: 'Check database health and tables',
        requiresAuth: false
      },
      { 
        name: 'Check Storage', 
        path: '/api/check-storage', 
        method: 'GET',
        description: 'Check storage bucket status',
        requiresAuth: false
      },
    ]
  },
  {
    category: 'Authentication & Users',
    icon: Users,
    color: 'bg-green-500',
    endpoints: [
      { 
        name: 'Test Signup Minimal', 
        path: '/api/test-signup-minimal', 
        method: 'POST',
        description: 'Test minimal user signup flow',
        requiresAuth: false,
        body: { email: 'test@example.com', password: 'password123' }
      },
      { 
        name: 'Test Signup No Plan', 
        path: '/api/test-signup-no-plan', 
        method: 'POST',
        description: 'Test signup without subscription plan',
        requiresAuth: false,
        body: { email: 'test@example.com', password: 'password123' }
      },
      { 
        name: 'Test Signup Simple', 
        path: '/api/test-signup-simple', 
        method: 'POST',
        description: 'Test simple signup process',
        requiresAuth: false,
        body: { email: 'test@example.com', password: 'password123' }
      },
    ]
  },
  {
    category: 'Subscriptions & Billing',
    icon: CreditCard,
    color: 'bg-purple-500',
    endpoints: [
      { 
        name: 'Debug Subscription Plans', 
        path: '/api/debug-subscription-plans', 
        method: 'GET',
        description: 'View available subscription plans',
        requiresAuth: false
      },
      { 
        name: 'Test Trial Subscription', 
        path: '/api/test-trial-subscription', 
        method: 'POST',
        description: 'Test trial subscription creation',
        requiresAuth: true,
        body: { planId: 'starter' }
      },
      { 
        name: 'Test Subscription Creation', 
        path: '/api/test-subscription-creation', 
        method: 'POST',
        description: 'Test subscription creation process',
        requiresAuth: true,
        body: { planId: 'professional' }
      },
    ]
  },
  {
    category: 'Email & Communication',
    icon: Mail,
    color: 'bg-orange-500',
    endpoints: [
      { 
        name: 'Test Email', 
        path: '/api/test-email', 
        method: 'POST',
        description: 'Test email sending functionality',
        requiresAuth: false,
        body: { to: 'test@example.com', subject: 'Test Email', message: 'This is a test email' }
      },
    ]
  },
  {
    category: 'Database & Data',
    icon: Database,
    color: 'bg-indigo-500',
    endpoints: [
      { 
        name: 'Test Payroll Table', 
        path: '/api/test-payroll-table', 
        method: 'GET',
        description: 'Test payroll table operations',
        requiresAuth: true
      },
      { 
        name: 'Test Project Status', 
        path: '/api/test-project-status', 
        method: 'GET',
        description: 'Test project status functionality',
        requiresAuth: true
      },
      { 
        name: 'Test Worker', 
        path: '/api/test-worker', 
        method: 'GET',
        description: 'Test worker data operations',
        requiresAuth: true
      },
    ]
  }
];

export default function ApiTestingPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof API_ENDPOINTS[0]["endpoints"][0] | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    data?: unknown;
    headers?: Record<string, string>;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              API testing is only available in development mode.
            </p>
            <Button asChild>
              <a href="/dev">Go to Developer Portal</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEndpointSelect = (endpoint: typeof API_ENDPOINTS[0]["endpoints"][0]) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.body ? JSON.stringify(endpoint.body, null, 2) : '');
    setResponse(null);
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
        headers: Object.fromEntries(res.headers.entries()),
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Testing</h1>
              <p className="text-gray-600">Test and debug API endpoints directly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              Development Mode
            </Badge>
            <Badge variant="outline">
              {API_ENDPOINTS.reduce((acc, cat) => acc + cat.endpoints.length, 0)} Endpoints
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Endpoints List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Available Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {API_ENDPOINTS.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <div key={category.category}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${category.color} text-white`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <h3 className="font-medium text-sm">{category.category}</h3>
                        </div>
                        <div className="space-y-1 ml-6">
                          {category.endpoints.map((endpoint, index) => (
                            <Button
                              key={index}
                              variant={selectedEndpoint?.path === endpoint.path ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start h-auto p-2"
                              onClick={() => handleEndpointSelect(endpoint)}
                            >
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {endpoint.method}
                                  </Badge>
                                  <span className="font-medium text-xs">{endpoint.name}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {endpoint.description}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request/Response Panel */}
          <div className="lg:col-span-2">
            {selectedEndpoint ? (
              <div className="space-y-6">
                {/* Request Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Request Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="outline"
                          className={
                            selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                            selectedEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }
                        >
                          {selectedEndpoint.method}
                        </Badge>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {selectedEndpoint.path}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(selectedEndpoint.path)}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      {selectedEndpoint.requiresAuth && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Requires authentication</span>
                        </div>
                      )}

                      {selectedEndpoint.method === 'POST' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Request Body (JSON)
                          </label>
                          <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder="Enter JSON request body..."
                            className="font-mono text-sm"
                            rows={8}
                          />
                        </div>
                      )}

                      <Button 
                        onClick={executeRequest}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute Request
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Response */}
                {response && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline"
                            className={
                              response.status >= 200 && response.status < 300 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {response.status} {response.statusText}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Response Data
                          </label>
                          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select an endpoint to start testing</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
