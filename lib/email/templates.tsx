interface Lead {
  name: string;
  company_name: string;
  email: string;
  phone_number: string;
}

export const LeadNotificationEmail = (lead: Lead): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: ${lead.name} from ${lead.company_name}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
    }
    .title {
      color: #1f2937;
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin: 0;
    }
    .lead-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .label {
      color: #6b7280;
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 4px;
    }
    .value {
      color: #1f2937;
      font-size: 16px;
      margin: 0 0 16px;
    }
    .button {
      display: inline-block;
      background-color: #f59e0b;
      color: #000000;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .link {
      color: #0ea5e9;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">TropiTrack</h1>
      <p class="subtitle">Construction Management Platform</p>
    </div>
    
    <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">New Lead Captured! 🎉</h2>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
      A new lead has submitted a demo request through the landing page.
    </p>
    
    <div class="lead-card">
      <div class="label">Name:</div>
      <div class="value">${lead.name}</div>
      
      <div class="label">Company:</div>
      <div class="value">${lead.company_name}</div>
      
      <div class="label">Email:</div>
      <div class="value">
        <a href="mailto:${lead.email}" class="link">${lead.email}</a>
      </div>
      
      <div class="label">Phone:</div>
      <div class="value">
        <a href="tel:${lead.phone_number}" class="link">${lead.phone_number}</a>
      </div>
    </div>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
      Please follow up with this lead within 24 hours to schedule their demo.
    </p>
    
    <div style="text-align: center;">
      <a href="mailto:${lead.email}?subject=TropiTrack Demo Request - ${lead.company_name}" class="button">
        Reply to Lead
      </a>
    </div>
    
    <div class="footer">
      This notification was sent from your TropiTrack landing page.
    </div>
  </div>
</body>
</html>
`;

export const WelcomeEmail = (lead: Lead): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for your interest in TropiTrack!</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
    }
    .title {
      color: #1f2937;
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin: 0;
    }
    .info-box {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .list-item {
      color: #374151;
      font-size: 16px;
      line-height: 24px;
      margin: 0 0 8px;
    }
    .button {
      display: inline-block;
      background-color: #f59e0b;
      color: #000000;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .link {
      color: #0ea5e9;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">TropiTrack</h1>
      <p class="subtitle">Construction Management Platform</p>
    </div>
    
    <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px;">Thanks for reaching out, ${lead.name}! 👋</h2>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
      Thank you for your interest in TropiTrack. We're excited to show you how our platform can transform your construction business.
    </p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
      Our team will contact you within 24 hours to schedule your personalized demo and answer any questions you may have.
    </p>
    
    <div class="info-box">
      <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 12px;">What to expect:</h3>
      <div class="list-item">• Personalized demo of TropiTrack features</div>
      <div class="list-item">• Discussion of your specific needs</div>
      <div class="list-item">• Setup assistance and training</div>
      <div class="list-item">• 14-day free trial with your selected plan</div>
    </div>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
      In the meantime, feel free to explore our website or contact us directly if you have any urgent questions.
    </p>
    
    <div style="text-align: center;">
      <a href="https://tropitrack.org" class="button">
        Visit Our Website
      </a>
    </div>
    
    <div class="footer">
      Best regards,<br>
      The TropiTrack Team<br>
      <a href="mailto:lamar@tropitech.org" class="link">lamar@tropitech.org</a>
    </div>
  </div>
</body>
</html>
`;
