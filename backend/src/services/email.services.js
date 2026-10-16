import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Brevo Transactional Email Client (via Brevo REST API v3)
 */
const sendBrevoEmail = async ({ to, subject, htmlContent, replyTo, sender }) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.BRAVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const senderEmail = sender?.email || process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || "kontakt@campuna.de";
  const senderName = sender?.name || process.env.BREVO_SENDER_NAME || "Campuna";

  if (!apiKey) {
    console.warn('⚠️ [Brevo Warning] BREVO_API_KEY is not configured in .env. Email was logged instead of sent:');
    console.log(`To: ${JSON.stringify(to)} | Subject: ${subject}`);
    return { success: false, simulated: true, message: 'BREVO_API_KEY not set' };
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: Array.isArray(to) ? to : [{ email: to }],
    subject,
    htmlContent,
  };

  if (replyTo) {
    payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData?.message || `Brevo API returned status ${response.status}`;
    console.error('❌ Brevo Email Send Error:', errorMsg, responseData);
    throw new Error(errorMsg);
  }

  return responseData;
};

/**
 * Email layout wrapper with Campuna brand design
 */
const wrapEmailTemplate = ({ title, preheader = '', contentHtml }) => {
  const baseUrl = process.env.FRONTEND_URL || "https://campuna.de";
  const logoUrl = `${baseUrl}/logo.png`;
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #F8F9FA; padding: 36px 12px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .header { background: linear-gradient(135deg, #0A2E1C 0%, #00630D 100%); padding: 32px 28px; text-align: center; }
        .content { padding: 32px 28px; color: #1F2937; line-height: 1.65; }
        .footer { padding: 24px 28px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; text-align: center; font-size: 12px; color: #9CA3AF; }
        .btn { display: inline-block; background-color: #00630D; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 99, 13, 0.3); }
        .btn:hover { background-color: #004D0A; }
        .badge-code { display: inline-block; background: #F0FDF4; border: 2px dashed #00630D; color: #00630D; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 24px; border-radius: 14px; font-family: monospace, Courier, sans-serif; }
      </style>
    </head>
    <body>
      ${preheader ? `<div style="display:none;font-size:1px;color:#F8F9FA;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">CAMPUNA</h1>
            <p style="color: #A7F3D0; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Dein Marktplatz für Camping & Abenteuer</p>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0;">Campuna &bull; Premnitzer Straße 8, 99091 Erfurt</p>
            <p style="margin: 0 0 10px 0;"><a href="${baseUrl}/datenschutz" style="color: #6B7280; text-decoration: underline;">Datenschutz</a> &bull; <a href="${baseUrl}/impressum" style="color: #6B7280; text-decoration: underline;">Impressum</a> &bull; <a href="${baseUrl}/kontakt" style="color: #6B7280; text-decoration: underline;">Kontakt</a></p>
            <p style="margin: 0; font-size: 11px; color: #9CA3AF;">&copy; ${currentYear} Campuna. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 1. Send Email Verification Link via Brevo
 */
export const sendVerificationEmail = async (email, verificationToken, firstName = '') => {
  const baseUrl = process.env.FRONTEND_URL || "https://campuna.de";
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  const greeting = firstName ? `Hallo ${firstName},` : 'Hallo und herzlich willkommen,';

  const htmlContent = wrapEmailTemplate({
    title: 'Bestätige deine E-Mail-Adresse für Campuna',
    preheader: 'Bitte bestätige deine E-Mail-Adresse innerhalb von 15 Minuten, um dein Konto zu aktivieren.',
    contentHtml: `
      <h2 style="color: #0A2E1C; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">${greeting}</h2>
      <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
        Vielen Dank für deine Registrierung bei Campuna! Bitte bestätige deine E-Mail-Adresse innerhalb von <strong>15 Minuten</strong>, um dein Benutzerkonto vollständig zu aktivieren:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" class="btn">
          E-Mail-Adresse jetzt bestätigen &rarr;
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 14px; margin-bottom: 0;">
          Dieser Link ist aus Sicherheitsgründen <strong>15 Minuten</strong> gültig.
        </p>
      </div>

      <div style="background-color: #F9FAFB; border-left: 4px solid #00630D; padding: 14px 16px; border-radius: 8px; margin-top: 24px;">
        <p style="color: #4B5563; font-size: 13px; margin: 0;">
          <strong>Link funktioniert nicht?</strong> Kopiere diese Adresse in deinen Browser:<br>
          <a href="${verificationUrl}" style="color: #00630D; word-break: break-all; font-size: 12px;">${verificationUrl}</a>
        </p>
      </div>

      <p style="color: #9CA3AF; font-size: 13px; margin-top: 24px; margin-bottom: 0;">
        Falls du dieses Konto nicht angefordert hast, kannst du diese Nachricht einfach ignorieren.
      </p>
    `,
  });

  return sendBrevoEmail({
    to: email,
    subject: "Bestätige deine E-Mail-Adresse für Campuna®",
    htmlContent,
  });
};

/**
 * 2. Send Forgot Password OTP Code via Brevo
 */
export const sendPasswordResetOtpEmail = async (email, otpCode) => {
  const htmlContent = wrapEmailTemplate({
    title: 'Passwort zurücksetzen – Campuna',
    preheader: `Dein 6-stelliger Sicherheitscode zum Zurücksetzen deines Passworts lautet: ${otpCode}`,
    contentHtml: `
      <h2 style="color: #0A2E1C; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Passwort zurücksetzen</h2>
      <p style="color: #374151; font-size: 15px; margin-bottom: 24px;">
        Wir haben eine Anfrage zum Zurücksetzen deines Passworts für dein Campuna-Konto erhalten. Gib folgenden 6-stelligen Bestätigungscode ein:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <div class="badge-code">
          ${otpCode}
        </div>
        <p style="color: #6B7280; font-size: 13px; margin-top: 12px; margin-bottom: 0;">
          Dieser Code ist <strong>15 Minuten</strong> lang gültig.
        </p>
      </div>

      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 16px; border-radius: 8px; margin-top: 24px;">
        <p style="color: #991B1B; font-size: 13px; margin: 0;">
          <strong>Sicherheitshinweis:</strong> Gib diesen Code niemals an Dritte weiter. Campuna-Mitarbeiter werden dich niemals nach deinem Bestätigungscode fragen.
        </p>
      </div>

      <p style="color: #9CA3AF; font-size: 13px; margin-top: 24px; margin-bottom: 0;">
        Falls du diese Anfrage nicht gestellt hast, wurde dein Passwort nicht geändert. Du kannst diese E-Mail ignorieren.
      </p>
    `,
  });

  return sendBrevoEmail({
    to: email,
    subject: `Dein Campuna® Sicherheitscode: ${otpCode}`,
    htmlContent,
  });
};

/**
 * 3. Send Contact Form Submission (To Campuna Support & Notification to Sender)
 */
export const sendContactEmail = async ({ name, email, topic, subject, message, phone }) => {
  const adminEmail = process.env.BREVO_CONTACT_EMAIL || process.env.CONTACT_EMAIL || "kontakt@campuna.de";
  const topicLabels = {
    general: 'Allgemeine Anfrage',
    seller: 'Verkaufen & Inserate',
    buyer: 'Kaufen & Suche',
    commercial: 'Gewerbliche Händler & Partnerschaften',
    technical: 'Technischer Support & Bug-Meldung',
    feedback: 'Feedback & Feature-Wunsch',
  };
  const topicName = topicLabels[topic] || topic || 'Allgemeine Anfrage';
  const mailSubject = subject ? `[Kontaktformular] ${topicName}: ${subject}` : `[Kontaktformular] Neue Nachricht von ${name}`;

  // 1. Notify Admin Team
  const adminNotificationHtml = wrapEmailTemplate({
    title: `Neue Kontaktanfrage: ${name}`,
    preheader: `Neue Kontaktanfrage von ${name} (${email}) zum Thema "${topicName}"`,
    contentHtml: `
      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <h3 style="color: #065F46; margin: 0 0 6px 0; font-size: 16px;">Neue Nachricht über das Kontaktformular</h3>
        <p style="color: #047857; margin: 0; font-size: 13px;">Eingegangen über <a href="https://campuna.de/kontakt" style="color: #065F46; font-weight: bold;">campuna.de/kontakt</a></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 0; font-weight: bold; color: #4B5563; width: 140px;">Absender:</td>
          <td style="padding: 10px 0; color: #111827;">${name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 0; font-weight: bold; color: #4B5563;">E-Mail:</td>
          <td style="padding: 10px 0; color: #111827;"><a href="mailto:${email}" style="color: #00630D; font-weight: bold;">${email}</a></td>
        </tr>
        ${phone ? `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 0; font-weight: bold; color: #4B5563;">Telefon:</td>
          <td style="padding: 10px 0; color: #111827;"><a href="tel:${phone}" style="color: #111827;">${phone}</a></td>
        </tr>
        ` : ''}
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 0; font-weight: bold; color: #4B5563;">Themenbereich:</td>
          <td style="padding: 10px 0; color: #111827;"><span style="display:inline-block; padding: 3px 8px; background-color: #E0E7FF; color: #3730A3; border-radius: 6px; font-size: 12px; font-weight: 600;">${topicName}</span></td>
        </tr>
        ${subject ? `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 0; font-weight: bold; color: #4B5563;">Betreff:</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 600;">${subject}</td>
        </tr>
        ` : ''}
      </table>

      <h4 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Nachrichtentext:</h4>
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; color: #1E293B; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
        ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
      
      <div style="margin-top: 24px; text-align: center;">
        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || topicName)}" class="btn">
          Direkt antworten an ${name} &rarr;
        </a>
      </div>
    `,
  });

  const adminResult = await sendBrevoEmail({
    to: adminEmail,
    replyTo: { email, name },
    subject: mailSubject,
    htmlContent: adminNotificationHtml,
  });

  return adminResult;
};

/**
 * 4. Send Statutory Contract Cancellation Confirmation Email (§ 312k Abs. 4 BGB)
 * Includes transaction details, effective date, and (for guest requests) a secure 1-click Revocation / Dispute link.
 */
export const sendCancellationReceiptEmail = async ({
  to,
  name,
  confirmationNumber,
  timestamp,
  contractType = 'Campuna Business-Tarif',
  effectiveDate,
  isAuthenticated = false,
  revocationUrl = null,
}) => {
  const isGuest = !isAuthenticated;

  const securitySection = (isGuest && revocationUrl) ? `
    <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px 22px; margin: 26px 0;">
      <h3 style="color: #92400E; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
        🛡️ Wichtiger Sicherheitshinweis & Kontoschutz
      </h3>
      <p style="color: #B45309; font-size: 13px; margin: 0 0 12px 0; line-height: 1.5;">
        Diese Kündigungserklärung wurde <strong>ohne vorherige Anmeldung</strong> über das öffentliche Kündigungsformular eingereicht. 
        Deine bezahlten Vorteile bleiben bis zum regulären Laufzeitende aktiv.
      </p>
      <p style="color: #78350F; font-size: 13px; font-weight: 600; margin: 0 0 14px 0;">
        <strong>Warst du das NICHT?</strong> Falls ein Dritter deine E-Mail-Adresse irrtümlich oder unberechtigt verwendet hat, klicke auf diesen Link, um die Kündigung sofort mit 1 Klick zu widerrufen:
      </p>
      <div style="text-align: center; margin: 16px 0;">
        <a href="${revocationUrl}" style="display: inline-block; background-color: #DC2626; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);">
          Kündigung sofort widerrufen & mein Konto schützen &rarr;
        </a>
      </div>
      <p style="color: #92400E; font-size: 11px; margin: 10px 0 0 0; text-align: center;">
        Dieser Schutz-Link ist 30 Tage gültig. Nach dem Klick wird die Erklärung sofort storniert.
      </p>
    </div>
  ` : `
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
      <p style="color: #166534; font-size: 13px; margin: 0;">
        ✅ <strong>Verifizierte Erklärung:</strong> Du warst während dieser Erklärung mit deinem Campuna-Konto angemeldet. Dein Kündigungswunsch wurde rechtswirksam erfasst.
      </p>
    </div>
  `;

  const htmlContent = wrapEmailTemplate({
    title: `Gesetzliche Kündigungsbestätigung (${confirmationNumber}) – Campuna`,
    preheader: `Bestätigung über den Eingang deiner Kündigungserklärung gem. § 312k Abs. 4 BGB. Vorgangsnummer: ${confirmationNumber}`,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #DC2626; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 9999px;">
          Gesetzliche Eingangsbestätigung (§ 312k Abs. 4 BGB)
        </span>
        <h2 style="color: #0A2E1C; font-size: 22px; font-weight: 800; margin: 14px 0 6px 0;">
          Kündigung erfolgreich eingegangen
        </h2>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          Deine Erklärung wurde elektronisch erfasst und archiviert.
        </p>
      </div>

      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 14px; padding: 20px 22px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280; width: 160px;">Vorgangsnummer:</td>
            <td style="padding: 9px 0; color: #111827; font-family: monospace; font-weight: 700;">${confirmationNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280;">Eingangszeitpunkt:</td>
            <td style="padding: 9px 0; color: #111827; font-weight: 600;">${timestamp}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280;">E-Mail-Adresse:</td>
            <td style="padding: 9px 0; color: #111827;">${to}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280;">Gekündigter Vertrag:</td>
            <td style="padding: 9px 0; color: #111827; font-weight: 600;">${contractType}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #6B7280;">Wirksam zum:</td>
            <td style="padding: 9px 0; color: #DC2626; font-weight: 700;">${effectiveDate}</td>
          </tr>
        </table>
      </div>

      ${securitySection}

      <div style="background-color: #F3F4F6; border-radius: 10px; padding: 14px 18px; margin-top: 20px;">
        <p style="color: #4B5563; font-size: 12px; margin: 0; line-height: 1.5;">
          <strong>Gesetzlicher Hinweis:</strong> Diese Bestätigung erfüllt die Pflichten zur unverzüglichen elektronischen Bestätigung des Eingangs einer Kündigungserklärung auf einem dauerhaften Datenträger nach § 312k Abs. 4 BGB. Bitte bewahre diese E-Mail für deine Unterlagen auf.
        </p>
      </div>
    `,
  });

  return sendBrevoEmail({
    to,
    subject: `Gesetzliche Kündigungsbestätigung (${confirmationNumber}) – Campuna`,
    htmlContent,
  });
};

/**
 * 5. Send Cancellation Revocation Confirmation Email
 */
export const sendCancellationRevokedEmail = async ({ to, name, confirmationNumber }) => {
  const baseUrl = process.env.FRONTEND_URL || "https://campuna.de";

  const htmlContent = wrapEmailTemplate({
    title: 'Kündigung erfolgreich widerrufen – Campuna',
    preheader: `Deine Kündigung (${confirmationNumber}) wurde erfolgreich widerrufen. Dein Abonnement läuft wie gewohnt weiter.`,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #00630D; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 9999px;">
          Bestätigung über Widerruf
        </span>
        <h2 style="color: #0A2E1C; font-size: 22px; font-weight: 800; margin: 14px 0 6px 0;">
          Kündigung erfolgreich widerrufen
        </h2>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          Die Kündigungserklärung zu Vorgangsnummer <strong>${confirmationNumber}</strong> wurde vollständig annulliert.
        </p>
      </div>

      <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
        <p style="color: #166534; font-size: 15px; margin: 0 0 10px 0; font-weight: 600;">
          🛡️ Dein Konto und dein Tarif sind gesichert.
        </p>
        <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
          Es werden keine vorzeitigen Änderungen oder Beendigungen an deinen gebuchten Leistungen vorgenommen. Dein Profil, deine Inseratslimits und deine Unternehmenspräsenz bleiben uneingeschränkt aktiv.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${baseUrl}/mein-konto" class="btn">
          Zu meinem Kundenkonto &rarr;
        </a>
      </div>
    `,
  });

  return sendBrevoEmail({
    to,
    subject: `Bestätigung: Kündigung (${confirmationNumber}) erfolgreich widerrufen – Campuna`,
    htmlContent,
  });
};

/**
 * 6. Send Cancellation Verification Email with "Kündigung bestätigen (Das war ich)" button
 * Sent before executing the cancellation for unauthenticated guests.
 */
export const sendCancellationVerificationEmail = async ({
  to,
  name,
  contractType = 'Campuna Business-Tarif',
  effectiveDateChoice = 'Zum regulären Laufzeitende',
  confirmationUrl,
}) => {
  const htmlContent = wrapEmailTemplate({
    title: 'Bitte bestätige deine Kündigung (Das war ich) – Campuna',
    preheader: 'Bitte bestätige deine Kündigung mit einem Klick auf die Schaltfläche.',
    contentHtml: `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #00630D; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 9999px;">
          Bestätigung erforderlich
        </span>
        <h2 style="color: #0A2E1C; font-size: 22px; font-weight: 800; margin: 14px 0 6px 0;">
          Kündigung bitte bestätigen
        </h2>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          Wir haben eine Kündigungsanfrage für deinen Campuna Vertrag erhalten.
        </p>
      </div>

      <p style="color: #374151; font-size: 15px; margin-bottom: 20px; line-height: 1.6;">
        Hallo ${name || 'Kunde'},<br>
        um sicherzustellen, dass diese Kündigung tatsächlich von dir veranlasst wurde und dein Konto vor unbefugtem Fremdzugriff geschützt ist, bestätige den Vorgang bitte über die folgende Schaltfläche:
      </p>

      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280; width: 160px;">E-Mail-Adresse:</td>
            <td style="padding: 9px 0; color: #111827; font-weight: 600;">${to}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 9px 0; color: #6B7280;">Vertrag / Leistung:</td>
            <td style="padding: 9px 0; color: #111827; font-weight: 600;">${contractType}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #6B7280;">Gewünschte Beendigung:</td>
            <td style="padding: 9px 0; color: #00630D; font-weight: 700;">${effectiveDateChoice}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmationUrl}" class="btn" style="background-color: #00630D; color: #ffffff !important; font-weight: 800; font-size: 16px; padding: 16px 36px; border-radius: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 16px rgba(0, 99, 13, 0.35);">
          Kündigung bestätigen (Das war ich) &rarr;
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 14px; margin-bottom: 0;">
          Dieser Bestätigungslink ist aus Sicherheitsgründen <strong>24 Stunden</strong> lang gültig.
        </p>
      </div>

      <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 16px 18px; margin-top: 24px;">
        <p style="color: #92400E; font-size: 13px; margin: 0; line-height: 1.5;">
          <strong>Warst du das NICHT?</strong><br>
          Falls du diese Kündigung nicht selbst angefordert hast oder jemand Fremdes deine E-Mail-Adresse eingegeben hat, kannst du diese Nachricht einfach <strong>ignorieren</strong>. Ohne Klick auf die Bestätigungsschaltfläche wird <strong>keine Kündigung ausgeführt</strong> und dein Vertrag bleibt unverändert aktiv.
        </p>
      </div>
    `,
  });

  return sendBrevoEmail({
    to,
    subject: "Bitte bestätige deine Kündigung (Das war ich) – Campuna®",
    htmlContent,
  });
};

export default {
  sendVerificationEmail,
  sendPasswordResetOtpEmail,
  sendContactEmail,
  sendCancellationReceiptEmail,
  sendCancellationRevokedEmail,
  sendCancellationVerificationEmail,
};

