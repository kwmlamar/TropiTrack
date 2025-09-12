"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Home, 
  TestTube, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevNavProps {
  currentPath?: string;
}

const DEV_SECTIONS = [
  {
    title: 'Quick Access',
    items: [
      { name: 'Portal Home', path: '/dev', icon: Home },
      { name: 'Complete Flow', path: '/test-complete-flow', icon: TestTube },
      { name: 'Auth Test', path: '/test-auth', icon: Settings },
    ]
  },
  {
    title: 'Authentication',
    items: [
      { name: 'Test Auth', path: '/test-auth' },
      { name: 'Test Signup', path: '/test-signup' },
      { name: 'Test OAuth', path: '/test-oauth' },
      { name: 'Debug OAuth', path: '/debug-oauth' },
    ]
  },
  {
    title: 'Onboarding',
    items: [
      { name: 'Test Onboarding', path: '/test-onboarding' },
      { name: 'Test Components', path: '/test-onboarding-components' },
      { name: 'Test Database', path: '/test-onboarding-database' },
      { name: 'Test Flow', path: '/test-onboarding-flow' },
    ]
  },
  {
    title: 'Payroll & Time',
    items: [
      { name: 'Test Payroll', path: '/test-payroll' },
      { name: 'Test Time Logs', path: '/test-time-logs' },
      { name: 'Test Timesheet', path: '/test-timesheet' },
      { name: 'Test Approvals', path: '/test-approvals' },
    ]
  },
  {
    title: 'API Endpoints',
    items: [
      { name: 'Debug Environment', path: '/api/debug-env' },
      { name: 'Test Supabase', path: '/api/test-supabase' },
      { name: 'Test Email', path: '/api/test-email' },
      { name: 'Test Storage', path: '/api/test-storage' },
    ]
  }
];

export function DevNav({ currentPath }: DevNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]); // Start with all sections closed

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(s => s !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => {
    if (path === '/dev') return currentPath === '/dev';
    return currentPath?.startsWith(path);
  };

  // Keyboard shortcut to toggle dev tools (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Dev Tools</span>
              <Badge variant="outline" className="text-xs">DEV</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {DEV_SECTIONS.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const IconComponent = section.items[0]?.icon;
            
            return (
              <div key={section.title}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 text-xs"
                  onClick={() => toggleSection(section.title)}
                >
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-3 w-3" />}
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
                
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        target={item.path.startsWith('/api') ? '_blank' : undefined}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start h-7 text-xs",
                            isActive(item.path) && "bg-blue-50 text-blue-700"
                          )}
                        >
                          {item.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
          <div className="mt-3 pt-2 border-t border-gray-100">
            <Link href="/dev">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Home className="h-3 w-3 mr-1" />
                Portal Home
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            title="Open Dev Tools (Ctrl/Cmd + Shift + D)"
          >
            <Bug className="h-5 w-5" />
          </Button>
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
