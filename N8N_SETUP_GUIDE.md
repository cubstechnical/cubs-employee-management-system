# n8n Setup Guide for CUBS Employee Management System

## 🚀 Overview

n8n is a powerful workflow automation tool that will enhance your CUBS Employee Management System by automating tasks between Supabase, SendGrid, Backblaze B2, and other services.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Your existing Supabase project
- SendGrid API key
- Backblaze B2 credentials
- Domain name (optional, for webhooks)

## 🛠️ Installation Steps

### 1. Set up Environment Variables

1. Copy `n8n-env-template.txt` to `.env.n8n`
2. Fill in your actual values:

```bash
# Generate a strong encryption key (32 characters)
openssl rand -hex 16

# Use this for N8N_ENCRYPTION_KEY in .env.n8n
```

### 2. Start n8n Services

```bash
# Start n8n with Docker Compose
docker-compose --env-file .env.n8n up -d

# Check if containers are running
docker ps
```

### 3. Access n8n Interface

1. Open browser: `http://localhost:5678`
2. Login with credentials from `.env.n8n`
3. Complete initial setup wizard

## 🔗 Integration Setup

### Supabase Integration

1. **Add Supabase Credentials in n8n:**
   - Go to Settings > Credentials
   - Add new credential: "Supabase API"
   - URL: Your Supabase URL
   - Service Key: Your Supabase service role key

2. **Test Connection:**
   - Create a simple workflow
   - Add Supabase node
   - Test connection to `employee_table`

### SendGrid Integration

1. **Add SendGrid Credentials:**
   - Credential Type: "SendGrid API"
   - API Key: Your SendGrid API key

2. **Test Email Sending:**
   - Create workflow with SendGrid node
   - Send test email

### Backblaze B2 Integration

1. **Add Backblaze Credentials:**
   - Credential Type: "Backblaze B2 API"
   - Application Key ID: Your B2 key ID
   - Application Key: Your B2 application key

## 🔄 Example Workflows for Your System

### 1. Visa Expiration Notifications

**Purpose:** Automatically send email reminders for expiring visas

**Workflow:**
1. **Cron Trigger** (daily at 9 AM)
2. **Supabase Node** - Query employees with visas expiring in 30 days
3. **IF Node** - Check if any employees found
4. **SendGrid Node** - Send notification emails
5. **Supabase Node** - Update notification log

```json
{
  "meta": {
    "instanceId": "cubs-visa-reminders"
  },
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "value": "0 9 * * *"
            }
          ]
        }
      },
      "name": "Daily Check",
      "type": "n8n-nodes-base.cron",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "select",
        "table": "employee_table",
        "filterType": "manual",
        "matchType": "allFilters",
        "filters": {
          "conditions": [
            {
              "keyName": "visa_expiry",
              "condition": "dateAfter",
              "value": "={{ $now.plus({days: 30}).toISO() }}"
            }
          ]
        }
      },
      "name": "Check Expiring Visas",
      "type": "n8n-nodes-base.supabase",
      "position": [460, 300]
    }
  ]
}
```

### 2. Document Processing Workflow

**Purpose:** Process uploaded employee documents

**Workflow:**
1. **Webhook Trigger** - From your React Native app
2. **Backblaze B2 Node** - Download document
3. **AI Node** (optional) - Extract/analyze document content
4. **Supabase Node** - Update employee record
5. **SendGrid Node** - Notify HR of document upload

### 3. Employee Onboarding Automation

**Purpose:** Automate onboarding tasks when new employee is added

**Workflow:**
1. **Supabase Trigger** - New employee inserted
2. **Multiple parallel branches:**
   - Create welcome email template
   - Generate employee ID card
   - Add to payroll system
   - Send welcome package info

## 🔧 Advanced Configuration

### Webhook Setup for React Native Integration

1. **In n8n:** Create webhook workflows
2. **In your React Native app:** Add webhook calls

```typescript
// In your employeeService.ts
const triggerN8nWorkflow = async (workflowType: string, data: any) => {
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/${workflowType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return response.json();
  } catch (error) {
    console.error('n8n workflow trigger failed:', error);
  }
};

// Trigger when employee is created
export const createEmployee = async (employeeData: Employee) => {
  const result = await supabase
    .from('employee_table')
    .insert([employeeData]);
  
  // Trigger n8n onboarding workflow
  await triggerN8nWorkflow('employee-onboarding', employeeData);
  
  return result;
};
```

### Error Handling & Monitoring

1. **Enable n8n Error Workflows:**
   - Create global error workflow
   - Send alerts to Slack/Discord on failures

2. **Logging:**
   - All workflow executions are logged
   - Set up log rotation

3. **Monitoring Dashboard:**
   - Use n8n's built-in metrics
   - Integrate with external monitoring tools

## 🚀 Production Deployment

### Using Vercel/Netlify with n8n

1. **Deploy n8n to Cloud Provider:**
   - Railway, Render, or DigitalOcean
   - Use managed PostgreSQL database

2. **Environment Variables in Production:**
   ```bash
   N8N_HOST=your-n8n-domain.com
   N8N_PROTOCOL=https
   N8N_PORT=443
   WEBHOOK_URL=https://your-n8n-domain.com/
   ```

3. **Security:**
   - Enable HTTPS
   - Use strong authentication
   - Whitelist IP addresses if needed

## 📊 Useful Workflows for Your System

### 1. **Daily Reports**
- Employee count changes
- Document upload statistics
- Visa expiration summary

### 2. **Compliance Monitoring**
- Check for missing documents
- Verify required employee information
- Flag non-compliant records

### 3. **Data Synchronization**
- Sync with external HR systems
- Backup critical data
- Update third-party integrations

### 4. **AI-Enhanced Workflows**
- Document classification
- Text extraction from images
- Automated form filling

## 🔍 Troubleshooting

### Common Issues:

1. **Connection Errors:**
   - Verify credentials in n8n
   - Check network connectivity
   - Review firewall settings

2. **Workflow Failures:**
   - Check execution logs
   - Verify input data format
   - Test individual nodes

3. **Performance Issues:**
   - Optimize database queries
   - Use batch processing for large datasets
   - Implement proper error handling

## 📚 Next Steps

1. **Start with Simple Workflows:**
   - Test basic Supabase connections
   - Create simple email notifications

2. **Gradually Add Complexity:**
   - Implement conditional logic
   - Add multiple service integrations
   - Create error handling workflows

3. **Monitor and Optimize:**
   - Review workflow performance
   - Optimize for your specific use cases
   - Scale as needed

## 🆘 Support Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [Workflow Templates](https://n8n.io/workflows/)
- [YouTube Tutorials](https://www.youtube.com/c/n8nio)

---

**Need Help?** Create an issue in your repository or consult the n8n community for specific workflow questions. 