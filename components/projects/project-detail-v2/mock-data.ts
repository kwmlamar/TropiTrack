import { TimelinePhase, PhaseGroup } from './types'

// Mock timeline data for Gantt-lite visualization
export const mockTimelineData: TimelinePhase[] = [
  {
    id: "phase-1",
    name: "Foundation",
    tasks: [
      {
        id: "task-1",
        name: "Site Preparation",
        startDate: "2024-01-15",
        endDate: "2024-01-25",
        progress: 100,
        status: "completed",
        phase: "Foundation"
      },
      {
        id: "task-2",
        name: "Excavation",
        startDate: "2024-01-20",
        endDate: "2024-02-05",
        progress: 100,
        status: "completed",
        phase: "Foundation"
      },
      {
        id: "task-3",
        name: "Concrete Pour",
        startDate: "2024-02-01",
        endDate: "2024-02-15",
        progress: 75,
        status: "in_progress",
        phase: "Foundation"
      }
    ]
  },
  {
    id: "phase-2",
    name: "Framing",
    tasks: [
      {
        id: "task-4",
        name: "Wall Framing",
        startDate: "2024-02-10",
        endDate: "2024-03-01",
        progress: 30,
        status: "in_progress",
        phase: "Framing"
      },
      {
        id: "task-5",
        name: "Roof Framing",
        startDate: "2024-02-25",
        endDate: "2024-03-15",
        progress: 0,
        status: "not_started",
        phase: "Framing"
      }
    ]
  },
  {
    id: "phase-3",
    name: "Electrical & Plumbing",
    tasks: [
      {
        id: "task-6",
        name: "Rough Electrical",
        startDate: "2024-03-01",
        endDate: "2024-03-20",
        progress: 0,
        status: "not_started",
        phase: "Electrical & Plumbing"
      },
      {
        id: "task-7",
        name: "Rough Plumbing",
        startDate: "2024-03-01",
        endDate: "2024-03-20",
        progress: 0,
        status: "not_started",
        phase: "Electrical & Plumbing"
      }
    ]
  },
  {
    id: "phase-4",
    name: "Finishing",
    tasks: [
      {
        id: "task-8",
        name: "Drywall Installation",
        startDate: "2024-03-15",
        endDate: "2024-04-01",
        progress: 0,
        status: "not_started",
        phase: "Finishing"
      },
      {
        id: "task-9",
        name: "Painting",
        startDate: "2024-04-01",
        endDate: "2024-04-15",
        progress: 0,
        status: "not_started",
        phase: "Finishing"
      },
      {
        id: "task-10",
        name: "Final Inspection",
        startDate: "2024-04-15",
        endDate: "2024-04-20",
        progress: 0,
        status: "not_started",
        phase: "Finishing"
      }
    ]
  }
]

// Mock phase data for tasks section
export const mockPhaseData: PhaseGroup[] = [
  {
    id: "phase-1",
    name: "Foundation",
    overallProgress: 92,
    tasks: [
      {
        id: "t1",
        name: "Site Preparation",
        status: "completed",
        assignedWorkers: [{ id: "w1", name: "John Smith" }],
        percentComplete: 100,
        priority: "high"
      },
      {
        id: "t2",
        name: "Excavation",
        status: "completed",
        assignedWorkers: [
          { id: "w2", name: "Mike Johnson" },
          { id: "w3", name: "Carlos Rodriguez" }
        ],
        percentComplete: 100,
        priority: "high"
      },
      {
        id: "t3",
        name: "Concrete Pour",
        status: "in_progress",
        assignedWorkers: [
          { id: "w1", name: "John Smith" },
          { id: "w4", name: "David Chen" }
        ],
        percentComplete: 75,
        dueDate: "2024-02-15",
        priority: "high"
      }
    ]
  },
  {
    id: "phase-2",
    name: "Framing",
    overallProgress: 15,
    tasks: [
      {
        id: "t4",
        name: "Wall Framing",
        status: "in_progress",
        assignedWorkers: [{ id: "w5", name: "Robert Williams" }],
        percentComplete: 30,
        dueDate: "2024-03-01",
        priority: "medium"
      },
      {
        id: "t5",
        name: "Roof Framing",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-03-15",
        priority: "medium"
      }
    ]
  },
  {
    id: "phase-3",
    name: "Electrical & Plumbing",
    overallProgress: 0,
    tasks: [
      {
        id: "t6",
        name: "Rough Electrical",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-03-20",
        priority: "medium"
      },
      {
        id: "t7",
        name: "Rough Plumbing",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-03-20",
        priority: "medium"
      }
    ]
  },
  {
    id: "phase-4",
    name: "Finishing",
    overallProgress: 0,
    tasks: [
      {
        id: "t8",
        name: "Drywall Installation",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-04-01",
        priority: "low"
      },
      {
        id: "t9",
        name: "Painting",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-04-15",
        priority: "low"
      },
      {
        id: "t10",
        name: "Final Inspection",
        status: "not_started",
        assignedWorkers: [],
        percentComplete: 0,
        dueDate: "2024-04-20",
        priority: "high"
      }
    ]
  }
]

// Status color mapping
export const statusColors = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-300' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' }
}

// Priority color mapping
export const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-amber-600',
  high: 'text-red-600'
}
