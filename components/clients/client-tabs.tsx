"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, FolderOpen, Image, Folder, Mail, Phone, MapPin, Building, MoreVertical } from "lucide-react"

interface ClientTabsProps {
  clientId: string
  companyId: string
  client: ClientDetails
}

interface ClientDetails {
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  contact_person?: string
  notes?: string
  created_at: string
}

interface Document {
  id: string
  sent_date: string
  document_name: string
  associated_project: string
  value: number
  balance_due: number
  status: 'pending' | 'approved' | 'rejected' | 'overdue'
  due_date: string
}

interface Project {
  id: string
  name: string
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  start_date: string
  end_date?: string
  budget: number
  progress: number
  location: string
}

interface Photo {
  id: string
  name: string
  project: string
  uploaded_date: string
  file_size: number
  category: 'progress' | 'before' | 'after' | 'issue' | 'general'
  uploaded_by: string
}

interface File {
  id: string
  name: string
  project: string
  type: string
  uploaded_date: string
  file_size: number
  uploaded_by: string
  category: 'document' | 'drawing' | 'contract' | 'permit' | 'other'
}

export function ClientTabs({ client }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState("documents")

  // TODO: Replace with actual data fetching
  const documents: Document[] = []

  // TODO: Replace with actual data fetching
  const projects: Project[] = []

  // TODO: Replace with actual data fetching
  const photos: Photo[] = []

  // TODO: Replace with actual data fetching
  const files: File[] = []

  const getStatusBadge = (status: Document['status']) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      overdue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB} MB`
  }

  const getProjectStatusBadge = (status: Project['status']) => {
    const variants = {
      planning: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      completed: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const getCategoryBadge = (category: string) => {
    const variants = {
      progress: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      before: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      after: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      issue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      general: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      document: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      drawing: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
      contract: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      permit: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${variants[category as keyof typeof variants] || variants.other}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Tabs Section */}
      <div className="flex-1 min-w-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="projects" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="photos" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Photos
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Files
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="mt-6">
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 text-gray-500">Sent Date</TableHead>
                <TableHead className="px-4 text-gray-500">Document</TableHead>
                <TableHead className="px-4 text-gray-500">Associated Project</TableHead>
                <TableHead className="px-4 text-gray-500">Value</TableHead>
                <TableHead className="px-4 text-gray-500">Balance Due</TableHead>
                <TableHead className="px-4 text-gray-500">Status</TableHead>
                <TableHead className="px-4 text-gray-500">Due Date</TableHead>
                <TableHead className="px-4 text-gray-500 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="px-4">{formatDate(doc.sent_date)}</TableCell>
                    <TableCell className="px-4 font-medium">{doc.document_name}</TableCell>
                    <TableCell className="px-4 text-gray-600">{doc.associated_project}</TableCell>
                    <TableCell className="px-4">{formatCurrency(doc.value)}</TableCell>
                    <TableCell className="px-4">{formatCurrency(doc.balance_due)}</TableCell>
                    <TableCell className="px-4">{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="px-4">{formatDate(doc.due_date)}</TableCell>
                    <TableCell className="px-4 w-12">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center px-4 text-gray-500">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="projects" className="mt-6">
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 text-gray-500">Project Name</TableHead>
                <TableHead className="px-4 text-gray-500">Status</TableHead>
                <TableHead className="px-4 text-gray-500">Start Date</TableHead>
                <TableHead className="px-4 text-gray-500">End Date</TableHead>
                <TableHead className="px-4 text-gray-500">Budget</TableHead>
                <TableHead className="px-4 text-gray-500">Progress</TableHead>
                <TableHead className="px-4 text-gray-500">Location</TableHead>
                <TableHead className="px-4 text-gray-500 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="px-4 font-medium">{project.name}</TableCell>
                    <TableCell className="px-4">{getProjectStatusBadge(project.status)}</TableCell>
                    <TableCell className="px-4">{formatDate(project.start_date)}</TableCell>
                    <TableCell className="px-4">{project.end_date ? formatDate(project.end_date) : 'TBD'}</TableCell>
                    <TableCell className="px-4">{formatCurrency(project.budget)}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-gray-600">{project.location}</TableCell>
                    <TableCell className="px-4 w-12">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center px-4 text-gray-500">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="photos" className="mt-6">
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 text-gray-500">Photo Name</TableHead>
                <TableHead className="px-4 text-gray-500">Project</TableHead>
                <TableHead className="px-4 text-gray-500">Category</TableHead>
                <TableHead className="px-4 text-gray-500">Uploaded Date</TableHead>
                <TableHead className="px-4 text-gray-500">File Size</TableHead>
                <TableHead className="px-4 text-gray-500">Uploaded By</TableHead>
                <TableHead className="px-4 text-gray-500 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {photos.length > 0 ? (
                photos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell className="px-4 font-medium">{photo.name}</TableCell>
                    <TableCell className="px-4 text-gray-600">{photo.project}</TableCell>
                    <TableCell className="px-4">{getCategoryBadge(photo.category)}</TableCell>
                    <TableCell className="px-4">{formatDate(photo.uploaded_date)}</TableCell>
                    <TableCell className="px-4">{formatFileSize(photo.file_size)}</TableCell>
                    <TableCell className="px-4">{photo.uploaded_by}</TableCell>
                    <TableCell className="px-4 w-12">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center px-4 text-gray-500">
                    No photos found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="files" className="mt-6">
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 text-gray-500">File Name</TableHead>
                <TableHead className="px-4 text-gray-500">Project</TableHead>
                <TableHead className="px-4 text-gray-500">Type</TableHead>
                <TableHead className="px-4 text-gray-500">Category</TableHead>
                <TableHead className="px-4 text-gray-500">Uploaded Date</TableHead>
                <TableHead className="px-4 text-gray-500">File Size</TableHead>
                <TableHead className="px-4 text-gray-500">Uploaded By</TableHead>
                <TableHead className="px-4 text-gray-500 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length > 0 ? (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="px-4 font-medium">{file.name}</TableCell>
                    <TableCell className="px-4 text-gray-600">{file.project}</TableCell>
                    <TableCell className="px-4">{file.type}</TableCell>
                    <TableCell className="px-4">{getCategoryBadge(file.category)}</TableCell>
                    <TableCell className="px-4">{formatDate(file.uploaded_date)}</TableCell>
                    <TableCell className="px-4">{formatFileSize(file.file_size)}</TableCell>
                    <TableCell className="px-4">{file.uploaded_by}</TableCell>
                    <TableCell className="px-4 w-12">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center px-4 text-gray-500">
                    No files found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
      </div>

       {/* Client Details Sidebar */}
       <div className="w-64 flex-shrink-0">
         <div className="bg-card border rounded-lg p-6">
             {/* Client Avatar */}
             <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                 <span className="text-primary font-semibold text-lg">
                   {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                 </span>
               </div>
               <div>
                 <h3 className="text-lg font-semibold">{client.name}</h3>
               </div>
             </div>
             
             <div className="space-y-4">
               <h4 className="text-sm font-medium text-gray-500 mb-3">Customer Info</h4>

               {/* Email */}
              {client.email && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </h4>
                  <p className="text-sm">{client.email}</p>
                </div>
              )}

              {/* Phone */}
              {client.phone && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </h4>
                  <p className="text-sm">{client.phone}</p>
                </div>
              )}

              {/* Company */}
              {client.company && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    Company
                  </h4>
                  <p className="text-sm">{client.company}</p>
                </div>
              )}

              {/* Address */}
              {client.address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Address
                  </h4>
                  <p className="text-sm">{client.address}</p>
                </div>
              )}

              {/* Contact Person */}
              {client.contact_person && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                  <p className="text-sm">{client.contact_person}</p>
                </div>
              )}

              {/* Notes */}
              {client.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Client Since</h4>
                <p className="text-sm">{new Date(client.created_at).toLocaleDateString()}</p>
              </div>
             </div>
         </div>
       </div>
    </div>
  )
}
