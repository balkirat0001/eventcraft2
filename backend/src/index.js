const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const reminders = require('./reminders');
const email = require('./email');
const sms = require('./sms');
const calendar = require('./calendar');
const chatRoutes = require('./routes/chat');
const reminderRoutes = require('./routes/reminders');
const calendarRoutes = require('./routes/calendar');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(express.json());
app.use('/api/chat', chatRoutes(io));
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);

reminders.start(); // Start cron jobs

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // Chat and notification events here
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));