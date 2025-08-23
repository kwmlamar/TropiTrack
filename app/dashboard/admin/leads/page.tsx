"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"

interface Lead {
  id: string
  name: string
  company_name: string
  email: string
  phone_number: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source: string
  notes: string | null
  created_at: string
  updated_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching leads:', error)
        toast.error('Failed to load leads')
        return
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)

      if (error) {
        console.error('Error updating lead:', error)
        toast.error('Failed to update lead')
        return
      }

      toast.success('Lead updated successfully')
      setIsDialogOpen(false)
      setSelectedLead(null)
      fetchLeads() // Refresh the list
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
        <p className="text-gray-600">Manage leads captured from the landing page</p>
      </div>

      <div className="grid gap-6">
        {leads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{lead.name}</h3>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-1">{lead.company_name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{lead.email}</span>
                    <span>{lead.phone_number}</span>
                    <span>Source: {lead.source}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Dialog open={isDialogOpen && selectedLead?.id === lead.id} onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) setSelectedLead(null)
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedLead(lead)}
                    >
                      Update Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Lead Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={selectedLead?.status || 'new'} 
                          onValueChange={(value) => setSelectedLead(prev => prev ? {...prev, status: value as Lead['status']} : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea 
                          id="notes"
                          value={selectedLead?.notes || ''}
                          onChange={(e) => setSelectedLead(prev => prev ? {...prev, notes: e.target.value} : null)}
                          placeholder="Add notes about this lead..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => updateLead(lead.id, {
                            status: selectedLead?.status || lead.status,
                            notes: selectedLead?.notes || lead.notes
                          })}
                          disabled={updating}
                          className="flex-1"
                        >
                          {updating ? 'Updating...' : 'Update Lead'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDialogOpen(false)
                            setSelectedLead(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {leads.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No leads captured yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Leads from the landing page form will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
