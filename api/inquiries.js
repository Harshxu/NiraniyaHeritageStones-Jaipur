import nodemailer from 'nodemailer'

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'harshkumawat9950@gmail.com'
const SMTP_USER = String(process.env.SMTP_USER || '').trim()
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim()
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true'
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function sendInquiryEmail(payload) {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Email not configured. Set SMTP_USER and SMTP_PASS in Vercel environment variables.')
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

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

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

  try {
    await sendInquiryEmail(payload)
    return res.status(200).json({
      ok: true,
      message: 'Your inquiry has been raised through email. We will contact you shortly.',
      outcome: { email: { ok: true, error: '' } },
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to send inquiry on email. Please try again.',
      outcome: { email: { ok: false, error: error?.message || 'Email send failed.' } },
    })
  }
}
