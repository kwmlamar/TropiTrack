"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Phone, 
  Shield,
  Bell,
  Palette,
  Globe,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Camera
} from "lucide-react"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { toast } from "sonner"
import { useUser } from "@/lib/hooks/use-user"
import { updateProfile } from "@/lib/actions/profile-actions"

export default function ProfileSettingsPage() {
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar_url: "",
    bio: "",
    location: "",
    website: "",
    role: "user"
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar_url: user.avatar_url || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        role: user.role || "user"
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        bio: profile.bio,
        location: profile.location,
        website: profile.website
      })

      if (result.success) {
        toast.success("Profile updated successfully")
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = () => {
    // TODO: Implement avatar upload functionality
    toast.info("Avatar upload functionality coming soon")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load user profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Profile Photo</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a profile photo to personalize your account
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button  
                      size="sm"
                      onClick={handleAvatarUpload}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Name Field */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Name</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your full name
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Contact Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your email and phone number
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Bio</h4>
                  <p className="text-sm text-muted-foreground">
                    Tell us about yourself
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    Your location or address
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Website</h4>
                  <p className="text-sm text-muted-foreground">
                    Your personal or professional website
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Role Badge */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Account Role</h4>
                  <p className="text-sm text-muted-foreground">
                    Your current role in the system
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Role:</Label>
                  <Badge variant="secondary" className="capitalize">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesForm />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Auth</span>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Login</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <p className="text-sm text-muted-foreground">
                  {profile.name || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm text-muted-foreground">{profile.phone || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              </div>
              {user.company && (
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-muted-foreground">{user.company.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
              <Button 
                className="w-full justify-start bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
              >
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </Button>
              <Button 
                className="w-full justify-start bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
              >
                <Globe className="h-4 w-4 mr-2" />
                Language & Region
              </Button>
            </CardContent>
          </Card>

          {/* Profile Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription className="text-sm">
                  Add a profile photo to make your account more personal
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-sm">
                  Keep your contact information up to date
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-sm">
                  Write a bio to help others understand your role
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 