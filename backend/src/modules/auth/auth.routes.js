const router = require("express").Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { query, withTransaction } = require("../../config/db");
const {
  generateOtp,
  hashOtp,
  normalizeOtp,
  OTP_TTL_MINUTES,
} = require("../../utils/otp");

const { sendMail } = require("../../utils/mailer");
const { auth } = require("../../middlewares/auth");

const OTP_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60
);

const MAX_OTP_ATTEMPTS = Number(
  process.env.OTP_MAX_ATTEMPTS || 5
);

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      is_verified: true,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  return /^\+998\d{9}$/.test(phone);
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

function validateRegister(body) {
  const full_name = String(body.full_name || "")
    .trim()
    .replace(/\s+/g, " ");

  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  const phone = String(body.phone || "").trim();

  const password = String(body.password || "");

  if (full_name.length < 2 || full_name.length > 50) {
    return {
      error: "To‘liq ism 2–50 belgi bo‘lishi kerak.",
    };
  }

  if (!validEmail(email) || email.length > 100) {
    return {
      error: "Email formati noto‘g‘ri.",
    };
  }

  if (!validPhone(phone)) {
    return {
      error: "Telefon +998XXXXXXXXX formatida bo‘lishi kerak.",
    };
  }

  if (!validPassword(password)) {
    return {
      error:
        "Parol 8–72 belgi, kamida 1 harf va 1 raqamdan iborat bo‘lsin.",
    };
  }

  return {
    full_name,
    email,
    phone,
    password,
  };
}

function validateVerify(body) {
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  const code = normalizeOtp(body.code);

  if (!validEmail(email) || !/^\d{6}$/.test(code)) {
    return null;
  }

  return {
    email,
    code,
  };
}

