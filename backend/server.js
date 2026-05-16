require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

const DB = {
  leads: [],
  contacts: [],
  subscribers: [],
};

const isDev = process.env.NODE_ENV !== "production";

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: isDev
      ? ["http://localhost:5173", "http://localhost:3000"]
      : (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(morgan(isDev ? "dev" : "combined"));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions. Please wait before trying again." },
});

app.use(globalLimiter);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) return;
  try {
    await mailer.sendMail({
      from: `"AutoReply" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

function welcomeEmailHTML(firstName, storeName) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
      <div style="max-width:560px;margin:0 auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.08);">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">🤖 AutoReply</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your AI sales assistant</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;">Marhba ${firstName}! 🎉</h2>
          <p style="color:#64748b;line-height:1.7;margin:0 0 20px;">
            Your chatbot for <strong style="color:#2563eb">${storeName || "your store"}</strong> is almost ready.
            One of our team will be in touch within 24 hours to activate it.
          </p>
          <div style="background:#f1f5f9;border-radius:16px;padding:20px;margin:0 0 24px;">
            <p style="margin:0;color:#475569;font-size:14px;font-weight:600;">⚡ What happens next:</p>
            <ul style="margin:12px 0 0;padding-left:20px;color:#64748b;font-size:14px;line-height:2;">
              <li>We activate your chatbot on your chosen platforms</li>
              <li>You get a personalized onboarding call</li>
              <li>Your bot starts capturing orders automatically</li>
            </ul>
          </div>
          <a href="${process.env.APP_URL || "https://autoreply.dz"}"
             style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;text-decoration:none;padding:14px 28px;border-radius:14px;font-weight:700;font-size:14px;">
            Go to Dashboard →
          </a>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">AutoReply · Made in Algeria 🇩🇿 · Unsubscribe anytime</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function adminLeadEmailHTML(lead) {
  return `
    <h2>🚀 New Lead: ${lead.firstName} ${lead.familyName}</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
      <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">Store</td><td style="padding:8px;border:1px solid #e2e8f0;">${lead.storeName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">Type</td><td style="padding:8px;border:1px solid #e2e8f0;">${lead.businessType}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #e2e8f0;">${lead.email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #e2e8f0;">${lead.phone || "N/A"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">Date</td><td style="padding:8px;border:1px solid #e2e8f0;">${new Date(lead.createdAt).toLocaleString()}</td></tr>
    </table>
  `;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AutoReply API is running.",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV || "development",
  });
});

app.post(
  "/api/get-started",
  strictLimiter,
  [
    body("firstName").trim().notEmpty().withMessage("First name is required.").isLength({ max: 50 }),
    body("familyName").trim().notEmpty().withMessage("Family name is required.").isLength({ max: 50 }),
    body("storeName").trim().notEmpty().withMessage("Store name is required.").isLength({ max: 100 }),
    body("businessType").trim().notEmpty().withMessage("Business type is required."),
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required."),
    body("phone").optional({ checkFalsy: true }).isMobilePhone().withMessage("Invalid phone number."),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { firstName, familyName, storeName, businessType, email, phone } = req.body;

    const duplicate = DB.leads.find((l) => l.email === email);
    if (duplicate) {
      return res.status(409).json({ error: "This email is already registered." });
    }

    const lead = {
      id: crypto.randomUUID(),
      firstName,
      familyName,
      storeName,
      businessType,
      email,
      phone: phone || null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    DB.leads.push(lead);

    console.log(`🚀 New Lead: ${firstName} ${familyName} — ${storeName} (${email})`);

    await sendEmail({
      to: email,
      subject: `Marhba ${firstName}! Your AutoReply bot is almost ready 🤖`,
      html: welcomeEmailHTML(firstName, storeName),
    });

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `🚀 New Lead: ${firstName} from ${storeName}`,
        html: adminLeadEmailHTML(lead),
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Check your email.",
      id: lead.id,
    });
  }
);

app.post(
  "/api/contact",
  strictLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 100 }),
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required."),
    body("phone").optional({ checkFalsy: true }).isMobilePhone(),
    body("message").trim().notEmpty().withMessage("Message is required.").isLength({ min: 10, max: 2000 }),
    body("subject").optional().trim().isLength({ max: 200 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { name, email, phone, subject, message } = req.body;

    const contact = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: phone || null,
      subject: subject || "General Inquiry",
      message,
      status: "unread",
      createdAt: new Date().toISOString(),
    };

    DB.contacts.push(contact);

    console.log(`✉️ Contact from: ${name} (${email})`);

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `✉️ Contact: ${contact.subject} — from ${name}`,
        html: `<h2>New Contact Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Subject:</strong> ${contact.subject}</p>
          <hr/>
          <p>${message.replace(/\n/g, "<br/>")}</p>`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Your message was received. We'll get back to you within 24 hours.",
    });
  }
);

app.post(
  "/api/subscribe",
  strictLimiter,
  [body("email").isEmail().normalizeEmail().withMessage("A valid email is required.")],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { email } = req.body;

    const exists = DB.subscribers.find((s) => s.email === email);
    if (exists) {
      return res.status(409).json({ error: "Already subscribed." });
    }

    DB.subscribers.push({ id: crypto.randomUUID(), email, createdAt: new Date().toISOString() });

    console.log(`📧 New subscriber: ${email}`);

    res.status(201).json({ success: true, message: "Subscribed successfully!" });
  }
);

app.get("/api/admin/leads", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  res.json({
    total: DB.leads.length,
    data: DB.leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
});

app.get("/api/admin/contacts", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  res.json({
    total: DB.contacts.length,
    unread: DB.contacts.filter((c) => c.status === "unread").length,
    data: DB.contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
});

app.get("/api/admin/stats", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  res.json({
    leads: {
      total: DB.leads.length,
      today: DB.leads.filter((l) => new Date(l.createdAt) >= todayStart).length,
    },
    contacts: {
      total: DB.contacts.length,
      unread: DB.contacts.filter((c) => c.status === "unread").length,
    },
    subscribers: { total: DB.subscribers.length },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error. Please try again." });
});

app.listen(PORT, () => {
  console.log("\n=========================================");
  console.log(`🔥  AutoReply API — port ${PORT}`);
  console.log(`📦  Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔑  Admin key: ${process.env.ADMIN_API_KEY ? "set ✓" : "NOT SET ⚠️"}`);
  console.log(`📧  SMTP: ${process.env.SMTP_USER ? "configured ✓" : "not configured"}`);
  console.log("=========================================\n");
});