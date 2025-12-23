
# 📱 WhatsApp Business API Broadcasting System (Google Apps Script)

This project is a fully functional **WhatsApp Broadcasting Tool** built in **Google Apps Script**, designed to send **template messages** via the **WhatsApp Business Cloud API (Meta Graph API)**.  
It includes a custom sidebar UI for managing templates, testing messages, and broadcasting to contact lists stored in Google Sheets.

---

## 🚀 Features

- **WhatsApp API Integration** using Meta Graph API (v21.0)
- **Broadcast Panel (Sidebar UI)** directly in Google Sheets
- **Dynamic Template Management** — fetch and use WhatsApp-approved templates
- **Send Personalized Broadcasts** using variable placeholders
- **Webhook Integration** for message status updates and replies
- **Logging System** for tracking sent messages and API events
- **One-click Sheet Setup** with automatic headers and color formatting
- **Rate-limited Sending** to comply with API limits
- **Secure Token Handling** using Script Properties

---

## 🧩 System Components

| File | Description |
|------|--------------|
| `code.gs` | Main backend logic — handles API requests, Sheets integration, and webhooks |
| `Sidebar.html` | Frontend UI for template selection, parameters, testing, and broadcasting |
| `appsscript.json` | Script manifest defining scopes, runtime environment, and web app settings |

---

## ⚙️ Setup Instructions

### 1. Create a new Google Apps Script project
1. Open [Google Apps Script](https://script.google.com/).
2. Create a new project, name it `WhatsApp Broadcast System`.
3. Copy and paste the contents of:
   - `code.gs` → main code.gs file  
   - `Sidebar.html` → as an HTML file named "Sidebar"

4. Replace the contents of **`appsscript.json`** with the provided JSON configuration.

---

### 2. Configure API Credentials

In `code.gs`, update the `CONFIG` object with your own WhatsApp API credentials:

```js
const CONFIG = {
  WABA_ID: 'YOUR_WABA_ID',
  PHONE_NUMBER_ID: 'YOUR_PHONE_NUMBER_ID',
  ACCESS_TOKEN: 'YOUR_LONG_LIVED_ACCESS_TOKEN',
  API_VERSION: 'v21.0',
  SHEET_NAME: 'Broadcast',
  LOG_SHEET_NAME: 'Logs',
  TEMPLATES_SHEET_NAME: 'Templates',
  CONFIG_SHEET_NAME: 'Config'
};
```

> 💡 Tip: Use a [long-lived token](https://developers.facebook.com/docs/whatsapp/business-management-api/token-management) — it lasts up to 60 days.

---

### 3. Set Permissions and Deploy as Web App

1. Click on **Deploy → New Deployment**
2. Choose **Web App**
3. Set:
   - **Execute as:** `Me (user deploying)`
   - **Who has access:** `Anyone (even anonymous)`
4. Copy the **Web App URL** — you'll need it for your webhook.

---

### 4. Configure Webhook in Meta Developer Console

1. Go to your **Meta for Developers** account.
2. Select your **WhatsApp Business App** → **Configuration**.
3. Under **Webhook**, add:
   - **Webhook URL:** the Web App URL you copied
   - **Verify Token:** shown in `📱 WhatsApp Business → 🔗 Get Webhook URL`
4. Subscribe to:
   - `messages`
   - `message_status`
5. Click **Verify and Save**

---

### 5. Initial Setup in Google Sheets

1. Open your linked Google Sheet.
2. Go to the new menu:  
   **📱 WhatsApp Business → ⚙️ Setup Sheets**
3. This will automatically create:
   - `Broadcast` (contacts list)
   - `Templates` (API-fetched templates)
   - `Logs` (event logs)
   - `Config` (API info and webhook details)

---

### 6. Fetch Templates

Once sheets are initialized:
- Go to **📱 WhatsApp Business → 🔄 Refresh Templates**  
or  
- From sidebar, click **"Refresh Templates"**  

This fetches all approved templates and stores them in the "Templates" sheet.

---

### 7. Sending a Test Message

1. Open the sidebar via **📱 WhatsApp Business → 🚀 Open Broadcast Panel**
2. Select a WhatsApp template.
3. Fill in any required variables.
4. Enter your test phone number (include country code, e.g., `919876543210`).
5. Click **Send Test Message**.

---

### 8. Send a Broadcast

1. Add phone numbers and names in the `Broadcast` sheet.
2. Open sidebar and choose your template.
3. Configure variables (e.g., name placeholders).
4. Click **Start Broadcast** and confirm.
5. Check status updates and logs in real time.

---

## 🧾 Sheet Structure

### Broadcast Sheet
| Column | Description |
|---------|-------------|
| Phone Number | Recipient's full number with country code |
| Name | Optional contact name |
| Status | Sending/success/failure updates |
| Message ID | WhatsApp message ID |
| Sent At | Timestamp |
| Error | API error (if any) |
| Template Used | Template name |
| Variables | JSON record of parameters used |

### Templates Sheet
Automatically fetched via API:
| Name | Language | Status | Category | Components | Last Updated |

### Logs Sheet
| Timestamp | Type | Phone | Message | Details |

### Config Sheet
Contains your API and webhook configuration.

---

## 🔒 Webhook Support

The deployed Web App handles:
- **Verification (`doGet`)** — confirms challenge from Meta.
- **Incoming Messages** — logs any received text/media.
- **Status Updates** — updates delivery/read state in the Broadcast sheet.

---

## 🛠️ Utilities

| Function | Description |
|-----------|-------------|
| `setupSheets()` | Initializes Google Sheets structure |
| `fetchAndStoreTemplates()` | Updates template list from Meta |
| `sendWhatsAppMessage()` | Core message sender using template API |
| `testConnection()` | Validates API credentials |
| `logEvent()` | Appends structured logs |
| `getVerifyToken()` | Auto-generates input for webhook verification |

---

## 💡 Notes and Best Practices

- Respect Meta API rate limits (1 msg/sec in current setup).
- Use official **WhatsApp Cloud API** and ensure your business number is approved.
- The sidebar UI is fully responsive and runs natively inside Sheets.
- All credentials are stored inside the script (never exposed in Sheets).

---

## 🧰 Requirements

- **Google Workspace account** with Apps Script access
- **Meta Developer Account** with an active WhatsApp Business API setup
- **Approved templates** in your WhatsApp Business dashboard

---

## 🧑‍💻 Author

**Developed by:** [Your Name or Org]  
**Tech Stack:** Google Apps Script (V8), HTML/CSS/JS (Sidebar front-end)  
**API:** WhatsApp Business Cloud API (Meta Graph API v21.0)

---

## 📄 License

This project is licensed under the MIT License.  
You're free to modify, reuse, and distribute as long as you include attribution.

---

### 🎯 Example Use Cases
- Customer engagement campaigns
- Delivery updates and appointment reminders
- Automated promotional broadcasts
- Personalized message sequences via Sheets

---

**💬 Want to extend this project?**
You can add:
- Scheduled campaign triggers
- Message personalization per contact
- CRM or Google Form integrations
- Analytics dashboards using Apps Script or Looker Studio
