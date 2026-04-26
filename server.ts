// Versusfy Server - v2.2.0-OMNI (Tactical Release)
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// TACTICAL NODEMAILER FIX
const createTransporter = (options: any) => {
    // Some versions of nodemailer in ESM need special handling
    const fn = (nodemailer as any).createTransport || nodemailer;
    if (typeof fn !== 'function') throw new Error("Could not find createTransport in nodemailer.");
    return (nodemailer as any).createTransport(options);
};

dotenv.config();

// Critical Environment Snapshot
const envKeys = Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GEMINI'));
fs.writeFileSync(path.join(process.cwd(), 'env_snapshot.log'), `KEYS: ${envKeys.join(', ')}\nTS: ${new Date().toISOString()}`);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load local config as default source of truth
let localFirebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    localFirebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`Versusfy: Loaded local configuration.`);
  }
} catch (e) {
  console.warn("Versusfy: No local config fallback available.");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API: Email via Gmail (Nodemailer)
  app.post("/api/notify/email", async (req, res) => {
    const { to, subject, text, html } = req.body;
    
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error("Versusfy: Gmail credentials missing.");
      return res.status(500).json({ error: "Email service not configured (GMAIL_USER/GMAIL_APP_PASSWORD missing)." });
    }

    try {
      const transporter = createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({
        from: `"Versusfy Alerts" <${user}>`,
        to,
        subject,
        text,
        html
      });

      console.log(`Versusfy: Notification email sent to ${to}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Notification Nodemailer Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Contact Form Helper
  app.post("/api/contact", async (req, res) => {
    const { email, message } = req.body;
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn("Versusfy: Contact form active but GMAIL/SMTP credentials missing.");
      return res.status(500).json({ error: "Contact service currently unavailable (Credentials Missing)." });
    }

    try {
      console.log(`Versusfy: Attempting to send tactical email for ${email} using ${user}...`);
      const transporter = createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use TLS
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection immediately
      await transporter.verify().catch((err: any) => {
        console.error("Nodemailer Verification failed:", err);
        throw new Error(`SMTP Verification failed: ${err.message}. Check if GMAIL_APP_PASSWORD is a 16-character code.`);
      });

      await transporter.sendMail({
        from: `"Versusfy Support" <${user}>`,
        to: user, // Send to self
        replyTo: email,
        subject: `[Versusfy Support] Message from ${email}`,
        text: `Message: ${message}\nFrom: ${email}`
      });

      console.log(`✅ Versusfy: Contact message successfully routed.`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Tactical Nodemailer Error:", error);
      res.status(500).json({ error: error.message || "Failed to route message." });
    }
  });

  // API: AI Proxy for marketing generation
  app.post("/api/ai/generate", async (req, res) => {
    const { model, contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("Versusfy: GEMINI_API_KEY missing - AI features will be disabled.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on Railway. Please go to Railway dashboard -> Variables -> Add GEMINI_API_KEY.",
        missingKey: true 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model || "gemini-1.5-flash",
        contents: contents,
        config: config
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Proxy Error:", error);
      const isHighDemand = error.message?.includes('503') || error.status === 503 || JSON.stringify(error).includes('high demand');
      if (isHighDemand) {
        return res.status(503).json({ error: "Google AI is temporarily busy. Versusfy is retrying..." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // API Retailer Proxy (Dynamic)
  const retailers = ['amazon', 'walmart', 'ebay', 'homedepot', 'bestbuy', 'officedepot', 'toysrus', 'walgreens', 'cvs', 'autozone', 'pepboys', 'advanceauto', 'oreilly', 'guitarcenter', 'sweetwater', 'musiciansfriend', 'samash'];
  retailers.forEach(retailer => {
    app.post(`/api/${retailer}`, (req, res) => {
      const { keywords } = req.body;
      console.log(`Versusfy: Searching ${retailer} for "${keywords}"`);
      
      let customUrl = `https://www.${retailer === 'officedepot' ? 'officedepot.com' : retailer === 'toysrus' ? 'toysrus.com' : retailer === 'musiciansfriend' ? 'musiciansfriend.com' : `${retailer}.com`}/search?q=${encodeURIComponent(keywords)}`;
      
      // Mocked response for now (to be replaced with actual Affiliate API logic)
      res.json({
        retailer,
        productName: keywords,
        price: (Math.random() * 500 + 50).toFixed(2),
        currency: 'USD',
        url: customUrl,
        available: true,
        logo: `https://logo.clearbit.com/${retailer === 'officedepot' ? 'officedepot.com' : retailer === 'toysrus' ? 'toysrus.com' : retailer === 'musiciansfriend' ? 'musiciansfriend.com' : `${retailer}.com`}`
      });
    });
  });

  // Shared Runtime Config Generator
  const getRuntimeConfig = (req: any) => {
    const getVal = (key: string) => {
        const viteKey = `VITE_${key}`;
        const baseKey = key.replace('FIREBASE_', '');
        const parts = baseKey.toLowerCase().split('_');
        const camelKey = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        
        const val = process.env[viteKey] || 
                    process.env[key] || 
                    (localFirebaseConfig as any)[camelKey] || 
                    (localFirebaseConfig as any)[key] || 
                    (localFirebaseConfig as any)[key.toLowerCase()];
        return val;
    };

    const firebaseConfig: any = {
      apiKey: getVal('FIREBASE_API_KEY'),
      authDomain: getVal('FIREBASE_AUTH_DOMAIN'),
      projectId: getVal('FIREBASE_PROJECT_ID'),
      storageBucket: getVal('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getVal('FIREBASE_MESSAGING_SENDER_ID'),
      appId: getVal('FIREBASE_APP_ID'),
      measurementId: getVal('FIREBASE_MEASUREMENT_ID'),
      databaseId: getVal('FIREBASE_DATABASE_ID') || (localFirebaseConfig as any).firestoreDatabaseId || '(default)',
      geminiApiKey: process.env.GEMINI_API_KEY ? 'HIDDEN_PRESENT' : 'MISSING',
      gmailStatus: (process.env.GMAIL_USER || process.env.SMTP_USER) ? 'READY' : 'MISSING',
      detectedKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GMAIL') || k.includes('SMTP')),
      serverVersion: "2.2.0-OMNI",
      environment: process.env.NODE_ENV || 'development'
    };

    console.log(`Versusfy OMNI-Diagnostics: PID: ${firebaseConfig.projectId}, DB: ${firebaseConfig.databaseId}, GMAIL: ${firebaseConfig.gmailStatus}`);
    
    return {
      ...firebaseConfig,
      autoCompare: (() => {
        const match = req.originalUrl.match(/\/compare\/(.+)-vs-(.+)/i);
        return match ? { a: match[1].replace(/-/g, ' '), b: match[2].replace(/-/g, ' ') } : null;
      })()
    };
  };

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res) => {
      try {
        let html = fs.readFileSync(indexPath, 'utf-8');
        const runtimeConfig = getRuntimeConfig(req);
        const configScript = `<script>window.VERSUSFY_RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};</script>`;
        html = html.replace('</head>', `${configScript}</head>`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (err) {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(parseInt(PORT as string), "0.0.0.0", () => {
    console.log(`Versusfy Server v2.2.0-OMNI running on http://localhost:${PORT}`);
    
    // Tactical Environment Check
    const check = (key: string) => (process.env[key] || process.env[`VITE_${key}`]) ? '✅ PRESENT' : '❌ MISSING';
    console.log("--- Railway Variables Check ---");
    console.log(`GEMINI_API_KEY: ${check('GEMINI_API_KEY')}`);
    console.log(`FIREBASE_PROJECT_ID: ${check('FIREBASE_PROJECT_ID')}`);
    console.log(`FIREBASE_API_KEY: ${check('FIREBASE_API_KEY')}`);
    console.log(`GMAIL_USER: ${check('GMAIL_USER')}`);
    console.log(`GMAIL_APP_PASSWORD: ${check('GMAIL_APP_PASSWORD')}`);
    console.log("-------------------------------");
    
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      console.log(`✅ Versusfy: Production assets ready.`);
    } else {
      console.warn("⚠️ Versusfy: Running in Source Mode (dist folder not found). This is normal for development.");
    }
  });
}

startServer();
