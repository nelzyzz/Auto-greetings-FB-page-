const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Verify Token for Facebook webhook verification
const VERIFY_TOKEN = 'page';
const PAGE_ACCESS_TOKEN = 'EAAn5t0PUOisBO1a7tZC77NU7yy4HXQzTPzkzwXabZCBZB1ABxZAGUp9k2Q6wX5jxTDAUBvYbHdr7wDIwX5XDSpgHtFZCjEYZC1kcB7yZBXbFO1zZC7ECr2MGLMr6czvaIRzhBPWPeZAK4T04yGhZBq1l6rvY9i4J6dKIdaJvLDRSvzsmjo5dfbZB7bASdZBqZC54NjbSjZBgZDZD';

// Webhook verification (GET request)
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

// Webhook handler (POST request)
app.post('/webhook', bodyParser.json(), (req, res) => {
    const data = req.body;

    if (data.object === 'page') {
        data.entry.forEach(entry => {
            if (entry.messaging && entry.messaging.length > 0) {
                entry.messaging.forEach(event => {
                    const senderId = event.sender.id;

                    // Check if the message is a "Get Started" button click
                    if (event.postback && event.postback.payload === 'GET_STARTED') {
                        sendMessageWithImage(senderId, 
                            'Thank you for clicking "Get Started"! How can we assist you today?', 
                            'https://i.ibb.co/2cQVbcb/image.jpg'
                        );
                    }

                    // Detect if the user liked/followed the page
                    if (event.postback && event.postback.payload === 'follow') {
                        sendMessageWithImage(senderId, 
                            '🎉 Thank you for following our page! We are excited to have you with us. 😊\n\n' +
                            'Feel free to explore and ask us anything. We’re here to help you in any way we can. 💬', 
                            'https://i.ibb.co/2cQVbcb/image.jpg'
                        );
                    }

                    // Check if the message contains the word "like"
                    if (event.message && event.message.text.toLowerCase() === 'like') {
                        sendMessageWithImage(senderId, 
                            'Thanks for liking our page! 👍\n\n' +
                            'We hope you enjoy your experience here. Let us know if you need anything!', 
                            'https://i.ibb.co/2cQVbcb/image.jpg'
                        );
                    }
                });
            }
        });
    }
    res.sendStatus(200);
});

// Function to send message with an image to the user
function sendMessageWithImage(senderId, textMessage, imageUrl) {
    const requestBody = {
        recipient: { id: senderId },
        message: {
            attachment: {
                type: 'image',
                payload: {
                    url: imageUrl,
                    is_reusable: true
                }
            },
            text: textMessage
        }
    };

    const options = {
        hostname: 'graph.facebook.com',
        path: `/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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
