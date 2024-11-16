const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

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
            const messagingEvent = entry.messaging[0];
            const senderId = messagingEvent.sender.id;

            // Check if the user clicked 'Get Started' button
            if (messagingEvent.message && messagingEvent.message.text === 'Get Started') {
                sendMessageWithImage(senderId, 'Thank you for clicking "Get Started"! How can we assist you today?', 'https://ibb.co/2cQVbcb');
            }

            // Check if the user liked or followed the page (via postback)
            if (messagingEvent.postback && messagingEvent.postback.payload === 'follow') {
                sendMessageWithImage(senderId, 
                    '🎉 Thank you so much for following our page! We are excited to have you with us. 😊\n\n' +
                    'Feel free to explore and ask us anything. We’re here to help you in any way we can. 💬', 
                    'https://ibb.co/2cQVbcb');
            }

            // If the user liked the page (reaction detection)
            if (messagingEvent.message && messagingEvent.message.text === 'like') {
                sendMessageWithImage(senderId, 
                    'Thanks for liking our page! 👍\n\n' +
                    'We hope you enjoy your experience here. Let us know if you need anything!', 
                    'https://ibb.co/2cQVbcb');
            }
        });
    }

    res.sendStatus(200);
});

// Function to send message with image to the user
function sendMessageWithImage(senderId, message, imageUrl) {
    const requestBody = {
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
    };

    // Replace with your Facebook Page Access Token
    const accessToken = 'EAALmznqNGzYBO4dCD4HcpVMKraEuDuR0Mw2sgR8Fy4MIhRyrPNW2cwEbSQR55RUA2oIbxNabCuyvHHqLsg9B0nNxRyu6B37F94ZB9tokf5sp2H4Eem2EOjDyqIfUrZBZBqs0hUsvhSXZAjjiUqKgTRUJgsv1TajtZBtnqpIZAIWP7vUkZAobBPZC4tgVZBZBxACfZCnUAZDZD';

    const requestOptions = {
        method: 'POST',
        uri: 'https://graph.facebook.com/v11.0/me/messages',
        qs: { access_token: accessToken },
        json: requestBody
    };

    request(requestOptions, (error, response, body) => {
        if (error) {
            console.error('Error sending message: ', error);
        } else {
            console.log('Message sent: ', body);
        }
    });
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
