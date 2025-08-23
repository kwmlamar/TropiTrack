"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left">How does the time tracking work?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">TropiTrack provides comprehensive time tracking:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Manual Time Entry:</strong> Workers can manually enter their time worked</li>
            <li>• <strong>Timesheet Management:</strong> Create and manage timesheets for projects and workers</li>
            <li>• <strong>Project Assignment:</strong> Assign workers to specific projects and track their hours</li>
            <li>• <strong>Approval Workflow:</strong> Managers can review and approve timesheets before payroll processing</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left">How do I manage multiple projects and workers?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">TropiTrack makes project and worker management simple:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Project Creation:</strong> Create unlimited projects with custom details and budgets</li>
            <li>• <strong>Worker Management:</strong> Add workers, assign them to projects, and track their performance</li>
            <li>• <strong>Client Management:</strong> Organize projects by client and track project status</li>
            <li>• <strong>Role-Based Access:</strong> Different permission levels for managers, workers, and admins</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left">How does payroll and NIB calculations work?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">TropiTrack handles all your payroll needs with Bahamas-specific compliance:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Automatic NIB Calculations:</strong> Built-in NIB contribution calculations for the Bahamas</li>
            <li>• <strong>Payroll Generation:</strong> Generate payroll reports based on approved timesheets</li>
            <li>• <strong>Overtime Calculations:</strong> Automatic overtime calculations based on Bahamian labor laws</li>
            <li>• <strong>Export Options:</strong> Export payroll data for accounting software integration</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left">Can I use TropiTrack on mobile devices?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">Yes! TropiTrack is fully responsive and works on all devices:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Mobile Web App:</strong> Access all features from any smartphone or tablet</li>
            <li>• <strong>Responsive Design:</strong> Optimized interface for touch screens and small displays</li>
            <li>• <strong>Cross-Platform:</strong> Works on iOS, Android, and desktop browsers</li>
            <li>• <strong>Real-Time Sync:</strong> All data syncs across devices in real-time</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger className="text-left">How do I get started with TropiTrack?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">Getting started is simple:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Request Demo:</strong> Contact us for a personalized demo of the platform</li>
            <li>• <strong>Company Setup:</strong> We&apos;ll help you set up your company profile and initial configuration</li>
            <li>• <strong>Worker Onboarding:</strong> Add your workers and assign them to projects</li>
            <li>• <strong>Training:</strong> We provide training and support to get your team up and running quickly</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger className="text-left">What kind of support do you provide?</AccordionTrigger>
        <AccordionContent>
          <p className="mb-3">We provide comprehensive support for Bahamian construction companies:</p>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Local Support:</strong> Support team familiar with Bahamian construction industry</li>
            <li>• <strong>Training Sessions:</strong> Personalized training for your team</li>
            <li>• <strong>Documentation:</strong> Comprehensive guides and tutorials</li>
            <li>• <strong>Ongoing Assistance:</strong> Help with setup, configuration, and day-to-day operations</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
