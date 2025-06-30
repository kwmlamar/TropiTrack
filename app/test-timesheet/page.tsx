'use client'

import { useEffect } from 'react'
import { testTimesheetCalculation, testTimeRestrictions, testAutomaticClockOut } from '@/lib/data/qr-clock'

export default function TestTimesheetPage() {
  useEffect(() => {
    // Run the tests when the component mounts
    console.log("Running tests...")
    testTimesheetCalculation()
    testTimeRestrictions()
    testAutomaticClockOut()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Timesheet and Time Restriction Tests</h1>
      <p className="text-muted-foreground mb-4">
        Check the browser console to see the test results for timesheet calculations, time restrictions, and automatic clock-out functionality.
      </p>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-800 mb-2">Timesheet Calculation Tests:</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Test 1: Simple 8-hour work day (8:00 AM - 4:00 PM)</li>
            <li>• Test 2: Multiple sessions with lunch break (8:00-12:00, 1:00-5:00)</li>
            <li>• Test 3: Overtime scenario (8:00 AM - 6:00 PM = 10 hours)</li>
          </ul>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="font-semibold text-green-800 mb-2">Time Restriction Tests:</h2>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Clock in before 5 AM: ❌ BLOCKED</li>
            <li>• Clock in at 5 AM: ✅ ALLOWED</li>
            <li>• Clock in during day: ✅ ALLOWED</li>
            <li>• Clock out before 5 AM: ❌ BLOCKED</li>
            <li>• Clock out after 9 PM: ❌ BLOCKED</li>
            <li>• Clock out during day: ✅ ALLOWED</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="font-semibold text-purple-800 mb-2">Automatic Clock-Out Tests:</h2>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Worker forgot to clock out</li>
            <li>• Auto-generate clock-out event</li>
            <li>• Limit timesheet to 8 hours max</li>
            <li>• Add notes about auto-generation</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Time Restriction Configuration:</h3>
        <p className="text-sm text-yellow-700">
          Workers cannot clock in before 5:00 AM and cannot clock out after 9:00 PM. 
          Clock out is also restricted before 5:00 AM to prevent early clock outs.
        </p>
      </div>

      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-800 mb-2">Automatic Clock-Out Configuration:</h3>
        <p className="text-sm text-orange-700">
          When workers forget to clock out, the system automatically generates a clock-out event 
          and creates a timesheet limited to a maximum of 8 hours to prevent over-billing.
        </p>
      </div>
    </div>
  )
} 