async function createAndSendOtp(userId, email) {
  const code = generateOtp();
  const codeHash = hashOtp(code);

  // Eski ishlatilmagan OTP kodlarni bekor qilamiz.
  await query(
    `UPDATE otp_codes
     SET is_used = true
     WHERE user_id = $1
       AND purpose = 'verify'
       AND is_used = false`,
    [userId]
  );

  // Yangi OTP yaratamiz.
  await query(
    `INSERT INTO otp_codes
      (user_id, code_hash, purpose, expires_at, attempts)
     VALUES
      ($1, $2, 'verify', NOW() + ($3 * INTERVAL '1 minute'), 0)`,
    [userId, codeHash, OTP_TTL_MINUTES]
  );

  try {
    const result = await sendMail(
      email,
      "Topildi — email tasdiqlash kodi",
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <h2 style="color:#111827">Topildi</h2>

        <p>Emailingizni tasdiqlash uchun quyidagi 6 xonali kodni kiriting:</p>

        <div style="
          font-size:36px;
          font-weight:700;
          letter-spacing:10px;
          padding:20px 0;
        ">
          ${code}
        </div>

        <p>
          Kod <strong>${OTP_TTL_MINUTES} daqiqa</strong> amal qiladi.
        </p>

        <p style="color:#6b7280">
          Agar bu amalni siz bajarmagan bo‘lsangiz,
          ushbu xabarni e’tiborsiz qoldiring.
        </p>
      </div>
      `
    );

    console.log("=================================");
    console.log("✅ YANGI OTP EMAIL YUBORILDI");
    console.log("📧 Email:", email);
    console.log("🔢 OTP:", code);
    console.log("📨 Resend ID:", result?.id || "ID yo‘q");
    console.log("=================================");

    return result;
  } catch (error) {
    await query(
      `UPDATE otp_codes
       SET is_used = true
       WHERE user_id = $1
         AND purpose = 'verify'
         AND code_hash = $2`,
      [userId, codeHash]
    );

    console.error("❌ OTP email yuborishda xato:", error);

    throw error;
  }
}

/* =========================
   REGISTER
========================= */

router.post("/register", async (req, res) => {
  try {
    const data = validateRegister(req.body);

    if (data.error) {
      return res.status(400).json({
        success: false,
        message: data.error,
      });
    }

    const existing = await query(
      `SELECT id, email, is_verified, full_name, phone, role
       FROM users
       WHERE email = $1`,
      [data.email]
    );

    /* =========================
       USER OLDIN BOR BO'LSA
    ========================= */

    if (existing.rowCount) {
      const user = existing.rows[0];

      if (user.is_verified) {
        return res.status(409).json({
          success: false,
          message: "Bu email allaqachon ro‘yxatdan o‘tgan.",
        });
      }

      const latest = await query(
        `SELECT created_at
         FROM otp_codes
         WHERE user_id = $1
           AND purpose = 'verify'
           AND is_used = false
         ORDER BY id DESC
         LIMIT 1`,
        [user.id]
      );

      if (latest.rowCount) {
        const createdAt = new Date(
          latest.rows[0].created_at
        ).getTime();

        const elapsed =
          Date.now() - createdAt;

        if (
          elapsed <
          OTP_COOLDOWN_SECONDS * 1000
        ) {
          const remaining = Math.ceil(
            (OTP_COOLDOWN_SECONDS * 1000 - elapsed) /
            1000
          );

          return res.status(429).json({
            success: false,
            message: `Yangi kodni ${remaining} soniyadan keyin so‘rang.`,
          });
        }
      }

      await createAndSendOtp(
        user.id,
        user.email
      );

      return res.status(202).json({
        success: true,
        message:
          "Yangi tasdiqlash kodi emailingizga yuborildi.",
        data: {
          email: user.email,
          expires_in_minutes: OTP_TTL_MINUTES,
        },
      });
    }

    /* =========================
       YANGI USER
    ========================= */

    const passwordHash = await bcrypt.hash(
      data.password,
      12
    );

    const user = await withTransaction(
      async (client) => {
        const inserted = await client.query(
          `INSERT INTO users
            (full_name, email, phone, password)
           VALUES
            ($1, $2, $3, $4)
           RETURNING
            id,
            full_name,
            email,
            phone,
            role,
            is_verified,
            created_at`,
          [
            data.full_name,
            data.email,
            data.phone,
            passwordHash,
          ]
        );

        return inserted.rows[0];
      }
    );

    try {
      await createAndSendOtp(
        user.id,
        user.email
      );
    } catch (mailError) {
      console.error(
        "❌ Registration email error:",
        mailError.message
      );

      return res.status(503).json({
        success: false,
        message:
          "Email yuborilmadi. Resend sozlamalarini tekshiring.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Ro‘yxatdan o‘tish muvaffaqiyatli. Tasdiqlash kodi emailingizga yuborildi.",
      data: {
        email: user.email,
        expires_in_minutes: OTP_TTL_MINUTES,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server xatosi.",
    });
  }
});

/* =========================
   VERIFY OTP
========================= */

router.post("/verify", async (req, res) => {
  try {
    const input = validateVerify(req.body);

    if (!input) {
      return res.status(400).json({
        success: false,
        message:
          "Email yoki 6 xonali kod noto‘g‘ri.",
      });
    }

    const result = await withTransaction(
      async (client) => {
        const found = await client.query(
          `SELECT
            u.id,
            u.email,
            u.full_name,
            u.phone,
            u.role,
            u.is_verified,
            o.id AS otp_id,
            o.code_hash,
            o.expires_at,
            o.attempts
           FROM users u
           JOIN otp_codes o
             ON o.user_id = u.id
           WHERE u.email = $1
             AND o.purpose = 'verify'
             AND o.is_used = false
           ORDER BY o.id DESC
           LIMIT 1
           FOR UPDATE OF o`,
          [input.email]
        );

        if (!found.rowCount) {
          return {
            status: 400,
            message:
              "Kod noto‘g‘ri yoki muddati tugagan.",
          };
        }

        const row = found.rows[0];

        if (row.is_verified) {
          return {
            status: 200,
            alreadyVerified: true,
            user: row,
          };
        }

        if (
          row.attempts >= MAX_OTP_ATTEMPTS
        ) {
          return {
            status: 429,
            message:
              "Juda ko‘p noto‘g‘ri urinish. Yangi kod so‘rang.",
          };
        }

        if (
          new Date(row.expires_at).getTime() <=
          Date.now()
        ) {
          return {
            status: 400,
            message:
              "Kodning amal qilish muddati tugagan. Yangi kod so‘rang.",
          };
        }

        const incomingHash =
          hashOtp(input.code);

        if (
          incomingHash !== row.code_hash
        ) {
          await client.query(
            `UPDATE otp_codes
             SET attempts = attempts + 1
             WHERE id = $1`,
            [row.otp_id]
          );

          const remaining = Math.max(
            0,
            MAX_OTP_ATTEMPTS -
            row.attempts -
            1
          );

          return {
            status: 400,
            message: remaining
              ? `Kod noto‘g‘ri. Qolgan urinish: ${remaining}.`
              : "Kod noto‘g‘ri. Yangi kod so‘rang.",
          };
        }

        await client.query(
          `UPDATE users
           SET is_verified = true
           WHERE id = $1`,
          [row.id]
        );

        await client.query(
          `UPDATE otp_codes
           SET is_used = true
           WHERE id = $1`,
          [row.otp_id]
        );

        return {
          status: 200,
          user: {
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            phone: row.phone,
            role: row.role,
          },
        };
      }
    );

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    const user = result.user;

    return res.json({
      success: true,
      message:
        "Email tasdiqlandi. Kirish muvaffaqiyatli.",
      data: {
        token: signToken(user),
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: true,
        },
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/verify error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server xatosi.",
    });
  }
});

/* =========================
   RESEND OTP
========================= */

router.post("/resend", async (req, res) => {
  try {
    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email formati noto‘g‘ri.",
      });
    }

    const userResult = await query(
      `SELECT id, email, is_verified
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (!userResult.rowCount) {
      return res.json({
        success: true,
        message:
          "Agar tasdiqlash talab qilinsa, yangi kod yuborildi.",
      });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.json({
        success: true,
        message:
          "Bu email allaqachon tasdiqlangan.",
      });
    }

    const latest = await query(
      `SELECT created_at
       FROM otp_codes
       WHERE user_id = $1
         AND purpose = 'verify'
         AND is_used = false
       ORDER BY id DESC
       LIMIT 1`,
      [user.id]
    );

    if (latest.rowCount) {
      const elapsed =
        Date.now() -
        new Date(
          latest.rows[0].created_at
        ).getTime();

      if (
        elapsed <
        OTP_COOLDOWN_SECONDS * 1000
      ) {
        const remaining = Math.ceil(
          (OTP_COOLDOWN_SECONDS * 1000 -
            elapsed) /
          1000
        );

        return res.status(429).json({
          success: false,
          message: `Yangi kodni ${remaining} soniyadan keyin so‘rang.`,
        });
      }
    }

    await createAndSendOtp(
      user.id,
      user.email
    );

    return res.json({
      success: true,
      message:
        "Yangi tasdiqlash kodi emailingizga yuborildi.",
      data: {
        email: user.email,
        expires_in_minutes: OTP_TTL_MINUTES,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/resend error:",
      error
    );

    return res.status(503).json({
      success: false,
      message:
        "Email yuborilmadi. Keyinroq qayta urinib ko‘ring.",
    });
  }
});

/* =========================
   LOGIN
========================= */

router.post("/login", async (req, res) => {
  try {
    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ""
    );

    if (!validEmail(email) || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email va parolni kiriting.",
      });
    }

    const result = await query(
      `SELECT
        id,
        full_name,
        email,
        phone,
        password,
        role,
        is_verified,
        created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (!result.rowCount) {
      return res.status(401).json({
        success: false,
        message:
          "Email yoki parol xato.",
      });
    }

    const user = result.rows[0];

    const passwordOk =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message:
          "Email yoki parol xato.",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Avval emailingizni tasdiqlang.",
        data: {
          email: user.email,
        },
      });
    }

    delete user.password;

    return res.json({
      success: true,
      message:
        "Kirish muvaffaqiyatli.",
      data: {
        token: signToken(user),
        user,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server xatosi.",
    });
  }
});

/* =========================
   ME
========================= */

router.get("/me", auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        id,
        full_name,
        email,
        phone,
        role,
        is_verified,
        created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message:
          "Foydalanuvchi topilmadi.",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "GET /api/auth/me error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server xatosi.",
    });
  }
});

module.exports = router;