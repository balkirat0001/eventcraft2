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
      <h1>🎉 You're registered for ${event.title}!</h1>
      <p>Hello ${user.name},</p>
      <p>Your registration for <strong>${event.title}</strong> is confirmed.</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>📅 Date: ${new Date(event.date).toLocaleDateString()}</li>
        <li>🕐 Time: ${new Date(event.date).toLocaleTimeString()}</li>
        <li>📍 Location: ${event.location}</li>
        <li>💰 Price: $${event.ticketPrice || 0}</li>
      </ul>
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
const sendEventApprovalNotification = async (organizer, event) => {
  return sendEmail({
    to: organizer.email,
    subject: `Event Approved: ${event.title}`,
    html: `
      <h1>✅ Your event has been approved!</h1>
      <p>Hello ${organizer.name},</p>
      <p>Great news! Your event <strong>${event.title}</strong> has been approved and is now live.</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>📅 Date: ${new Date(event.date).toLocaleDateString()}</li>
        <li>🕐 Time: ${new Date(event.date).toLocaleTimeString()}</li>
        <li>📍 Location: ${event.location}</li>
        <li>💰 Price: $${event.ticketPrice || 0}</li>
      </ul>
      <p>Your event is now visible to attendees and ready for registrations!</p>
    `
  });
};

module.exports = {
  sendEmail,
  sendEventReminder,
  sendEventConfirmation,
  sendEventApprovalNotification
};