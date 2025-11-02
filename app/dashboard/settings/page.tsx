import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, Plus, Lock, Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 mt-4">
      {/* Team Member Rights Card */}
      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Team Member Rights
          </CardTitle>
          <CardDescription>
            Control what team members can see and do within your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Activity Visibility */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Team Activity Visibility
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Control who can see team activity and timesheet data
              </p>
              <RadioGroup defaultValue="admins" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admins" id="team-admins" />
                  <Label htmlFor="team-admins" className="text-sm">
                    Admins only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="everyone" id="team-everyone" />
                  <Label htmlFor="team-everyone" className="text-sm">
                    Everyone
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Project Creation Rights */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Project Creation Rights
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Control who can create new projects in the organization
              </p>
              <RadioGroup defaultValue="everyone" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admins" id="project-admins" />
                  <Label htmlFor="project-admins" className="text-sm">
                    Admins only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="everyone" id="project-everyone" />
                  <Label htmlFor="project-everyone" className="text-sm">
                    Everyone
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entry and Timesheet Restrictions Card */}
      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Time Entry and Timesheet Restrictions
          </CardTitle>
          <CardDescription>
            Set rules to make sure your reports or timesheets are always orderly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Fields for Time Entries */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Set required fields for new Time entries
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Setting required fields helps to ensure your team fills in all the information you need for accurate reporting
              </p>
              <RadioGroup defaultValue="basic" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="fields-basic" />
                  <Label htmlFor="fields-basic" className="text-sm">
                    Basic fields only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="fields-detailed" />
                  <Label htmlFor="fields-detailed" className="text-sm">
                    All fields required
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Lock Time Entries */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Lock Time entries
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                This allows to lock existing Time entries and prevent creating new ones before selected date
              </p>
              <RadioGroup defaultValue="unlocked" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unlocked" id="lock-unlocked" />
                  <Label htmlFor="lock-unlocked" className="text-sm">
                    Entries unlocked
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="locked" id="lock-locked" />
                  <Label htmlFor="lock-locked" className="text-sm">
                    Entries locked
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Require Timesheet Approval Card */}
      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Require Timesheet Approval
          </CardTitle>
          <CardDescription>
            Control whether timesheets require approval before being finalized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Timesheet Approval Required
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, all timesheets must be approved by an admin before they can be processed for payroll
            </p>
            <RadioGroup defaultValue="disabled" className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disabled" id="approval-disabled" />
                <Label htmlFor="approval-disabled" className="text-sm">
                  No approval required
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enabled" id="approval-enabled" />
                <Label htmlFor="approval-enabled" className="text-sm">
                  Approval required
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
