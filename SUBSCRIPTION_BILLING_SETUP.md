# TropiTrack Subscription & Billing System

This document outlines the comprehensive subscription and billing system for TropiTrack, including database structure, API endpoints, and integration with payment providers.

## 🏗️ **System Architecture**

### **Core Components:**
1. **Subscription Plans** - Define pricing tiers and features
2. **Company Subscriptions** - Track active subscriptions per company
3. **Billing Invoices** - Manage payment records and invoices
4. **Usage Tracking** - Monitor feature usage for billing
5. **Payment Methods** - Store customer payment information

## 📊 **Database Schema**

### **1. Subscription Plans (`subscription_plans`)**
```sql
- id (UUID, Primary Key)
- name (TEXT) - Display name
- slug (TEXT, Unique) - URL-friendly identifier
- description (TEXT) - Plan description
- price_monthly (DECIMAL) - Monthly price in cents
- price_yearly (DECIMAL) - Yearly price in cents
- currency (TEXT) - Currency code (USD)
- features (JSONB) - Array of feature descriptions
- limits (JSONB) - Usage limits object
- is_active (BOOLEAN) - Whether plan is available
- is_popular (BOOLEAN) - Highlight on pricing page
- sort_order (INTEGER) - Display order
```

### **2. Company Subscriptions (`company_subscriptions`)**
```sql
- id (UUID, Primary Key)
- company_id (UUID, Foreign Key) - References companies
- plan_id (UUID, Foreign Key) - References subscription_plans
- status (TEXT) - active, canceled, past_due, unpaid, trialing
- billing_cycle (TEXT) - monthly, yearly
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- cancel_at_period_end (BOOLEAN)
- canceled_at (TIMESTAMP)
- trial_start (TIMESTAMP)
- trial_end (TIMESTAMP)
- stripe_subscription_id (TEXT)
- stripe_customer_id (TEXT)
- metadata (JSONB)
```

### **3. Billing Invoices (`billing_invoices`)**
```sql
- id (UUID, Primary Key)
- company_id (UUID, Foreign Key)
- subscription_id (UUID, Foreign Key)
- invoice_number (TEXT, Unique)
- amount (DECIMAL) - Amount in cents
- currency (TEXT)
- status (TEXT) - draft, open, paid, void, uncollectible
- billing_reason (TEXT)
- period_start (TIMESTAMP)
- period_end (TIMESTAMP)
- due_date (TIMESTAMP)
- paid_at (TIMESTAMP)
- stripe_invoice_id (TEXT)
- stripe_payment_intent_id (TEXT)
- metadata (JSONB)
```

### **4. Usage Metrics (`usage_metrics`)**
```sql
- id (UUID, Primary Key)
- company_id (UUID, Foreign Key)
- metric_name (TEXT)
- metric_value (INTEGER)
- metric_date (DATE)
- billing_period_start (DATE)
- billing_period_end (DATE)
```

### **5. Payment Methods (`payment_methods`)**
```sql
- id (UUID, Primary Key)
- company_id (UUID, Foreign Key)
- stripe_payment_method_id (TEXT)
- type (TEXT) - card, bank_account, sepa_debit
- brand (TEXT) - Visa, Mastercard, etc.
- last4 (TEXT) - Last 4 digits
- exp_month (INTEGER)
- exp_year (INTEGER)
- is_default (BOOLEAN)
- is_active (BOOLEAN)
- metadata (JSONB)
```

## 💳 **Payment Provider Integration**

### **Stripe Integration**
The system is designed to work with Stripe for payment processing:

1. **Customer Management**
   - Create Stripe customers for each company
   - Store customer IDs in `stripe_customer_id`

2. **Subscription Management**
   - Create Stripe subscriptions
   - Store subscription IDs in `stripe_subscription_id`
   - Handle webhook events for status updates

3. **Payment Processing**
   - Store payment method IDs
   - Process recurring payments
   - Handle failed payments

### **Webhook Events**
Handle these Stripe webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

## 🎯 **Pricing Tiers**

### **Starter Plan ($39/month)**
- Up to 10 workers
- Basic timesheet tracking
- QR code clock-in
- Payroll calculations
- Project management
- Mobile app access
- 1GB storage
- 1,000 API calls/month

### **Professional Plan ($89/month)**
- Up to 50 workers
- Advanced timesheet features
- Biometric authentication
- Advanced payroll
- Project analytics
- Team management
- Priority support
- 10GB storage
- 10,000 API calls/month

### **Enterprise Plan ($179/month)**
- Unlimited workers
- Multi-company access
- Advanced analytics
- Equipment tracking
- API access
- Custom integrations
- Dedicated support
- 100GB storage
- 100,000 API calls/month

## 🔧 **Usage Tracking**

### **Tracked Metrics:**
- `workers_count` - Number of active workers
- `projects_count` - Number of projects
- `timesheets_count` - Timesheet submissions
- `payroll_records_count` - Payroll records created
- `storage_bytes` - File storage usage
- `api_calls` - API request count
- `biometric_enrollments` - Biometric enrollments
- `qr_scans` - QR code scans

### **Usage Limits:**
Each plan has specific limits that are enforced:
- Worker count limits
- Project count limits
- Storage limits
- API call limits

## 🚀 **API Endpoints**

