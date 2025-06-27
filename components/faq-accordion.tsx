"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left">How does the time tracking work?</AccordionTrigger>
        <AccordionContent>
          Our time tracking system allows workers to clock in and out using their mobile devices or web browser.
          Managers can review and approve timesheets, track project hours, and generate reports for payroll.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left">Can I track multiple projects and teams?</AccordionTrigger>
        <AccordionContent>
          Yes, you can create unlimited projects and teams. Assign workers to specific projects, track hours per
          project, and generate detailed reports to understand labor costs and productivity.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left">Does it work offline in remote construction sites?</AccordionTrigger>
        <AccordionContent>
          Yes, our mobile app works offline. Workers can clock in/out without internet connection, and the data will
          sync automatically when connectivity is restored, perfect for remote construction sites in the Bahamas.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left">How does the payroll integration work?</AccordionTrigger>
        <AccordionContent>
          Our system calculates regular hours, overtime, and double time based on your settings. You can export payroll
          reports in various formats compatible with popular accounting software, or use our direct integration with
          local Bahamian payroll systems.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger className="text-left">Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          Yes, we offer a 1 month free trial with full access to all features. No credit card required to start. You can
          upgrade to a paid plan at any time during or after your trial period.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
