"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Search, 
  Loader2,
  QrCode,
  Mail,
  Phone,
  MapPin,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { getWorkers } from "@/lib/data/workers"
import { WorkerPinSetup } from "./worker-pin-setup"

interface WorkerConnectionProps {
  companyId: string
  onWorkerConnected?: (workerId: string) => void
}

interface Worker {
  id: string
  name: string
  email?: string
  phone?: string
  position: string
  department?: string
  is_active: boolean
  created_at: string
}

export function WorkerConnection({ companyId, onWorkerConnected }: WorkerConnectionProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)

  useEffect(() => {
    loadWorkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const loadWorkers = async () => {
    setIsLoading(true)
    try {
      const result = await getWorkers(companyId, { is_active: true })
      if (result.success && result.data) {
        setWorkers(result.data)
      }
    } catch (error) {
      console.error("Error loading workers:", error)
      toast.error("Failed to load workers")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowPinSetup(true)
  }

  const handlePinSet = () => {
    setShowPinSetup(false)
    setSelectedWorker(null)
    onWorkerConnected?.(selectedWorker?.id || "")
    toast.success("Worker connected successfully!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (showPinSetup && selectedWorker) {
    return (
      <WorkerPinSetup
        workerId={selectedWorker.id}
        workerName={selectedWorker.name}
        onPinSet={handlePinSet}
        onCancel={() => {
          setShowPinSetup(false)
          setSelectedWorker(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Connect Worker to Real Person
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a worker from your company to set up their PIN for clock in/out
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Workers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <QrCode className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong>
              <ol className="mt-2 space-y-1 text-sm">
                <li>1. Find the worker in the list below</li>
                <li>2. Click &quot;Connect & Set PIN&quot; to set up their authentication</li>
                <li>3. They can then use their PIN to clock in/out via QR codes</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Workers List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading workers...
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workers found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredWorkers.map((worker) => (
                  <Card key={worker.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{worker.name}</h3>
                          <Badge variant={worker.is_active ? "default" : "secondary"}>
                            {worker.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {worker.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {worker.email}
                            </div>
                          )}
                          {worker.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {worker.phone}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {worker.position}
                          </div>
                          {worker.department && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {worker.department}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Added {formatDate(worker.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleWorkerSelect(worker)}
                        size="sm"
                        className="ml-4"
                      >
                        Connect & Set PIN
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
