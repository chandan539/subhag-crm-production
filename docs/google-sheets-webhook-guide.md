# Google Sheets Webhook Deployment Guide

This guide explains how to deploy a Google Apps Script to receive data from the CRM and automatically populate a Google Sheet.

## Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name the spreadsheet something like "CRM Customers Export".
3. Add the following headers in Row 1 (A1 to I1):
   - `Customer_Name`
   - `Customer_Email`
   - `Customer_Phone`
   - `Product_Name`
   - `Serial_Number`
   - `Warranty_Status`
   - `Start_Date`
   - `End_Date`
   - `Certificate_Number`

## Step 2: Open Google Apps Script
1. In your Google Sheet, click on **Extensions** in the top menu.
2. Select **Apps Script**.
3. A new tab will open with the Apps Script editor.

## Step 3: Add the Webhook Script
1. Replace any existing code in `Code.gs` with the following script:

```javascript
function doPost(e) {
  try {
    // Open the active spreadsheet and select the first sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    
    // Parse the incoming JSON data from the webhook
    const requestBody = JSON.parse(e.postData.contents);
    const dataArray = requestBody.data;
    
    if (!dataArray || !Array.isArray(dataArray)) {
      return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": "Invalid data format" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Iterate through the array of warranty activations and append them to the sheet
    dataArray.forEach(function(warranty) {
      sheet.appendRow([
        warranty.Customer_Name || '',
        warranty.Customer_Email || '',
        warranty.Customer_Phone || '',
        warranty.Product_Name || '',
        warranty.Serial_Number || '',
        warranty.Warranty_Status || '',
        warranty.Start_Date || '',
        warranty.End_Date || '',
        warranty.Certificate_Number || ''
      ]);
    });
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Data written successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

2. Click the **Save** icon (floppy disk) to save the script.

## Step 4: Deploy the Webhook
1. In the Apps Script editor, click the blue **Deploy** button in the top right corner.
2. Select **New deployment**.
3. Click the gear icon next to "Select type" and choose **Web app**.
4. Configure the deployment settings:
   - **Description**: Enter "CRM Export Webhook"
   - **Execute as**: Select "Me (your email)"
   - **Who has access**: Select **Anyone** (This is crucial, otherwise the CRM won't be able to send data to it).
5. Click **Deploy**.
6. Google will prompt you to authorize the script.
   - Click **Authorize access**.
   - Choose your Google account.
   - Click **Advanced** at the bottom, then click **Go to Untitled project (unsafe)**.
   - Click **Allow** to give the script permission to edit your spreadsheet.
7. After deployment, copy the **Web app URL** provided. It will look something like `https://script.google.com/macros/s/AKfycb.../exec`.

## Step 5: Configure the CRM
1. Go back to your CRM admin dashboard.
2. Navigate to **Settings** -> **General Configuration**.
3. Scroll down to the **Export Settings** section.
4. Paste the Web app URL you copied in Step 4 into the **Google Sheets Webhook URL** field.
5. Click **Save Configuration**.

Now, whenever a new warranty is activated (manually or via the portal), the data will be sent automatically to your Google Sheet!
