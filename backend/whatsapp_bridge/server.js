import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WHATSAPP_PORT || 8001;

let sock = null;
let currentQR = null;
let isConnected = false;
let userNumber = null;

const logger = pino({ level: 'silent' });

async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        currentQR = await QRCode.toDataURL(qr);
        isConnected = false;
        console.log('[WhatsApp] New QR code generated. Ready for Linked Devices scan.');
      } catch (err) {
        console.error('[WhatsApp] Failed to generate QR data URL:', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      isConnected = false;
      userNumber = null;

      console.log(`[WhatsApp] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(initWhatsApp, 3000);
      } else {
        console.log('[WhatsApp] Logged out. Clearing authentication directory...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {}
        currentQR = null;
        setTimeout(initWhatsApp, 2000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      currentQR = null;
      userNumber = sock.user?.id ? sock.user.id.split(':')[0] : 'Linked';
      console.log(`[WhatsApp] Successfully connected! Active user: ${userNumber}`);
    }
  });
}

// Endpoint: Check Connection & Retrieve QR
app.get('/status', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : currentQR ? 'scan_qr' : 'initializing',
    isConnected,
    userNumber,
    qrCode: currentQR
  });
});

// Endpoint: Request Pairing Code (Alternative to QR scanning)
app.post('/pairing-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!sock) {
      return res.status(500).json({ success: false, error: 'WhatsApp socket not initialized.' });
    }
    const code = await sock.requestPairingCode(cleanNumber);
    console.log(`[WhatsApp] Pairing code generated for ${cleanNumber}: ${code}`);
    res.json({ success: true, code });
  } catch (err) {
    console.error('[WhatsApp] Pairing code error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Send WhatsApp Report
app.post('/send', async (req, res) => {
  try {
    if (!isConnected || !sock) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp is not connected yet. Please scan the QR code via Linked Devices.'
      });
    }

    let { to, message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    // Default to sending to self if 'to' is 'self' or empty
    let jid;
    if (!to || to === 'self' || to === 'me') {
      jid = sock.user?.id;
    } else {
      // Clean phone number: remove +, -, spaces
      let cleanNumber = to.replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber; // Default to India prefix
      }
      jid = `${cleanNumber}@s.whatsapp.net`;
    }

    if (!jid) {
      return res.status(400).json({ success: false, error: 'Could not determine recipient JID.' });
    }

    console.log(`[WhatsApp] Sending intelligence report to ${jid}...`);
    const sent = await sock.sendMessage(jid, { text: message });

    res.json({
      success: true,
      recipient: jid.replace('@s.whatsapp.net', ''),
      messageId: sent.key.id
    });
  } catch (err) {
    console.error('[WhatsApp] Error sending message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Disconnect / Unlink session
app.post('/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (e) {}
    isConnected = false;
    userNumber = null;
    currentQR = null;
    setTimeout(initWhatsApp, 1500);
    res.json({ success: true, message: 'Session cleared. Fresh QR code initializing.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[WhatsApp Bridge] Gateway listening on http://localhost:${PORT}`);
  initWhatsApp().catch((err) => console.error('[WhatsApp] Initialization error:', err));
});
