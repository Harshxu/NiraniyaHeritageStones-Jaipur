/* global process */
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'

dotenv.config()

const app = express()
const PORT = Number(process.env.API_PORT || 8787)

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'harshkumawat9950@gmail.com'

const SMTP_USER = String(process.env.SMTP_USER || '').trim()
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim()
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true'
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

app.use(express.json({ limit: '1mb' }))

function formatInquiryMessage(payload) {
  const lines = payload.items.map(
    (item) =>
      `- ${item.name} x${item.quantity} (${item.category} | ${item.stone} | ${item.size}) = INR ${item.lineTotal.toLocaleString('en-IN')}`,
  )

  return [
    'New inquiry from Niraniya Heritage Stones website',
    '',
    'Customer Details',
    `Name: ${payload.customer.name}`,
    `Phone: ${payload.customer.phone}`,
    `City: ${payload.customer.city || 'Not provided'}`,
    `Notes: ${payload.customer.notes || 'None'}`,
    '',
    'Selected Items',
    ...lines,
    '',
    `Estimated Total: INR ${payload.subtotal.toLocaleString('en-IN')}`,
  ].join('\n')
}

async function sendInquiryEmail(payload) {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Email not configured. Set SMTP_USER and SMTP_PASS.')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: SMTP_FROM,
    to: OWNER_EMAIL,
    subject: `New Inquiry: ${payload.customer.name} (${payload.customer.phone})`,
    text: formatInquiryMessage(payload),
  })
}

function buildPublicMessage(outcome) {
  if (outcome.email.ok) {
    return 'Your inquiry has been raised through email. We will contact you shortly.'
  }

  return 'Failed to send inquiry on email. Please try again.'
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'inquiry-api', providers: ['smtp-email'] })
})

app.post('/api/inquiries', async (req, res) => {
  const { customer, items, subtotal } = req.body || {}

  if (!customer?.name || !customer?.phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'Invalid inquiry payload. Name, phone, and cart items are required.',
    })
  }

  const payload = {
    customer: {
      name: String(customer.name).trim(),
      phone: String(customer.phone).trim(),
      city: String(customer.city || '').trim(),
      notes: String(customer.notes || '').trim(),
    },
    items: items.map((item) => ({
      name: item.name,
      category: item.category,
      stone: item.stone,
      size: item.size,
      quantity: Number(item.quantity),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(subtotal || 0),
  }

  const outcome = {
    email: { ok: false, error: '' },
  }

  try {
    await sendInquiryEmail(payload)
    outcome.email.ok = true
  } catch (error) {
    outcome.email.error = error.message || 'Email send failed.'
  }

  const ok = outcome.email.ok
  return res.status(ok ? 200 : 500).json({
    ok,
    message: buildPublicMessage(outcome),
    outcome,
  })
})

app.listen(PORT, () => {
  console.log(`Inquiry API running on http://localhost:${PORT}`)
})
