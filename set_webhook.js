import https from 'https';

const data = JSON.stringify({
  url: 'https://3f306987-154e-43c1-95c7-23a8ebe4e4c1-00-373p6j1y25mqd.spock.replit.dev/api/telegram/webhook'
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '/bot8040655774:AAHIVroG9bAmyKjv4P48IOqZRfJIzaVytXs/setWebhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();