### **Subscription Management**
```typescript
// Get available plans
GET /api/subscriptions/plans

// Get current subscription
GET /api/subscriptions/current

// Create subscription
POST /api/subscriptions
{
  "plan_id": "professional",
  "billing_cycle": "monthly",
  "payment_method_id": "pm_xxx"
}

// Update subscription
PUT /api/subscriptions
{
  "plan_id": "enterprise",
  "billing_cycle": "yearly"
}

// Cancel subscription
DELETE /api/subscriptions
```

### **Billing Management**
```typescript
// Get invoices
GET /api/billing/invoices

// Get usage
GET /api/billing/usage

// Create payment method
POST /api/billing/payment-methods
{
  "stripe_payment_method_id": "pm_xxx",
  "is_default": true
}
```

### **Webhook Handler**
```typescript
// Handle Stripe webhooks
POST /api/webhooks/stripe
```

## 🛡️ **Security & Compliance**

### **Row Level Security (RLS)**
- Users can only access their company's data
- Subscription data is isolated by company
- Payment methods are company-specific

### **Data Protection**
- Sensitive payment data stored in Stripe
- Only store payment method IDs locally
- Encrypt metadata fields
- Audit trail for all changes

### **Compliance**
- GDPR-compliant data handling
- PCI DSS compliance via Stripe
- Data retention policies
- Right to deletion support

## 📈 **Analytics & Reporting**

### **Subscription Analytics**
- Total subscriptions by plan
- Monthly recurring revenue (MRR)
- Churn rate calculation
- Trial conversion rates
- Average revenue per user (ARPU)

### **Usage Analytics**
- Feature adoption rates
- Usage patterns by plan
- Storage utilization
- API usage trends

## 🔄 **Workflow Integration**

### **User Signup Flow**
1. User creates account
2. Company is created automatically
3. User is prompted to select a plan
4. Trial period begins (30 days)
5. Payment method is collected
6. Subscription is activated

### **Billing Cycle**
1. Monthly/yearly billing periods
2. Automatic invoice generation
3. Payment processing via Stripe
4. Failed payment handling
5. Grace period management

### **Usage Enforcement**
1. Real-time usage tracking
2. Limit checking on actions
3. Graceful degradation
4. Upgrade prompts
5. Usage notifications

## 🛠️ **Implementation Steps**

### **Phase 1: Database Setup**
1. Run migration: `20240317000000_create_subscription_system.sql`
2. Verify tables and functions
3. Test RLS policies
4. Insert default plans

### **Phase 2: API Development**
1. Create subscription endpoints
2. Implement billing endpoints
3. Add usage tracking
4. Create webhook handlers

### **Phase 3: Frontend Integration**
1. Update pricing page
2. Add subscription management UI
3. Implement billing dashboard
4. Add usage monitoring

### **Phase 4: Payment Integration**
1. Set up Stripe account
2. Configure webhooks
3. Test payment flows
4. Go live with payments

## 🧪 **Testing Strategy**

### **Unit Tests**
- Database functions
- API endpoints
- Business logic
- Error handling

### **Integration Tests**
- Stripe webhook handling
- Payment processing
- Usage tracking
- Limit enforcement

### **End-to-End Tests**
- Complete subscription flow
- Payment processing
- Usage tracking
- Billing cycles

## 📚 **Usage Examples**

### **Creating a Subscription**
```typescript
import { createSubscription } from '@/lib/data/subscriptions';

const result = await createSubscription({
  plan_id: 'professional',
  billing_cycle: 'monthly',
  payment_method_id: 'pm_xxx',
  trial_days: 30
});
```

### **Tracking Usage**
```typescript
import { trackUsage } from '@/lib/data/subscriptions';

// Track worker creation
await trackUsage('workers_count', 1);

// Track API call
await trackUsage('api_calls', 1);
```

### **Checking Feature Access**
```typescript
import { getFeatureFlags } from '@/lib/data/subscriptions';

const flags = await getFeatureFlags();
if (flags.can_use_biometrics) {
  // Show biometric features
}
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Settings
TRIAL_DAYS=30
GRACE_PERIOD_DAYS=7
DEFAULT_CURRENCY=USD
```

### **Feature Flags**
```typescript
// Enable/disable features based on subscription
const featureFlags = {
  can_add_workers: true,
  can_use_biometrics: true,
  can_use_api: false,
  storage_limit_gb: 10,
  workers_limit: 50
};
```

## 🚨 **Error Handling**

### **Common Errors**
- `plan_not_found` - Invalid plan ID
- `payment_failed` - Stripe payment failed
- `limit_exceeded` - Usage limit reached
- `trial_expired` - Trial period ended
- `subscription_canceled` - Subscription inactive

### **Recovery Strategies**
- Automatic retry for failed payments
- Grace period for overdue invoices
- Downgrade options for limit exceeded
- Upgrade prompts for trial expiration

## 📊 **Monitoring & Alerts**

### **Key Metrics**
- Subscription conversion rates
- Payment success rates
- Usage limit alerts
- Churn rate monitoring
- Revenue tracking

### **Alert Types**
- Failed payment notifications
- Usage limit warnings
- Trial expiration alerts
- Subscription status changes

This comprehensive subscription system provides a solid foundation for monetizing TropiTrack while maintaining flexibility for future growth and feature additions. 