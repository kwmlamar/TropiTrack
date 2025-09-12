# TropiTrack Developer Portal

A comprehensive development environment for testing and debugging TropiTrack features in isolation.

## 🚀 Quick Start

1. **Access the Portal**: Navigate to `/dev` in development mode
2. **Floating Dev Tools**: Use the floating dev navigation (bottom-right corner)
3. **API Testing**: Visit `/dev/api-testing` for direct API endpoint testing

## 🛡️ Security & Access Control

- **Development Only**: Portal is only accessible when `NODE_ENV=development`
- **No Production Access**: Automatically blocked in production environments
- **Clean Separation**: Dev tools don't interfere with production code

## 📁 Portal Structure

### Main Dashboard (`/dev`)
- **Organized Categories**: All test tools grouped by functionality
- **Quick Actions**: Fast access to common development tasks
- **Tool Overview**: Visual summary of available development resources

### API Testing (`/dev/api-testing`)
- **Interactive Testing**: Execute API calls directly from the browser
- **Request/Response Viewing**: See full request and response details
- **Authentication Handling**: Support for both authenticated and public endpoints
- **Copy/Paste Support**: Easy copying of requests and responses

### Floating Navigation (`DevNav`)
- **Collapsible Interface**: Starts closed, click the bug icon to open
- **Keyboard Shortcut**: Press `Ctrl/Cmd + Shift + D` to toggle
- **Quick Access**: Jump to any test page or API endpoint
- **Context Aware**: Shows current page and available tools
- **Visual Indicator**: Green dot shows when dev tools are available

## 🧪 Available Test Categories

### 1. Authentication & Users
- **Test Auth**: Authentication flow testing
- **Test Signup**: User registration testing
- **Test OAuth**: OAuth integration testing
- **Debug OAuth**: OAuth debugging tools

### 2. Onboarding & Setup
- **Test Onboarding**: Complete onboarding flow
- **Test Components**: UI component testing
- **Test Database**: Database setup testing
- **Test Flow**: End-to-end flow testing

### 3. Payroll & Time Tracking
- **Test Payroll**: Payroll calculation testing
- **Test Time Logs**: Time tracking functionality
- **Test Timesheet**: Timesheet management
- **Test Approvals**: Approval system testing

### 4. QR Code System
- **QR Scan**: QR code scanning functionality
- **Biometric Verification**: Biometric authentication testing

### 5. Dashboard & UI
- **Test Dashboard Overlay**: Dashboard component testing
- **Test Full Viewport**: Viewport and responsive testing
- **Test Company Overlay**: Company-specific UI testing

### 6. Smart Completion
- **Test Smart Completion**: Completion logic testing
- **Test Completion Strategies**: Strategy testing
- **Test Workers Completion**: Worker-specific completion

### 7. Subscription & Billing
- **Test Subscription Debug**: Subscription debugging
- **Test Subscription Limits**: Plan limit testing
- **Checkout**: Payment flow testing

### 8. System & Integration
- **Test Email**: Email system testing
- **Test Connection**: Connection testing
- **Test Imports**: Import functionality testing
- **Test Error**: Error handling testing

### 9. Complete Flow Testing
- **Test Complete Flow**: End-to-end user journey testing
- **Test Setup Guide**: Setup guide testing

## 🔧 API Endpoints

### Environment & System
- `GET /api/debug-env` - Environment variables and configuration
- `GET /api/test-supabase` - Database connection testing
- `GET /api/test-storage` - File storage testing
- `GET /api/check-database` - Database health check
- `GET /api/check-storage` - Storage bucket status

### Authentication & Users
- `POST /api/test-signup-minimal` - Minimal signup testing
- `POST /api/test-signup-no-plan` - Signup without plan
- `POST /api/test-signup-simple` - Simple signup process

### Subscriptions & Billing
- `GET /api/debug-subscription-plans` - Available subscription plans
- `POST /api/test-trial-subscription` - Trial subscription testing
- `POST /api/test-subscription-creation` - Subscription creation

### Email & Communication
- `POST /api/test-email` - Email sending functionality

### Database & Data
- `GET /api/test-payroll-table` - Payroll table operations
- `GET /api/test-project-status` - Project status functionality
- `GET /api/test-worker` - Worker data operations

## 🎯 Usage Examples

### Testing a New Feature
1. Navigate to `/dev`
2. Find the relevant category (e.g., "Authentication & Users")
3. Click on the appropriate test tool
4. Use the floating dev nav for quick access to related tools

### API Testing Workflow
1. Go to `/dev/api-testing`
2. Select an endpoint from the categorized list
3. Configure request body (if needed)
4. Execute the request
5. Review response data and status

### Quick Navigation
1. **Open Dev Tools**: Click the blue bug icon (bottom-right) or press `Ctrl/Cmd + Shift + D`
2. **Expand Sections**: Click on section headers to expand/collapse
3. **Access Tools**: Click any tool for instant access
4. **Close Panel**: Click the × button or press the keyboard shortcut again
5. **Portal Home**: Use "Portal Home" button to return to main dashboard

## 🔍 Development Best Practices

### Feature Development
1. **Create Test Page**: Add new test pages to appropriate categories
2. **Update Portal**: Add new tools to the developer portal
3. **Document Changes**: Update this README with new tools
4. **Test Thoroughly**: Use the portal to test all scenarios

### API Development
1. **Add to API Testing**: Include new endpoints in the API testing interface
2. **Provide Examples**: Include sample request bodies
3. **Document Requirements**: Note authentication requirements
4. **Test Edge Cases**: Use the portal to test error scenarios

### Debugging Workflow
1. **Start with Portal**: Use `/dev` to identify the issue area
2. **Use API Testing**: Test specific endpoints directly
3. **Check Environment**: Use `/api/debug-env` to verify configuration
4. **Test Complete Flow**: Use end-to-end testing tools

## 🚨 Important Notes

- **Development Only**: Never deploy dev portal to production
- **Clean Code**: Keep test pages organized and documented
- **Security**: Don't expose sensitive data in test endpoints
- **Performance**: Test pages should not impact production performance

## 🔄 Maintenance

### Adding New Test Tools
1. Create test page in appropriate location
2. Add to relevant category in `/app/dev/page.tsx`
3. Update floating navigation in `/components/dev-nav.tsx`
4. Document in this README

### Adding New API Endpoints
1. Create API endpoint
2. Add to `/app/dev/api-testing/page.tsx`
3. Include sample request body
4. Document authentication requirements

### Updating Categories
1. Modify `DEV_CATEGORIES` in `/app/dev/page.tsx`
2. Update `DEV_SECTIONS` in `/components/dev-nav.tsx`
3. Update this documentation

## 📞 Support

For issues with the developer portal:
1. Check environment variables (`/api/debug-env`)
2. Verify database connection (`/api/test-supabase`)
3. Test basic functionality (`/test-complete-flow`)
4. Review console logs and network requests

---

**Remember**: The developer portal is your sandbox for safe testing and development. Use it to experiment, debug, and validate features before they reach production users.
