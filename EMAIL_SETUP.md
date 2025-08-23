# Email Setup Guide for Lead Capture

## Overview
The lead capture system now sends two types of emails:
1. **Lead Notification Email** - Sent to you when a new lead is captured
2. **Welcome Email** - Sent to the lead thanking them for their interest

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Resend API Key (for sending emails)
RESEND_API_KEY=your_resend_api_key_here

# Admin email (where lead notifications will be sent)
ADMIN_EMAIL=lamar@tropitech.org
```

## Setting Up Resend

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get API Key
1. Go to the API Keys section in your Resend dashboard
2. Create a new API key
3. Copy the API key and add it to your `.env.local` file

### 3. Verify Domain (Optional but Recommended)
1. Add your domain (e.g., `tropitrack.bs`) to Resend
2. Follow the DNS verification steps
3. This allows you to send emails from `noreply@tropitrack.bs`

### 4. Test Domain (For Development)
If you don't have a custom domain yet, you can use Resend's test domain:
- Emails will be sent from `onboarding@resend.dev`
- This is perfect for development and testing

## Email Templates

The system uses React Email templates located in `lib/email/templates.tsx`:

### Lead Notification Email
- **Recipient**: You (ADMIN_EMAIL)
- **Subject**: "New Lead: [Name] from [Company]"
- **Content**: Lead details with direct reply links

### Welcome Email
- **Recipient**: The lead
- **Subject**: "Thank you for your interest in TropiTrack!"
- **Content**: Thank you message with next steps

## Customizing Emails

### Update Email Templates
Edit `lib/email/templates.tsx` to customize:
- Email design and branding
- Content and messaging
- Call-to-action buttons
- Contact information

### Update Email Service
Edit `lib/email/service.ts` to customize:
- Email sending logic
- Error handling
- Additional email types

## Testing

### Test Lead Capture
1. Fill out the lead capture form on the landing page
2. Check your email for the notification
3. Check the lead's email for the welcome message

### Test Email Service
You can test the email service directly:

```typescript
import { EmailService } from '@/lib/email/service';

// Test notification email
await EmailService.sendLeadNotification({
  name: "Test User",
  company_name: "Test Company",
  email: "test@example.com",
  phone_number: "+1 (242) 555-0123"
});

// Test welcome email
await EmailService.sendWelcomeEmail({
  name: "Test User",
  company_name: "Test Company",
  email: "test@example.com",
  phone_number: "+1 (242) 555-0123"
});
```

## Troubleshooting

### Common Issues

1. **"Admin email not configured"**
   - Make sure `ADMIN_EMAIL` is set in your environment variables

2. **"Resend API key not found"**
   - Make sure `RESEND_API_KEY` is set in your environment variables

3. **Emails not sending**
   - Check Resend dashboard for delivery status
   - Verify your domain is properly configured
   - Check console logs for error messages

4. **Emails going to spam**
   - Verify your domain with Resend
   - Use a professional "from" address
   - Include proper email headers

### Debug Mode
Enable debug logging by adding to your `.env.local`:

```bash
DEBUG_EMAILS=true
```

This will log detailed information about email sending attempts.

## Next Steps

1. **Set up environment variables** with your Resend API key
2. **Test the system** by submitting a lead capture form
3. **Customize email templates** to match your branding
4. **Monitor email delivery** in your Resend dashboard
5. **Set up email analytics** to track open rates and engagement
