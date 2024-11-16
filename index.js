const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Your Verify Token and Page Access Token
const VERIFY_TOKEN = 'page';
const PAGE_ACCESS_TOKEN = 'EAAn5t0PUOisBO4ZAJt9LUCmUJWmsgiUywnKuGTn55aKADyVWJzVqjuSumB1ZAHgvfDas2ryzH5rdp77PZA655SLHGy8UeVyaDOizBQhSpDGbatIVlZCNnYW7pSdqsqRPQhZCZBlvsez2Ro3D6IGy2epNrNiqMgtY0soCyCsYkbHGbzW7g8a8j7Tz9SpTYi7nUozAZDZD';

// Middleware to parse incoming requests
app.use(bodyParser.json());

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified successfully.');
            return res.status(200).send(challenge);
        }
        res.sendStatus(403); // Forbidden
    }
});

// Webhook handler
app.post('/webhook', (req, res) => {
    const data = req.body;

    if (data.object === 'page') {
        data.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                const senderId = event.sender.id;

                // Handle Get Started Button
                if (event.postback && event.postback.payload === 'GET_STARTED') {
                    sendMessageWithImage(
                        senderId,
                        'Welcome! Thank you for clicking "Get Started". How can we help you today?',
                        'https://i.ibb.co/2cQVbcb/image.jpg'
                    );
                }

                // Handle Follow/Like Event
                if (event.postback && event.postback.payload === 'follow') {
                    sendMessageWithImage(
                        senderId,
                        '🎉 Thank you for following us! We are thrilled to have you here. 😊\n' +
                        'Feel free to reach out if you need assistance. 💬',
                        'https://i.ibb.co/2cQVbcb/image.jpg'
                    );
                }
            });
        });
        res.sendStatus(200);
    }
});

// Function to send message with an image
function sendMessageWithImage(senderId, textMessage, imageUrl) {
    const requestBody = {
        recipient: { id: senderId },
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'media',
                    elements: [
                        {
                            media_type: 'image',
                            url: imageUrl
                        }
                    ]
                }
            },
            text: textMessage
        }
    };

    const options = {
        hostname: 'graph.facebook.com',
        path: `/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('Message sent:', data);
        });
    });

    req.on('error', (error) => {
        console.error('Error sending message:', error);
    });

    req.write(JSON.stringify(requestBody));
    req.end();
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
