const express = require('express');
const bodyParser = require('body-parser');
const https = require('https'); // Ginamit ang built-in na https module ng Node.js

const app = express();
const port = process.env.PORT || 3000;

// Your Verify Token (custom token for Facebook webhook verification)
const VERIFY_TOKEN = 'page';

// Webhook verification (GET request from Facebook)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403); // Forbidden
        }
    }
});

// Webhook handler (POST request from Facebook)
app.post('/webhook', bodyParser.json(), (req, res) => {
    const data = req.body;

    if (data.object === 'page') {
        data.entry.forEach(entry => {
            // Make sure entry.messaging is valid before accessing it
            if (entry.messaging && entry.messaging.length > 0) {
                const messagingEvent = entry.messaging[0];
                const senderId = messagingEvent.sender.id;

                // Check if the user clicked 'Get Started' button
                if (messagingEvent.message && messagingEvent.message.text === 'Get Started') {
                    sendMessageWithImage(senderId, 'Thank you for clicking "Get Started"! How can we assist you today?', 'https://i.ibb.co/2cQVbcb/image.jpg');
                }

                // Check if the user liked or followed the page (via postback)
                if (messagingEvent.postback && messagingEvent.postback.payload === 'follow') {
                    sendMessageWithImage(senderId, 
                        '🎉 Thank you so much for following our page! We are excited to have you with us. 😊\n\n' +
                        'Feel free to explore and ask us anything. We’re here to help you in any way we can. 💬', 
                        'https://i.ibb.co/2cQVbcb/image.jpg');
                }

                // If the user liked the page (reaction detection)
                if (messagingEvent.message && messagingEvent.message.text === 'like') {
                    sendMessageWithImage(senderId, 
                        'Thanks for liking our page! 👍\n\n' +
                        'We hope you enjoy your experience here. Let us know if you need anything!', 
                        'https://i.ibb.co/2cQVbcb/image.jpg');
                }
            } else {
                console.error("No messaging data found in the entry.");
            }
        });
    }

    res.sendStatus(200);
});

// Function to send message with image to the user
function sendMessageWithImage(senderId, message, imageUrl) {
    const requestBody = JSON.stringify({
        recipient: { id: senderId },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: imageUrl,
                    is_reusable: true
                }
            },
            text: message
        }
    });

    const options = {
        hostname: 'graph.facebook.com',
        path: `/v11.0/me/messages?access_token=EAAn5t0PUOisBO1a7tZC77NU7yy4HXQzTPzkzwXabZCBZB1ABxZAGUp9k2Q6wX5jxTDAUBvYbHdr7wDIwX5XDSpgHtFZCjEYZC1kcB7yZBXbFO1zZC7ECr2MGLMr6czvaIRzhBPWPeZAK4T04yGhZBq1l6rvY9i4J6dKIdaJvLDRSvzsmjo5dfbZB7bASdZBqZC54NjbSjZBgZDZD`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        
        // A chunk of data has been received.
        res.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        res.on('end', () => {
            console.log('Message sent: ', data);
        });
    });

    req.on('error', (error) => {
        console.error('Error sending message: ', error);
    });

    // Write the request body to the request
    req.write(requestBody);
    req.end();
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
