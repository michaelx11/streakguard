
'use strict';

const format = require('util').format;
const express = require('express');
const datastore = require('./lib/datastore.js');
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

app.get('/refresh', (req, res, next) => {
  // Refresh the timestamp on a specific user
  const token = req.query.token;
  if (token != SECRET_TOKEN) {
    res.status(400).send('Invalid secret token.');
    return;
  }

  const userid = req.query.userid;
  datastore.getUser(userid, function(error, entities) {
    if (error) {
      res.status(400).send(error);
      return;
    }

    if (!entities) {
      res.status(400).send('No entities match userid: ' + userid);
      return;
    }

    var userEntity = entities[0];
    datastore.updateTimestamp(userEntity, function(err2) {
      if (err2) {
        res.status(400).send(err2);
        return;
      }
      res.status(200).send('Refreshed!');
    });
  });
});

app.get('/trigger_check', (req, res, next) => {
  // This request is kicked off by a cron job
  // all SnapAccount entities that have [enabled=true] should have
  // their last_refreshed timestamps checked.
  const token = req.query.token;
  if (token != SECRET_TOKEN) {
    res.status(400).send('Invalid secret token.');
    return;
  }

  datastore.getAllEnabledAccounts(function(err1, entities) {
    if (err1) {
      res.status(400).send(err1);
      return;
    }
    // them comparing last_refreshed to the current time.
    // If 22 hours or more have elapsed, send the SOS texts to the trusted contacts
    console.log(entities);
  });
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
