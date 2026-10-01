const { Resend } = require("resend");

let resend = null;

function getResend() {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY .env faylda topilmadi");
  }

  resend = new Resend(apiKey);

  return resend;
}

async function sendMail(to, subject, html) {
  const client = getResend();

  const { data, error } = await client.emails.send({
    from: process.env.RESEND_FROM || "onboarding@resend.dev",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("❌ Resend email xatosi:", error);
    throw new Error(error.message || "Email yuborilmadi");
  }

  console.log("✅ Email yuborildi:", to);
  console.log("📩 Resend ID:", data?.id);

  return data;
}

async function verifyMailer() {
  getResend();

  console.log("✅ Resend API tayyor");

  return true;
}

module.exports = {
  sendMail,
  verifyMailer,
};