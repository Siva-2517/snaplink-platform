const { Resend } = require('resend');

// Initialize Resend with API Key from environment variables
// Supports a console-log fallback for local development if no API Key is provided
const resendApiKey = process.env.RESEND_API_KEY;
let resendInstance = null;

if (resendApiKey && resendApiKey !== 're_your_api_key_here') {
  resendInstance = new Resend(resendApiKey);
} else {
  console.log('⚠️ RESEND_API_KEY is not configured or is a placeholder. Email service will run in MOCK Mode (logs to console).');
}

const sendEmail = async ({ to, subject, html }) => {
  const from = 'SnapLink <no-reply@codevista.studio>';

  if (resendInstance) {
    try {
      const response = await resendInstance.emails.send({
        from,
        to,
        subject,
        html
      });
      console.log(`✉️ Email sent successfully via Resend to ${to}. ID: ${response.data?.id}`);
      return response;
    } catch (error) {
      console.error(`❌ Resend Email Error sending to ${to}:`, error);
      throw error;
    }
  } else {
    console.log(`\n=================== [MOCK EMAIL SENT] ===================`);
    console.log(`From:    ${from}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log(`===========================================================\n`);
    return { data: { id: 'mock-email-id-' + Date.now() } };
  }
};

const sendVerificationOTP = async (email, username, otp) => {
  const subject = 'Verify your SnapLink account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #5f5dec 0%, #8b5cf6 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .otp-box { background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #5f5dec; border: 1px dashed #cbd5e1; margin: 25px 0; }
        .expiry { color: #e11d48; font-weight: 600; font-size: 14px; text-align: center; margin-bottom: 25px; }
        .security-note { font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 SnapLink</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${username || 'there'},</div>
          <p>Thank you for signing up for SnapLink! To complete your registration and activate your high-performance URL redirection workspace, please verify your email address using the code below:</p>
          <div class="otp-box">${otp}</div>
          <div class="expiry">⚠️ This verification code is valid for 10 minutes.</div>
          <p>If you did not create a SnapLink account, you can safely ignore this email.</p>
          <div class="security-note">
            <strong>Security Note:</strong> Never share your verification code with anyone. SnapLink support will never ask for this code.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SnapLink. All rights reserved.<br/>
          Empowering modern teams with caching redirection & real-time analytics.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject, html });
};

const sendWelcomeEmail = async (email, username) => {
  const subject = 'Welcome to SnapLink 🚀';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #5f5dec 0%, #8b5cf6 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .features-list { list-style: none; padding: 0; margin: 25px 0; }
        .feature-item { display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 15px; }
        .feature-icon { font-size: 20px; margin-right: 15px; flex-shrink: 0; }
        .feature-title { font-weight: 600; color: #0f172a; }
        .cta-container { text-align: center; margin: 30px 0; }
        .btn-cta { display: inline-block; background: #5f5dec; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(95, 93, 236, 0.3); }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Welcome to SnapLink</h1>
        </div>
        <div class="content">
          <div class="greeting">Welcome aboard, ${username || 'there'}!</div>
          <p>Your SnapLink account is verified and ready. You are now equipped with the ultimate high-performance, developer-grade URL shortener built for speed, security, and insight.</p>
          
          <p>Here are some of the key features at your disposal:</p>
          <ul class="features-list">
            <li class="feature-item">
              <span class="feature-icon">✂️</span>
              <div>
                <span class="feature-title">URL Shortening</span> — Create clean, brand-oriented redirect paths instantly.
              </div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">📈</span>
              <div>
                <span class="feature-title">Real-Time Analytics</span> — Monitor visitor clicks, unique browsers, countries, and Edge latency splits.
              </div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">📱</span>
              <div>
                <span class="feature-title">Dynamic QR Codes</span> — Instantly download clean, auto-generated vector codes for physical scanning.
              </div>
            </li>
            <li class="feature-item">
              <span class="feature-icon">🔗</span>
              <div>
                <span class="feature-title">Custom Back-Half Aliases</span> — Secure highly specific back-half URLs to boost trust and CTR.
              </div>
            </li>
          </ul>

          <div class="cta-container">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn-cta">Go to your Dashboard</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SnapLink. All rights reserved.<br/>
          Empowering modern teams with caching redirection & real-time analytics.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject, html });
};

const sendPasswordResetOTP = async (email, username, otp) => {
  const subject = 'Reset your SnapLink password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .otp-box { background: #fff1f2; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #e11d48; border: 1px dashed #f43f5e; margin: 25px 0; }
        .expiry { color: #e11d48; font-weight: 600; font-size: 14px; text-align: center; margin-bottom: 25px; }
        .security-note { font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${username || 'there'},</div>
          <p>We received a request to reset your SnapLink account password. Please use the verification code below to authorize this password change:</p>
          <div class="otp-box">${otp}</div>
          <div class="expiry">⚠️ This code is valid for 10 minutes.</div>
          <p>If you did not request a password reset, you can safely ignore this email. Your current password remains secure.</p>
          <div class="security-note">
            <strong>Security Warning:</strong> Never share this code with anyone. SnapLink support will never ask for this code.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SnapLink. All rights reserved.<br/>
          Empowering modern teams with caching redirection & real-time analytics.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject, html });
};

const sendPasswordChangedEmail = async (email, username) => {
  const subject = 'Your SnapLink password was changed';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .alert-box { background: #fef08a; border-radius: 8px; border: 1px solid #fef08a; padding: 15px; color: #854d0e; font-size: 14px; font-weight: 500; margin-bottom: 25px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Updated</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${username || 'there'},</div>
          <p>Your SnapLink account password was updated successfully.</p>
          
          <div class="alert-box">
            🛡️ If you did not perform this action, please contact SnapLink support immediately to secure your account.
          </div>
          
          <p>You can now log in to the dashboard using your new password.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SnapLink. All rights reserved.<br/>
          Empowering modern teams with caching redirection & real-time analytics.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendVerificationOTP,
  sendWelcomeEmail,
  sendPasswordResetOTP,
  sendPasswordChangedEmail
};
