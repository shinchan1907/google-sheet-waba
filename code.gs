/**
 * WhatsApp Business API Broadcasting System
 * Main AppScript Code
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  WABA_ID: '',  // WhatsApp Business Account ID (for templates)
  PHONE_NUMBER_ID: '',  // Phone Number ID (for sending messages)
  ACCESS_TOKEN: '',
  API_VERSION: 'v21.0',
  SHEET_NAME: 'Broadcast',
  LOG_SHEET_NAME: 'Logs',
  TEMPLATES_SHEET_NAME: 'Templates',
  CONFIG_SHEET_NAME: 'Config'
};

// Generate webhook verify token (stored in script properties)
function getVerifyToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let verifyToken = scriptProperties.getProperty('WEBHOOK_VERIFY_TOKEN');
  
  if (!verifyToken) {
    verifyToken = Utilities.getUuid();
    scriptProperties.setProperty('WEBHOOK_VERIFY_TOKEN', verifyToken);
  }
  
  return verifyToken;
}

// ============================================
// MENU & UI
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📱 WhatsApp Business')
    .addItem('🚀 Open Broadcast Panel', 'showSidebar')
    .addSeparator()
    .addItem('🔄 Refresh Templates', 'fetchAndStoreTemplates')
    .addItem('⚙️ Setup Sheets', 'setupSheets')
    .addItem('🔗 Get Webhook URL', 'showWebhookInfo')
    .addItem('📊 View Logs', 'showLogs')
    .addSeparator()
    .addItem('✅ Test Connection', 'testConnection')
    .addToUi();
  
  // Auto-setup on first run
  setupSheets();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('WhatsApp Broadcast')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showWebhookInfo() {
  const ui = SpreadsheetApp.getUi();
  const webAppUrl = getWebAppUrl();
  const verifyToken = getVerifyToken();
  
  const message = `
📡 WEBHOOK CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Webhook URL:
${webAppUrl}

Verify Token:
${verifyToken}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETUP INSTRUCTIONS:
1. Go to Meta Developer Console
2. Navigate to WhatsApp > Configuration
3. Click "Edit" on Webhook
4. Paste the Webhook URL above
5. Paste the Verify Token above
6. Subscribe to: messages, message_status

Note: After deploying as Web App, use that URL.
  `;
  
  ui.alert('Webhook Configuration', message, ui.ButtonSet.OK);
}

function getWebAppUrl() {
  // This will be the deployed web app URL
  // User needs to deploy as web app first
  return ScriptApp.getService().getUrl() || 'Deploy this script as a Web App first!';
}

// ============================================
// SHEET SETUP
// ============================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Broadcast Sheet
  let broadcastSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!broadcastSheet) {
    broadcastSheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Setup headers
  const headers = ['Phone Number', 'Name', 'Status', 'Message ID', 'Sent At', 'Error', 'Template Used', 'Variables'];
  const headerRange = broadcastSheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  
  // Setup Templates Sheet
  let templatesSheet = ss.getSheetByName(CONFIG.TEMPLATES_SHEET_NAME);
  if (!templatesSheet) {
    templatesSheet = ss.insertSheet(CONFIG.TEMPLATES_SHEET_NAME);
  }
  
  const templateHeaders = ['Template Name', 'Language', 'Status', 'Category', 'Components', 'Last Updated'];
  const templateHeaderRange = templatesSheet.getRange(1, 1, 1, templateHeaders.length);
  templateHeaderRange.setValues([templateHeaders]);
  templateHeaderRange.setBackground('#34A853');
  templateHeaderRange.setFontColor('#FFFFFF');
  templateHeaderRange.setFontWeight('bold');
  
  // Setup Logs Sheet
  let logsSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
  }
  
  const logHeaders = ['Timestamp', 'Type', 'Phone', 'Message', 'Details'];
  const logHeaderRange = logsSheet.getRange(1, 1, 1, logHeaders.length);
  logHeaderRange.setValues([logHeaders]);
  logHeaderRange.setBackground('#FBBC04');
  logHeaderRange.setFontColor('#000000');
  logHeaderRange.setFontWeight('bold');
  
  // Setup Config Sheet
  let configSheet = ss.getSheetByName(CONFIG.CONFIG_SHEET_NAME);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG.CONFIG_SHEET_NAME);
  }
  
  const configData = [
    ['Configuration', 'Value'],
    ['WABA ID', CONFIG.WABA_ID],
    ['Access Token', CONFIG.ACCESS_TOKEN],
    ['API Version', CONFIG.API_VERSION],
    ['Webhook Verify Token', getVerifyToken()],
    ['Webhook URL', getWebAppUrl()]
  ];
  
  configSheet.getRange(1, 1, configData.length, 2).setValues(configData);
  configSheet.getRange(1, 1, 1, 2).setBackground('#EA4335').setFontColor('#FFFFFF').setFontWeight('bold');
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Sheets setup completed!', '✅ Success', 3);
}

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

function fetchAndStoreTemplates() {
  try {
    const templates = fetchTemplates();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName(CONFIG.TEMPLATES_SHEET_NAME);
    
    // Clear existing data (except headers)
    if (templatesSheet.getLastRow() > 1) {
      templatesSheet.getRange(2, 1, templatesSheet.getLastRow() - 1, templatesSheet.getLastColumn()).clear();
    }
    
    // Add template data
    const templateData = templates.map(template => [
      template.name,
      template.language,
      template.status,
      template.category,
      JSON.stringify(template.components),
      new Date()
    ]);
    
    if (templateData.length > 0) {
      templatesSheet.getRange(2, 1, templateData.length, 6).setValues(templateData);
    }
    
    logEvent('INFO', 'SYSTEM', `Fetched ${templates.length} templates`, '');
    SpreadsheetApp.getActiveSpreadsheet().toast(`Fetched ${templates.length} templates successfully!`, '✅ Templates Updated', 3);
    
    return templates;
  } catch (error) {
    logEvent('ERROR', 'SYSTEM', 'Failed to fetch templates', error.toString());
    SpreadsheetApp.getUi().alert('Error fetching templates: ' + error.toString());
    return [];
  }
}

function fetchTemplates() {
  const url = `https://graph.facebook.com/${CONFIG.API_VERSION}/${CONFIG.WABA_ID}/message_templates?access_token=${CONFIG.ACCESS_TOKEN}`;
  
  const options = {
    method: 'get',
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  return result.data || [];
}

function getTemplates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const templatesSheet = ss.getSheetByName(CONFIG.TEMPLATES_SHEET_NAME);
  
  if (!templatesSheet || templatesSheet.getLastRow() <= 1) {
    return fetchAndStoreTemplates();
  }
  
  const data = templatesSheet.getRange(2, 1, templatesSheet.getLastRow() - 1, 5).getValues();
  
  return data.map(row => ({
    name: row[0],
    language: row[1],
    status: row[2],
    category: row[3],
    components: JSON.parse(row[4])
  })).filter(t => t.status === 'APPROVED');
}

// ============================================
// MESSAGING FUNCTIONS
// ============================================

function sendTestMessage(phoneNumber, templateName, headerParams, bodyParams, buttonParams) {
  try {
    const result = sendWhatsAppMessage(phoneNumber, templateName, headerParams, bodyParams, buttonParams);
    
    if (result.success) {
      logEvent('SUCCESS', phoneNumber, 'Test message sent', templateName);
      return { success: true, messageId: result.messageId };
    } else {
      logEvent('ERROR', phoneNumber, 'Test message failed', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    logEvent('ERROR', phoneNumber, 'Test message exception', error.toString());
    return { success: false, error: error.toString() };
  }
}

function startBroadcast(templateName, headerParams, bodyParams, buttonParams) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const broadcastSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!broadcastSheet || broadcastSheet.getLastRow() <= 1) {
    return { success: false, error: 'No phone numbers found in Broadcast sheet' };
  }
  
  const data = broadcastSheet.getRange(2, 1, broadcastSheet.getLastRow() - 1, 8).getValues();
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    const phoneNumber = data[i][0];
    const name = data[i][1];
    
    if (!phoneNumber) continue;
    
    try {
      // Update status to "Sending..."
      broadcastSheet.getRange(i + 2, 3).setValue('Sending...');
      SpreadsheetApp.flush();
      
      const result = sendWhatsAppMessage(phoneNumber, templateName, headerParams, bodyParams, buttonParams);
      
      if (result.success) {
        broadcastSheet.getRange(i + 2, 3).setValue('✅ Sent');
        broadcastSheet.getRange(i + 2, 4).setValue(result.messageId);
        broadcastSheet.getRange(i + 2, 5).setValue(new Date());
        broadcastSheet.getRange(i + 2, 6).setValue('');
        broadcastSheet.getRange(i + 2, 7).setValue(templateName);
        broadcastSheet.getRange(i + 2, 8).setValue(JSON.stringify({ header: headerParams, body: bodyParams }));
        successCount++;
        logEvent('SUCCESS', phoneNumber, 'Broadcast message sent', templateName);
      } else {
        broadcastSheet.getRange(i + 2, 3).setValue('❌ Failed');
        broadcastSheet.getRange(i + 2, 6).setValue(result.error);
        failCount++;
        logEvent('ERROR', phoneNumber, 'Broadcast message failed', result.error);
      }
      
      // Rate limiting - wait 1 second between messages
      Utilities.sleep(1000);
      
    } catch (error) {
      broadcastSheet.getRange(i + 2, 3).setValue('❌ Error');
      broadcastSheet.getRange(i + 2, 6).setValue(error.toString());
      failCount++;
      logEvent('ERROR', phoneNumber, 'Broadcast exception', error.toString());
    }
  }
  
  return {
    success: true,
    total: data.length,
    sent: successCount,
    failed: failCount
  };
}

function sendWhatsAppMessage(phoneNumber, templateName, headerParams, bodyParams, buttonParams) {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.toString().replace(/\D/g, '');
  
  const url = `https://graph.facebook.com/${CONFIG.API_VERSION}/${CONFIG.PHONE_NUMBER_ID}/messages`;
  
  // Build components array
  const components = [];
  
  // Add header component if params provided
  if (headerParams && headerParams.length > 0) {
    components.push({
      type: 'header',
      parameters: headerParams.map(param => {
        if (param.type === 'image') {
          return { type: 'image', image: { link: param.value } };
        } else if (param.type === 'document') {
          return { type: 'document', document: { link: param.value } };
        } else if (param.type === 'video') {
          return { type: 'video', video: { link: param.value } };
        } else {
          return { type: 'text', text: param.value };
        }
      })
    });
  }
  
  // Add body component if params provided
  if (bodyParams && bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map(param => ({
        type: 'text',
        text: param.toString()
      }))
    });
  }
  
  // Add button component if params provided
  if (buttonParams && buttonParams.length > 0) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: buttonParams.map(param => ({
        type: 'text',
        text: param.toString()
      }))
    });
  }
  
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en' // You can make this dynamic
      }
    }
  };
  
  // Only add components if we have any
  if (components.length > 0) {
    payload.template.components = components;
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true, messageId: result.messages[0].id };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ============================================
// WEBHOOK HANDLING
// ============================================

function doGet(e) {
  // Webhook verification
  const mode = e.parameter['hub.mode'];
  const token = e.parameter['hub.verify_token'];
  const challenge = e.parameter['hub.challenge'];
  
  const verifyToken = getVerifyToken();
  
  if (mode === 'subscribe' && token === verifyToken) {
    logEvent('INFO', 'WEBHOOK', 'Webhook verified', '');
    return ContentService.createTextOutput(challenge);
  } else {
    return ContentService.createTextOutput('Verification failed');
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Log the webhook event
    logEvent('WEBHOOK', 'INCOMING', 'Received webhook', JSON.stringify(data));
    
    // Process webhook data
    if (data.entry && data.entry[0].changes) {
      const changes = data.entry[0].changes;
      
      for (const change of changes) {
        if (change.value.messages) {
          // Incoming message
          const messages = change.value.messages;
          for (const message of messages) {
            handleIncomingMessage(message, change.value.metadata);
          }
        }
        
        if (change.value.statuses) {
          // Message status update
          const statuses = change.value.statuses;
          for (const status of statuses) {
            handleMessageStatus(status);
          }
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    logEvent('ERROR', 'WEBHOOK', 'Webhook processing error', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleIncomingMessage(message, metadata) {
  const from = message.from;
  const messageId = message.id;
  const timestamp = new Date(parseInt(message.timestamp) * 1000);
  
  let messageText = '';
  
  if (message.type === 'text') {
    messageText = message.text.body;
  } else if (message.type === 'image') {
    messageText = `[Image: ${message.image.id}]`;
  } else if (message.type === 'document') {
    messageText = `[Document: ${message.document.filename}]`;
  } else {
    messageText = `[${message.type}]`;
  }
  
  logEvent('MESSAGE', from, messageText, messageId);
}

function handleMessageStatus(status) {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const recipientId = status.recipient_id;
  
  // Update the broadcast sheet with the status
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const broadcastSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!broadcastSheet) return;
  
  const data = broadcastSheet.getRange(2, 1, broadcastSheet.getLastRow() - 1, 4).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][3] === messageId) {
      let statusEmoji = '';
      switch (statusType) {
        case 'sent':
          statusEmoji = '📤 Sent';
          break;
        case 'delivered':
          statusEmoji = '✅ Delivered';
          break;
        case 'read':
          statusEmoji = '👁️ Read';
          break;
        case 'failed':
          statusEmoji = '❌ Failed';
          break;
      }
      
      broadcastSheet.getRange(i + 2, 3).setValue(statusEmoji);
      logEvent('STATUS', recipientId, `Message ${statusType}`, messageId);
      break;
    }
  }
}

// ============================================
// LOGGING
// ============================================

function logEvent(type, phone, message, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logsSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    
    if (!logsSheet) return;
    
    logsSheet.appendRow([
      new Date(),
      type,
      phone,
      message,
      details
    ]);
    
    // Keep only last 1000 logs
    if (logsSheet.getLastRow() > 1001) {
      logsSheet.deleteRows(2, logsSheet.getLastRow() - 1001);
    }
  } catch (error) {
    console.error('Logging error:', error);
  }
}

function showLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  
  if (logsSheet) {
    logsSheet.activate();
  }
}

// ============================================
// TESTING & UTILITIES
// ============================================

function testConnection() {
  try {
    const templates = fetchTemplates();
    const ui = SpreadsheetApp.getUi();
    
    ui.alert(
      '✅ Connection Successful!',
      `Successfully connected to WhatsApp Business API.\n\nFound ${templates.length} templates.\n\nWABA ID: ${CONFIG.WABA_ID}`,
      ui.ButtonSet.OK
    );
    
    logEvent('INFO', 'SYSTEM', 'Connection test successful', `${templates.length} templates found`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Connection Failed',
      `Error: ${error.toString()}\n\nPlease check your WABA ID and Access Token.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    logEvent('ERROR', 'SYSTEM', 'Connection test failed', error.toString());
  }
}

// Helper function to get template details
function getTemplateDetails(templateName) {
  const templates = getTemplates();
  return templates.find(t => t.name === templateName);
}
