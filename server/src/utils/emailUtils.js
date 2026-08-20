const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

const verifyEmailTransport = async () => {
  if (
    process.env.NODE_ENV === 'test' ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'your_brevo_smtp_password_here'
  ) {
    logger.info('Email SMTP transport running in simulation mode');
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

const sendEmail = async ({ to, subject, html }) => {
  if (
    process.env.NODE_ENV === 'test' ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'your_brevo_smtp_password_here'
  ) {
    logger.info(`[Email Simulated] To: ${to} | Subject: ${subject}`);
    return { messageId: 'simulated-email-id', accepted: [to], rejected: [] };
  }

  console.log('--- EMAIL DISPATCH STARTED ---');
  console.log(`recipient: ${to}`);
  console.log(`SMTP HOST configured: ${!!process.env.SMTP_HOST}`);
  console.log(`SMTP PORT configured: ${!!process.env.SMTP_PORT}`);
  console.log(`SMTP USER configured: ${!!process.env.SMTP_USER}`);
  console.log(`SMTP PASS configured: ${!!process.env.SMTP_PASS}`);

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
    logger.info(`Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    console.log('--- EMAIL DISPATCH SENT ---');
    console.log(`messageId: ${info.messageId}`);
    console.log(`accepted: ${JSON.stringify(info.accepted)}`);
    console.log(`rejected: ${JSON.stringify(info.rejected)}`);
    return info;
  } catch (err) {
    console.error('--- EMAIL DISPATCH FAILED ---');
    console.error(`error code: ${err.code || 'UNKNOWN'}`);
    console.error(`error command: ${err.command || 'UNKNOWN'}`);
    console.error(`error response: ${err.response || err.message}`);
    logger.error(`Email dispatch failed to ${to}: ${err.message}`);
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
  return await sendEmail({ to, subject, html });
};

const sendProjectInviteEmail = async (to, inviterName, projectName, inviteLink) => {
  const subject = `Invitation to join project: ${projectName}`;
  const html = `
    <h2>Project Invitation</h2>
    <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong>.</p>
    <p><a href="${inviteLink}" target="_blank">Accept Invitation & Join Project</a></p>
  `;
  return await sendEmail({ to, subject, html });
};

module.exports = {
  createTransporter,
  verifyEmailTransport,
  sendEmail,
  sendPasswordResetEmail,
  sendProjectInviteEmail,
};
