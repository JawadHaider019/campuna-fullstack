import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY in environment variables.");
  }
  return new Resend(apiKey);
};

const getLogoConfig = () => {
  if (process.env.PUBLIC_LOGO_URL) {
    return {
      src: process.env.PUBLIC_LOGO_URL,
      attachments: [],
    };
  }

  // Try candidate asset paths
  const candidatePaths = [
    path.resolve(__dirname, '../assets/logo.png'),
    path.resolve(__dirname, '../assets/logo.webp'),
    path.resolve(__dirname, '../../../frontend/public/logo.png'),
    path.resolve(__dirname, '../../../frontend/public/logo.webp'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate);
        const isPng = candidate.endsWith('.png');
        return {
          src: 'cid:campuna-logo',
          attachments: [
            {
              filename: isPng ? 'logo.png' : 'logo.webp',
              content: content,
              content_id: 'campuna-logo',
              content_type: isPng ? 'image/png' : 'image/webp',
            },
          ],
        };
      } catch (err) {
        console.warn('⚠️ Warning: Failed to read email logo asset:', err.message);
      }
    }
  }

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return {
    src: `${baseUrl}/logo.png`,
    attachments: [],
  };
};

export const sendVerificationEmail = async (email, verificationToken) => {
  const resend = getResendClient();
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Campuna <onboarding@resend.dev>";
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  const logoConfig = getLogoConfig();

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: "Bestätige deine E-Mail-Adresse für Campuna®",
    attachments: logoConfig.attachments,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img 
            src="${logoConfig.src}" 
            alt="Campuna®" 
            width="170" 
            style="width: 170px; max-width: 100%; height: auto; display: inline-block; margin-bottom: 6px;"
          />
          <p style="color: #64748b; font-size: 13px; margin: 2px 0 0 0;">Dein Marktplatz für Camping, Wohnmobile & Abenteuer</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Willkommen bei Campuna!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse innerhalb von <strong>15 Minuten</strong>, um dein Konto zu aktivieren:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 14px 28px;
                background-color: #00630D;
                color: #ffffff;
                text-decoration: none;
                font-weight: 700;
                font-size: 14px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 99, 13, 0.25);
              "
            >
              E-Mail-Adresse bestätigen &rarr;
            </a>
            <p style="color: #64748b; font-size: 12px; margin-top: 12px;">
              Dieser Bestätigungslink ist 15 Minuten lang gültig.
            </p>
          </div>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Falls du kein Campuna-Konto erstellt hast, kannst du diese E-Mail einfach ignorieren.</p>
          <p style="margin-top: 6px;">&copy; ${new Date().getFullYear()} Campuna. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const sendPasswordResetOtpEmail = async (email, otpCode) => {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Campuna <onboarding@resend.dev>";
  const logoConfig = getLogoConfig();

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: `Dein Campuna® Bestätigungscode: ${otpCode}`,
    attachments: logoConfig.attachments,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img 
            src="${logoConfig.src}" 
            alt="Campuna®" 
            width="170" 
            style="width: 170px; max-width: 100%; height: auto; display: inline-block; margin-bottom: 6px;"
          />
          <p style="color: #64748b; font-size: 13px; margin: 2px 0 0 0;">Dein Marktplatz für Camping, Wohnmobile & Abenteuer</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Passwort zurücksetzen</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Verwende diesen 6-stelligen Bestätigungscode, um fortzufahren:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 14px 28px; background-color: #f0fdf4; border: 2px dashed #00630D; border-radius: 14px; font-family: monospace, Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00630D;">
              ${otpCode}
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Dieser Code ist 15 Minuten lang gültig.</p>
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
            Gib diesen Code bitte nicht an Dritte weiter. Campuna-Mitarbeiter werden dich niemals nach deinem Code fragen.
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail bitte einfach.</p>
          <p style="margin-top: 6px;">&copy; ${new Date().getFullYear()} Campuna. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export default {
  sendVerificationEmail,
  sendPasswordResetOtpEmail,
};
