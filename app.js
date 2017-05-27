
'use strict';

const format = require('util').format;
const express = require('express');
const bodyParser = require('body-parser').urlencoded({
  extended: false
});

const app = express();

const TWILIO_NUMBER = process.env.TWILIO_NUMBER;
if (!TWILIO_NUMBER) {
  console.log('Missing Twilio number!');
  process.exit(1);
}

const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SECRET_TOKEN = process.env.SECRET_TOKEN;

const TwimlResponse = require('twilio').TwimlResponse;

app.get('/sms/send', (req, res, next) => {
  const to = req.query.to;
  const token = req.query.token;
  if (token != SECRET_TOKEN) {
    res.status(400).send('Invalid secret token.');
    return;
  }

  if (!to) {
    res.status(400).send('Please provide an number in the "to" query string parameter.');
    return;
  }

  twilio.sendMessage({
    to: to,
    from: TWILIO_NUMBER,
    body: 'Hello from Streakguard Testing!'
  }, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.status(200).send('Message sent.');
  });
});

app.post('/sms/receive', bodyParser, (req, res) => {
  const sender = req.body.From;
  const body = req.body.Body;

  const token = req.query.token;
  if (token != SECRET_TOKEN) {
    res.status(400).send('Invalid secret token.');
    return;
  }

  const resp = new TwimlResponse();
  resp.message(format('Hello, %s, you said: %s', sender, body));

  res.status(200)
    .contentType('text/xml')
    .send(resp.toString());
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
