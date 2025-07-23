"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Bell, Palette } from "lucide-react";

const preferencesSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  weekly_reports: z.boolean(),
  auto_logout: z.boolean(),
  dark_mode: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function PreferencesForm() {
  const [saving, setSaving] = useState(false);

  const {
    handleSubmit,
    formState: { isDirty },
    reset,
    setValue,
    watch,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      email_notifications: true,
      push_notifications: true,
      weekly_reports: false,
      auto_logout: true,
      dark_mode: false,
    },
  });

  const onSubmit = async (data: PreferencesFormData) => {
    setSaving(true);
    try {
      // TODO: Implement preferences saving logic
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Preferences updated successfully");
      reset(data, { keepDirty: false });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email_notifications"
                checked={watchedValues.email_notifications}
                onCheckedChange={(checked) => setValue("email_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_notifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                id="push_notifications"
                checked={watchedValues.push_notifications}
                onCheckedChange={(checked) => setValue("push_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly_reports">Weekly Reports</Label>
                <p className="text-sm text-gray-500">
                  Receive weekly summary reports
                </p>
              </div>
              <Switch
                id="weekly_reports"
                checked={watchedValues.weekly_reports}
                onCheckedChange={(checked) => setValue("weekly_reports", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Security & Display
          </CardTitle>
          <CardDescription>
            Configure security settings and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_logout">Auto Logout</Label>
                <p className="text-sm text-gray-500">
                  Automatically log out after inactivity
                </p>
              </div>
              <Switch
                id="auto_logout"
                checked={watchedValues.auto_logout}
                onCheckedChange={(checked) => setValue("auto_logout", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark_mode">Dark Mode</Label>
                <p className="text-sm text-gray-500">
                  Use dark theme for the application
                </p>
              </div>
              <Switch
                id="dark_mode"
                checked={watchedValues.dark_mode}
                onCheckedChange={(checked) => setValue("dark_mode", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 