# Dashboard Performance Optimization

## Issues Identified

The dashboard was experiencing slow loading times due to several performance bottlenecks:

### 1. **Sequential API Calls**
- Multiple API calls were being made sequentially instead of in parallel
- Each dashboard component was fetching data independently
- No shared data fetching or caching mechanism

### 2. **Inefficient Database Queries**
- Missing database indexes on frequently queried columns
- Complex joins without proper optimization
- Large result sets being processed client-side

### 3. **Component-Level Data Fetching**
- Each component (`DashboardStats`, `PayrollSummary`, `WorkerAttendance`) was making its own API calls
- Redundant data fetching across components
- No coordination between data fetching operations

## Optimizations Implemented

### 1. **Parallel API Calls** (`components/dashboard/dashboard-stats.tsx`)
```typescript
// Before: Sequential calls
const timesheetSummary = await getTimesheetSummary(...)
const workersResponse = await getWorkers(...)
const payrollResponse = await getAggregatedPayrolls(...)

// After: Parallel calls
const [timesheetSummary, workersResponse, payrollResponse] = await Promise.all([
  getTimesheetSummary(...),
  getWorkers(...),
  getAggregatedPayrolls(...)
])
```

### 2. **Shared Data Hook** (`lib/hooks/use-dashboard-data.ts`)
- Created centralized data fetching hook
- Eliminates redundant API calls across components
- Provides consistent loading states and error handling
- Enables data sharing between dashboard components

### 3. **Database Indexes** (`supabase/migrations/20250103000000_add_dashboard_indexes.sql`)
Added comprehensive indexes for dashboard queries:
- `idx_timesheets_company_date` - For date-based timesheet queries
- `idx_workers_company_active` - For active workers queries
- `idx_projects_company_active` - For active projects queries
- `idx_timesheets_date_range` - Partial index for recent data

### 4. **Component Optimization**
- Simplified `DashboardStats` component to use shared data
- Removed redundant state management
- Added proper error handling and loading states

## Expected Performance Improvements

1. **API Response Time**: 60-80% faster due to parallel calls
2. **Database Queries**: 70-90% faster due to proper indexing
3. **Component Rendering**: 50-70% faster due to shared data
4. **Overall Dashboard Load**: 60-80% improvement in initial load time

## Additional Recommendations

### 1. **Implement Data Caching**
```typescript
// Add caching to the shared hook
const cacheKey = `${viewMode}-${selectedDate.toISOString()}`
const cachedData = cache.get(cacheKey)
if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
  return cachedData.data
}
```

### 2. **Add Progressive Loading**
```typescript
// Load critical data first, then secondary data
const [criticalData, setCriticalData] = useState(null)
const [secondaryData, setSecondaryData] = useState(null)

// Load critical stats first
useEffect(() => {
  loadCriticalData().then(setCriticalData)
}, [])

// Load secondary data after critical data loads
useEffect(() => {
  if (criticalData) {
    loadSecondaryData().then(setSecondaryData)
  }
}, [criticalData])
```

### 3. **Implement Virtual Scrolling**
For large datasets, consider using virtual scrolling:
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index]}
      </div>
    )}
  </List>
)
```

### 4. **Add Request Deduplication**
```typescript
// Prevent duplicate requests for the same data
const requestCache = new Map()

const deduplicatedRequest = async (key, requestFn) => {
  if (requestCache.has(key)) {
    return requestCache.get(key)
  }
  
  const promise = requestFn()
  requestCache.set(key, promise)
  
  try {
    const result = await promise
    return result
  } finally {
    requestCache.delete(key)
  }
}
```

### 5. **Optimize Database Queries**
Consider moving complex calculations to the database level:
```sql
-- Example: Calculate dashboard stats in SQL
SELECT 
  COUNT(*) as total_workers,
  COUNT(CASE WHEN is_active THEN 1 END) as active_workers,
  SUM(total_hours) as total_hours
FROM workers w
LEFT JOIN timesheets t ON w.id = t.worker_id
WHERE w.company_id = $1
  AND t.date BETWEEN $2 AND $3
```

## Monitoring Performance

### 1. **Add Performance Metrics**
```typescript
// Track dashboard load times
const startTime = performance.now()
await loadDashboardData()
const loadTime = performance.now() - startTime
console.log(`Dashboard loaded in ${loadTime}ms`)
```

### 2. **Monitor Database Performance**
- Use Supabase dashboard to monitor query performance
- Set up alerts for slow queries
- Regularly review and optimize indexes

### 3. **User Experience Metrics**
- Track Time to First Contentful Paint (FCP)
- Monitor Largest Contentful Paint (LCP)
- Measure Cumulative Layout Shift (CLS)

## Testing Performance

### 1. **Load Testing**
- Test with large datasets (1000+ records)
- Monitor memory usage during load
- Test on slow network connections

### 2. **Component Testing**
- Test individual component performance
- Measure re-render frequency
- Profile component memory usage

### 3. **Database Testing**
- Test query performance with different data sizes
- Monitor index usage and effectiveness
- Test concurrent user scenarios

## Future Optimizations

### 1. **Server-Side Rendering (SSR)**
Consider implementing SSR for dashboard components to improve initial load times.

### 2. **GraphQL Implementation**
Consider migrating to GraphQL for more efficient data fetching:
```typescript
// Example GraphQL query
const DASHBOARD_QUERY = gql`
  query DashboardData($companyId: ID!, $dateRange: DateRange!) {
    dashboardStats(companyId: $companyId, dateRange: $dateRange) {
      totalHours
      activeWorkers
      payroll
      activeProjects
    }
  }
`
```

### 3. **Real-time Updates**
Implement WebSocket connections for real-time dashboard updates:
```typescript
// Subscribe to real-time updates
const subscription = supabase
  .channel('dashboard-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'timesheets' }, 
    (payload) => {
      // Update dashboard data in real-time
      updateDashboardData(payload)
    }
  )
  .subscribe()
```

### 4. **Progressive Web App (PWA)**
Implement PWA features for better offline experience and faster subsequent loads.

## Implementation Checklist

- [x] Parallel API calls in dashboard components
- [x] Shared data fetching hook
- [x] Database indexes for dashboard queries
- [x] Component optimization
- [ ] Data caching implementation
- [ ] Progressive loading
- [ ] Performance monitoring
- [ ] Load testing
- [ ] Real-time updates
- [ ] PWA implementation

## Expected Results

After implementing these optimizations, the dashboard should:
- Load 60-80% faster on initial page load
- Have significantly reduced API call times
- Provide better user experience with proper loading states
- Handle larger datasets more efficiently
- Scale better with increased user traffic 