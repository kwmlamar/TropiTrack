# Email Verification Troubleshooting Guide

## 🔍 **Common Issues & Solutions**

### **1. Email Not Received**

#### **Check These First:**
- ✅ **Spam/Junk folder** - Check your spam folder
- ✅ **Email address** - Verify you entered the correct email
- ✅ **Wait 5-10 minutes** - Sometimes emails are delayed

#### **Try the Resend Button:**
- Go to `/check-email` page
- Click "Resend verification email"
- Check your inbox again

### **2. Supabase Email Configuration**

#### **Check Environment Variables:**
```bash
# Required for email functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your domain
```

#### **Verify Supabase Auth Settings:**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Settings**
3. Check **Email Templates** are configured
4. Verify **SMTP Settings** (if using custom SMTP)

### **3. Development vs Production**

#### **Development (localhost):**
- Emails might not work in development
- Use **Google OAuth** for testing instead
- Or check Supabase logs for email errors

#### **Production:**
- Ensure `NEXT_PUBLIC_SITE_URL` is set to your domain
- Verify domain is added to Supabase allowed origins

### **4. Test Email Functionality**

#### **Use the Test API:**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

#### **Check Browser Console:**
- Open Developer Tools (F12)
- Look for any errors in the Console tab
- Check Network tab for failed requests

### **5. Alternative Solutions**

#### **Use Google OAuth Instead:**
1. Click "Sign up with Google" on signup page
2. Complete OAuth flow
3. Redirects directly to dashboard (no email needed)

#### **Manual Email Verification:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Find your user
4. Click "Verify" button

### **6. Debug Steps**

#### **Step 1: Check Signup Process**
```javascript
// In browser console, check if email is stored
localStorage.getItem('signup-email')
```

#### **Step 2: Test Email API**
```javascript
// In browser console
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com' })
})
.then(r => r.json())
.then(console.log)
```

#### **Step 3: Check Supabase Logs**
1. Go to Supabase Dashboard
2. Navigate to **Logs**
3. Look for email-related errors

### **7. Environment Setup**

#### **Local Development:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### **Production:**
```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### **8. Quick Fixes**

#### **For Immediate Testing:**
1. **Use Google OAuth** - No email verification needed
2. **Check spam folder** - Most common issue
3. **Wait 10 minutes** - Email delivery can be delayed
4. **Try different email** - Some providers block verification emails

#### **For Development:**
1. **Use Google OAuth** for testing
2. **Check Supabase logs** for email errors
3. **Verify environment variables** are set correctly

### **9. Contact Support**

If none of the above work:

1. **Check Supabase Status** - https://status.supabase.com
2. **Review Supabase Documentation** - https://supabase.com/docs
3. **Contact Supabase Support** - If it's a Supabase issue

### **10. Temporary Workaround**

For immediate testing, you can:

1. **Use Google OAuth** instead of email signup
2. **Manually verify users** in Supabase Dashboard
3. **Test with a different email provider** (Gmail, Outlook, etc.)

## 🚀 **Recommended Solution**

For the best user experience:

1. **Keep email verification** for production
2. **Use Google OAuth** as primary signup method
3. **Provide clear instructions** on check-email page
4. **Add resend functionality** (already implemented)

This ensures users can always sign up, even if email verification has issues.
