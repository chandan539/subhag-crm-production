# Setting up Cheerio WhatsApp Automation

To send automated WhatsApp messages with pre-approved templates using Cheerio, you need to create a **Workflow** in your Cheerio dashboard. 

## Step 1: Create an Approved Template
1. Log into your [Cheerio Dashboard](https://dashboard.cheerio.in/).
2. Go to **Templates** and create a new template for "Warranty Activation".
3. Add your content. It might look something like this:
   `Hello {{1}}, your warranty for {{2}} (S/N: {{3}}) is now ACTIVE. Access certificate details: {{4}} \n\nDownload PDF Certificate: {{5}}`
4. Submit the template for approval by Meta/WhatsApp.

## Step 2: Create a Workflow
1. Once your template is approved, go to the **Workflows** or **Automations** tab in Cheerio.
2. Create a new API-Triggered Workflow.
3. Select your approved template.
4. Map the variables (`{{1}}`, `{{2}}`, etc.) to the `otherData` JSON object that our CRM sends.
   Our CRM sends the following JSON payload when a warranty is activated:
   ```json
   {
     "phoneNumber": "+91XXXXXXXXXX",
     "userName": "John Doe",
     "workflowId": "YOUR_WORKFLOW_ID",
     "otherData": {
       "productName": "Washing Machine",
       "serialNumber": "WM-1234",
       "activationLink": "https://warranty.subhag.in/portal",
       "certificateDownloadLink": "https://warranty-api.onrender.com/api/v1/warranties/CERT-123/pdf"
     }
   }
   ```
5. Save and Activate the workflow.

## Step 3: Get the Workflow ID
1. When viewing your active workflow in the Cheerio dashboard, look at the URL or the workflow details.
2. You will find a **Workflow ID** (usually a string of letters/numbers).
3. Copy this Workflow ID.

## Step 4: Add to Environment Variables
1. Go to your backend hosting (e.g. Render dashboard).
2. In the Environment Variables section, add:
   `CHEERIO_WORKFLOW_ID = <your_copied_workflow_id>`
3. Restart the backend service.

Once configured, the backend will automatically trigger this workflow every time a new warranty is activated.
