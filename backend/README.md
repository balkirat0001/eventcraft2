# EventCraft Backend

This is the backend API server for EventCraft built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Compass (or MongoDB Community Server)
- npm or yarn

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start MongoDB**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Or start MongoDB service:
     ```bash
     # On macOS with Homebrew
     brew services start mongodb/brew/mongodb-community
     
     # On Windows
     net start MongoDB
     
     # On Linux
     sudo systemctl start mongod
     ```

3. **Environment Variables**
   - The `.env` file is already configured for local development
   - Database: `mongodb://localhost:27017/eventcraft`
   - Port: `5000`

4. **Run the Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Verify Setup**
   - Backend should be running on: http://localhost:5000
   - Test endpoint: http://localhost:5000/api/health

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (to be implemented)

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users` - Get users (protected)
- `GET /api/events` - Get events
- `POST /api/events` - Create event (protected)

## Project Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Ticket.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── event.routes.js
│   └── ticket.routes.js
├── .env
├── server.js
└── package.json
```

## Database Schema

The application uses MongoDB with the following collections:
- **users** - User accounts and profiles
- **events** - Event information
- **tickets** - Event tickets and registrations

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/eventcraft
JWT_SECRET=eventcraftsecretkey2025
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```


# EventCraft Backend Email/SMS Integration Guide

This guide explains how to integrate Twilio (for SMS) and SendGrid (for email) with the EventCraft backend.

## Integrating SendGrid for Email

### 1. Installation

```bash
npm install @sendgrid/mail
```

### 2. Environment Variables

Add these to your `.env` file:

```
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender@example.com
```

### 3. Create Email Service

Create a new file at `backend/services/emailService.js`:

```javascript
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

module.exports = {
  sendEmail,
  sendEventConfirmation,
  sendEventReminder
};
```

### 4. Usage Examples

```javascript
// In your event registration controller
const emailService = require('../services/emailService');

// After successful ticket purchase
await emailService.sendEventConfirmation(user, event);

// For event reminders (could be scheduled with a cron job)
await emailService.sendEventReminder(user, event);
```

## Integrating Twilio for SMS

### 1. Installation

```bash
npm install twilio
```

### 2. Environment Variables

Add these to your `.env` file:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Create SMS Service

Create a new file at `backend/services/smsService.js`:

```javascript
const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async ({ to, body }) => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    
    console.log(`SMS sent to ${to}, SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, error };
  }
};

// Template helpers for common SMS messages
const sendEventReminderSMS = async (user, event) => {
  if (!user.phone) return { success: false, error: 'No phone number' };
  
  return sendSMS({
    to: user.phone,
    body: `Reminder: ${event.title} is tomorrow at ${new Date(event.date).toLocaleTimeString()} in ${event.location}. See you there!`
  });
};

const sendCheckInConfirmationSMS = async (user, event) => {
  if (!user.phone) return { success: false, error: 'No phone number' };
  
  return sendSMS({
    to: user.phone,
    body: `You've successfully checked in to ${event.title}. Enjoy the event!`
  });
};

module.exports = {
  sendSMS,
  sendEventReminderSMS,
  sendCheckInConfirmationSMS
};
```

### 4. Usage Examples

```javascript
// In your event check-in controller
const smsService = require('../services/smsService');

// After successful check-in
await smsService.sendCheckInConfirmationSMS(user, event);

// For event reminders (could be scheduled with a cron job)
await smsService.sendEventReminderSMS(user, event);
```

## Setting Up Scheduled Notifications

To send reminders automatically, you can use a scheduling library like `node-cron`:

### 1. Installation

```bash
npm install node-cron
```

### 2. Create a Notification Scheduler

Create a new file at `backend/services/notificationScheduler.js`:

```javascript
const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const emailService = require('./emailService');
const smsService = require('./smsService');

// Run every day at midnight
const scheduleEventReminders = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily event reminder check...');
      
      // Find events happening tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      const events = await Event.find({
        date: { 
          $gte: tomorrow,
          $lt: dayAfter
        },
        status: 'published'
      }).populate('attendees.user');
      
      console.log(`Found ${events.length} events happening tomorrow`);
      
      // Send notifications to all attendees
      for (const event of events) {
        for (const attendee of event.attendees) {
          const user = attendee.user;
          
          // Send email notification
          if (user.preferences?.notifications?.email) {
            await emailService.sendEventReminder(user, event);
          }
          
          // Send SMS notification
          if (user.preferences?.notifications?.sms && user.phone) {
            await smsService.sendEventReminderSMS(user, event);
          }
        }
      }
      
      console.log('Event reminders sent successfully');
    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  });
};

module.exports = {
  scheduleEventReminders
};
```

### 3. Initialize the Scheduler

Add this to your `server.js`:

```javascript
const { scheduleEventReminders } = require('./services/notificationScheduler');

// Start the notification scheduler
scheduleEventReminders();
```

## Testing in Development

For testing without sending actual emails/SMS:

1. **For SendGrid**: Create a test account and use Sendgrid's Event Webhook
2. **For Twilio**: Use Twilio's test credentials and phone numbers

## Production Best Practices

1. **Rate Limiting**: Implement throttling for SMS to avoid unexpected costs
2. **Templates**: Use SendGrid templates for professional-looking emails
3. **Opt-in/out**: Always provide users the ability to opt out of notifications
4. **Queuing**: For high-volume applications, use a message queue system
5. **Error Handling**: Implement comprehensive error handling and retry logic
