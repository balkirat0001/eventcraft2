const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      text,
      html: html || text
    };
    
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error };
  }
};

// Template helpers for common emails
const sendEventConfirmation = async (user, event) => {
  return sendEmail({
    to: user.email,
    subject: `Registration Confirmed: ${event.title}`,
    html: `
      <h1>You're registered for ${event.title}!</h1>
      <p>Hello ${user.name},</p>
      <p>Your registration for ${event.title} on ${new Date(event.date).toLocaleDateString()} is confirmed.</p>
      <p>Location: ${event.location}</p>
      <p>Thank you for using EventCraft!</p>
    `
  });
};

const sendEventReminder = async (user, event) => {
  return sendEmail({
    to: user.email,
    subject: `Reminder: ${event.title} is tomorrow!`,
    html: `
      <h1>Event Reminder</h1>
      <p>Hello ${user.name},</p>
      <p>This is a reminder that ${event.title} is happening tomorrow at ${event.location}.</p>
      <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
      <p>Time: ${new Date(event.date).toLocaleTimeString()}</p>
    `
  });
};

// Admin notifications
const sendEventApprovalNotification = async (user, event, isApproved) => {
  const status = isApproved ? 'approved' : 'rejected';
  const message = isApproved ? 
    `Your event has been approved and is now published.` : 
    `Your event has been rejected. Please check your organizer dashboard for details.`;

  return sendEmail({
    to: user.email,
    subject: `Event ${status.toUpperCase()}: ${event.title}`,
    html: `
      <h1>Event ${status.toUpperCase()}</h1>
      <p>Hello ${user.name},</p>
      <p>${message}</p>
      <p>Event: ${event.title}</p>
      <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
    `
  });
};

module.exports = {
  sendEmail,
  sendEventConfirmation,
  sendEventReminder,
  sendEventApprovalNotification
}; 