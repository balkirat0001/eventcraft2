require('dotenv').config();
const twilio = require('twilio');

// Check if the required environment variables are set
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Error: Missing Twilio environment variables');
  console.log('Please ensure you have set:');
  console.log('- TWILIO_ACCOUNT_SID');
  console.log('- TWILIO_AUTH_TOKEN');
  console.log('- TWILIO_PHONE_NUMBER');
  process.exit(1);
}

// Your phone number to receive the test SMS
const yourPhoneNumber = process.argv[2];

if (!yourPhoneNumber) {
  console.error('Error: Please provide your phone number as an argument');
  console.log('Example: node test-twilio.js +1234567890');
  process.exit(1);
}

// Initialize the Twilio client
const client = twilio(accountSid, authToken);

// Send a test SMS
console.log(`Sending test SMS to ${yourPhoneNumber}...`);

client.messages.create({
  body: 'This is a test message from EventCraft using Twilio! If you received this, your SMS integration is working.',
  from: twilioPhoneNumber,
  to: yourPhoneNumber
})
  .then(message => {
    console.log('Success! Test message sent.');
    console.log(`Message SID: ${message.sid}`);
    console.log('Twilio integration is working correctly.');
  })
  .catch(error => {
    console.error('Error sending test message:');
    console.error(error);
    
    // Provide helpful troubleshooting tips
    if (error.code === 21614) {
      console.log('\nThis error typically means your Twilio phone number cannot send SMS to this destination.');
      console.log('If you\'re using a trial account, you can only send SMS to verified numbers.');
      console.log('Go to https://www.twilio.com/console/phone-numbers/verified and verify your number.');
    } else if (error.code === 21608) {
      console.log('\nThis error means your Twilio account doesn\'t have permission to send to this country.');
      console.log('Check your Twilio Geographic Permissions in the console.');
    }
  }); 