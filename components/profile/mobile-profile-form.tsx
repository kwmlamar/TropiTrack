"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Calendar,
  User,
  FileText,
  Shield,
  Key,
  Smartphone,
  Trash2,
  LogOut,
} from "lucide-react"
import { updateProfile } from "@/lib/actions/profile-actions"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/utils/supabase/client"

interface MobileProfileFormProps {
  initialProfile: UserProfileWithCompany
}

type EditField = "name" | "email" | "phone" | "role" | "location" | "website" | "bio" | null

export function MobileProfileForm({ initialProfile }: MobileProfileFormProps) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [editField, setEditField] = useState<EditField>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "employee":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openEditModal = (field: EditField) => {
    if (!field) return
    const currentValue = profile[field] || ""
    setEditValue(currentValue)
    setEditField(field)
  }

  const closeEditModal = () => {
    setEditField(null)
    setEditValue("")
  }

  const handleSaveField = async () => {
    if (!editField) return

    setSaving(true)
    try {
      const updateData = { ...profile, [editField]: editValue }
      const result = await updateProfile({
        name: updateData.name || "",
        email: updateData.email || "",
        phone: updateData.phone || "",
        role: updateData.role || "",
        bio: updateData.bio || "",
        location: updateData.location || "",
        website: updateData.website || "",
      })

      if (result.success) {
        setProfile((prev) => ({ ...prev, [editField]: editValue }))
        toast.success("Updated successfully")
        closeEditModal()
      } else {
        toast.error(result.error || "Failed to update")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Failed to log out")
      setLoggingOut(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }

  const getFieldLabel = (field: EditField): string => {
    switch (field) {
      case "name":
        return "Full Name"
      case "email":
        return "Email Address"
      case "phone":
        return "Phone Number"
      case "role":
        return "Role"
      case "location":
        return "Location"
      case "website":
        return "Website"
      case "bio":
        return "Bio"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
            Profile
          </h1>
        </div>
      </div>

      {/* Profile Header Section */}
      <div className="bg-white px-5 py-6 border-b border-gray-100">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.name} />
            <AvatarFallback className="text-2xl bg-[#2596be] text-white">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
          <Badge className={`mt-2 ${getRoleBadgeColor(profile.role)}`}>
            {profile.role}
          </Badge>
          {profile.company?.name && (
            <p className="text-sm text-gray-500 mt-2">{profile.company.name}</p>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Email</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.email || "Not set"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Phone</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.phone || "Not set"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Company</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.company?.name || "Not set"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Member Since</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Personal Information
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <ProfileRow
            icon={<User className="w-5 h-5 text-gray-400" />}
            label="Full Name"
            value={profile.name || "Not set"}
            onTap={() => openEditModal("name")}
          />
          <ProfileRow
            icon={<Mail className="w-5 h-5 text-gray-400" />}
            label="Email"
            value={profile.email || "Not set"}
            onTap={() => openEditModal("email")}
          />
          <ProfileRow
            icon={<Phone className="w-5 h-5 text-gray-400" />}
            label="Phone"
            value={profile.phone || "Not set"}
            onTap={() => openEditModal("phone")}
          />
          <ProfileRow
            icon={<Shield className="w-5 h-5 text-gray-400" />}
            label="Role"
            value={profile.role || "Not set"}
            onTap={() => openEditModal("role")}
          />
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Additional Information
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <ProfileRow
            icon={<MapPin className="w-5 h-5 text-gray-400" />}
            label="Location"
            value={profile.location || "Not set"}
            onTap={() => openEditModal("location")}
          />
          <ProfileRow
            icon={<Globe className="w-5 h-5 text-gray-400" />}
            label="Website"
            value={profile.website || "Not set"}
            onTap={() => openEditModal("website")}
          />
          <ProfileRow
            icon={<FileText className="w-5 h-5 text-gray-400" />}
            label="Bio"
            value={profile.bio || "Not set"}
            onTap={() => openEditModal("bio")}
            multiline
          />
        </div>
      </div>

      {/* Security & Account Section */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Security & Account
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <button
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            onClick={() => toast.info("Password change coming soon")}
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Update your password</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            onClick={() => toast.info("2FA coming soon")}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add extra security</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Danger Zone
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 active:bg-red-50 transition-colors"
            onClick={() => toast.error("Account deletion requires confirmation")}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-600">Delete Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-5 pt-6 pb-8">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl active:bg-red-100 transition-all disabled:opacity-50"
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              Log Out
            </>
          )}
        </button>
      </div>

      {/* Edit Modal */}
      <Sheet open={editField !== null} onOpenChange={() => closeEditModal()}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold text-center">
              Edit {getFieldLabel(editField)}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {editField === "role" ? (
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger className="h-12 text-base rounded-xl border-gray-200">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            ) : editField === "bio" ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={`Enter your ${getFieldLabel(editField).toLowerCase()}`}
                className="min-h-[120px] text-base rounded-xl border-gray-200 focus:border-[#2596be] focus:ring-[#2596be]"
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={`Enter your ${getFieldLabel(editField).toLowerCase()}`}
                type={editField === "email" ? "email" : "text"}
                className="h-12 text-base rounded-xl border-gray-200 focus:border-[#2596be] focus:ring-[#2596be]"
                autoFocus
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeEditModal}
                className="flex-1 h-12 text-base rounded-xl"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveField}
                className="flex-1 h-12 text-base rounded-xl bg-[#2596be] hover:bg-[#1e7a9a]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

interface ProfileRowProps {
  icon: React.ReactNode
  label: string
  value: string
  onTap: () => void
  multiline?: boolean
}

function ProfileRow({ icon, label, value, onTap, multiline }: ProfileRowProps) {
  const isNotSet = value === "Not set"

  return (
    <button
      className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
      onClick={onTap}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p
            className={`text-sm font-medium ${
              isNotSet ? "text-gray-400" : "text-gray-900"
            } ${multiline ? "" : "truncate"}`}
          >
            {multiline && value.length > 50 ? `${value.slice(0, 50)}...` : value}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
    </button>
  )
}
