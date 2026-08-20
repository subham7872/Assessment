const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = port === 465 || String(process.env.SMTP_PORT).trim() === '465';
  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim(),
    port,
    secure: isSecure,
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const verifyEmailTransport = async () => {
  if (
    process.env.NODE_ENV === 'test' ||
    (!process.env.SMTP_PASS && !process.env.BREVO_API_KEY)
  ) {
    logger.info('Email transport running in simulation mode');
    return true;
  }

  const isBrevoApi =
    process.env.EMAIL_PROVIDER === 'brevo_api' ||
    !!process.env.BREVO_API_KEY ||
    (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xkeysib-'));

  if (isBrevoApi) {
    const key = (process.env.BREVO_API_KEY || process.env.SMTP_PASS || '').trim();
    if (!key || key === 'your_brevo_smtp_password_here') {
      logger.warn('EMAIL BREVO HTTP API WARNING: BREVO_API_KEY is not configured');
      return false;
    }
    logger.info('EMAIL BREVO HTTP API TRANSPORT READY');
    console.log('EMAIL BREVO HTTP API TRANSPORT READY');
    return true;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('EMAIL SMTP CONNECTION SUCCESSFUL');
    console.log('EMAIL SMTP CONNECTION SUCCESSFUL');
    return true;
  } catch (error) {
    logger.error(`EMAIL SMTP CONNECTION FAILED: ${error.message}`);
    console.error(`EMAIL SMTP CONNECTION FAILED: ${error.message}`);
    return false;
  }
};

const sendEmail = async ({ to, subject, html, type = 'transactional' }) => {
  if (
    process.env.NODE_ENV === 'test' ||
    (!process.env.SMTP_PASS && !process.env.BREVO_API_KEY) ||
    process.env.SMTP_PASS === 'your_brevo_smtp_password_here'
  ) {
    logger.info(`[Email Simulated] To: ${to} | Subject: ${subject}`);
    return { messageId: 'simulated-email-id', accepted: [to], rejected: [] };
  }

  const apiKey = (
    process.env.BREVO_API_KEY ||
    (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xkeysib-') ? process.env.SMTP_PASS : '') ||
    (process.env.EMAIL_PROVIDER === 'brevo_api' ? process.env.SMTP_PASS : '')
  ).trim();

  const useBrevoApi = !!apiKey || process.env.EMAIL_PROVIDER === 'brevo_api';

  if (useBrevoApi) {
    if (!apiKey) {
      logger.error(`Brevo HTTP API Error: BREVO_API_KEY is missing (Recipient: ${to})`);
      throw new Error('BREVO_API_KEY environment variable is missing on Render');
    }

    const senderEmail = (process.env.SMTP_FROM || 'pintuduttafkt@gmail.com').trim();
    const senderName = (process.env.SMTP_FROM_NAME || 'FlowMatic').trim();

    console.log('--- BREVO HTTP API DISPATCH STARTED ---');
    console.log(`recipient: ${to}`);
    console.log(`email type: ${type}`);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        logger.info(`Email (${type}) sent successfully via Brevo HTTP API to ${to} (MessageId: ${data.messageId || 'brevo-sent'})`);
        console.log('--- BREVO HTTP API DISPATCH SENT ---');
        console.log(`messageId: ${data.messageId || 'brevo-sent'}`);
        return { messageId: data.messageId || 'brevo-sent', accepted: [to], rejected: [] };
      }

      const safeErrorMessage = data.message || data.code || `HTTP ${response.status}`;
      logger.error(`Brevo HTTP API dispatch failed [Status ${response.status}]: ${safeErrorMessage} (Recipient: ${to}, Type: ${type})`);
      console.error('--- BREVO HTTP API DISPATCH FAILED ---');
      console.error(`HTTP Status: ${response.status}`);
      console.error(`Error Message: ${safeErrorMessage}`);
      throw new Error(`Brevo HTTP API failed (${response.status}): ${safeErrorMessage}`);
    } catch (err) {
      logger.error(`Email dispatch error via Brevo HTTP API to ${to}: ${err.message}`);
      throw err;
    }
  }

  // Fallback to Nodemailer SMTP for local development
  console.log('--- EMAIL SMTP DISPATCH STARTED ---');
  console.log(`recipient: ${to}`);

  try {
    const transporter = createTransporter();
    const senderAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'FlowMatic'}" <${senderAddress}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email (${type}) sent successfully via SMTP to ${to} (MessageId: ${info.messageId})`);
    console.log('--- EMAIL SMTP DISPATCH SENT ---');
    console.log(`messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`SMTP email dispatch failed to ${to}: ${err.message}`);
    console.error('--- EMAIL SMTP DISPATCH FAILED ---');
    console.error(`error code: ${err.code || 'UNKNOWN'}`);
    console.error(`error response: ${err.response || err.message}`);
    throw err;
  }
};

const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Please click the link below to reset your password:</p>
    <p><a href="${resetUrl}" target="_blank">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
  `;
  return await sendEmail({ to, subject, html, type: 'password_reset' });
};

const sendProjectInviteEmail = async (to, inviterName, projectName, inviteLink) => {
  const subject = `Invitation to join project: ${projectName}`;
  const html = `
    <h2>Project Invitation</h2>
    <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong>.</p>
    <p><a href="${inviteLink}" target="_blank">Accept Invitation & Join Project</a></p>
  `;
  return await sendEmail({ to, subject, html, type: 'project_invite' });
};

module.exports = {
  createTransporter,
  verifyEmailTransport,
  sendEmail,
  sendPasswordResetEmail,
  sendProjectInviteEmail,
};
