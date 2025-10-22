"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, Mail, MapPin, Phone, User, Loader2 } from "lucide-react";
import { updateWorker } from "@/lib/data/workers";
import { workerSchema, type WorkerFormData } from "@/lib/validations";
import type { Worker } from "@/lib/types/worker";

const workerPositions = [
  "Project Manager",
  "Site Supervisor",
  "Foreman",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Mason",
  "Laborer",
  "Equipment Operator",
  "Safety Officer",
  "Quality Control",
  "Administrative Assistant",
  "Accountant",
  "Other",
];

interface EditWorkerDialogProps {
  worker: Worker;
  userId: string;
  onSuccess?: (worker: Worker) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditWorkerDialog({
  worker,
  userId,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
}: EditWorkerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<string[]>(worker.skills || []);
  const [certifications, setCertifications] = useState<string[]>(worker.certifications || []);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const defaultValues = {
    name: worker.name,
    email: worker.email ?? "",
    phone: worker.phone ?? "",
    position: worker.position,
    hourly_rate: worker.hourly_rate,
    hire_date: worker.hire_date,
    is_active: worker.is_active ?? true,
    address: worker.address ?? "",
    emergency_contact: worker.emergency_contact ?? "",
    emergency_phone: worker.emergency_phone ?? "",
    nib_number: worker.nib_number ?? "",
    nib_exempt: worker.nib_exempt ?? false,
  };

  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues,
  });

  const onSubmit = async (data: WorkerFormData) => {
    setIsSubmitting(true);
    try {
      const workerData = {
        ...data,
        email: data.email || undefined,
        nib_number: data.nib_number || undefined,
        skills: skills.length > 0 ? skills : undefined,
        certifications: certifications.length > 0 ? certifications : undefined,
      };

      const result = await updateWorker(userId, worker.id, workerData);

      if (result.success && result.data) {
        onSuccess?.(result.data);
        onOpenChange?.(false);
      } else {
        throw new Error(result.error || "Failed to update worker");
      }
    } catch (error) {
      console.error("Error updating worker:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (certToRemove: string) => {
    setCertifications(certifications.filter(cert => cert !== certToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Worker Profile
          </DialogTitle>
          <DialogDescription>
            Update worker information, skills, and employment details.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nib_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIB Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter NIB number" 
                          {...field}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nib_exempt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Exempt from NIB Deductions
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Toggle if this worker is exempt from NIB deductions (e.g., contractors, part-time)
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select a position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workerPositions.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="20.00"
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : Number(e.target.value);
                              field.onChange(value);
                            }}
                            value={field.value || 0}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="john@example.com"
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="+1 (555) 123-4567"
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="123 Main St, City, State 12345"
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hire_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Hire Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal transition-all duration-200 hover:bg-muted/50",
                                !field.value && "text-gray-500"
                              )}
                            >
                              {field.value ? (
                                format(parseISO(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? parseISO(field.value) : undefined
                            }
                            onSelect={(date) => {
                              field.onChange(
                                date ? date.toISOString().split("T")[0] : null
                              );
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Employee</FormLabel>
                          <p className="text-sm text-gray-500">
                            Worker is currently active and available for assignments
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Skills & Certifications */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Skills & Certifications</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage worker skills and professional certifications
                  </p>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Skills</h5>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addSkill} className="transition-all duration-200 hover:bg-muted">
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {skills.length === 0 && (
                      <p className="text-sm text-gray-500">No skills added</p>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Certifications</h5>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a certification"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCertification} className="transition-all duration-200 hover:bg-muted">
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {certifications.length === 0 && (
                      <p className="text-sm text-gray-500">No certifications added</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Emergency Contact</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Contact information for emergency situations
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Jane Doe" 
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="+1 (555) 987-6543"
                              className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 pb-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="transition-all duration-200 hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Worker
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
