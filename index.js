const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace this with your Page Access Token
const PAGE_ACCESS_TOKEN = "EAALmznqNGzYBO7pUnmPTDn9aBzz186BWc9Ri2hhk6RrRZCh7EmiOeJSC4loHslaMfQnAOZB0KayzpDCrnZBpZCLob08El8IZC4eXZBOffu7jmwIKSVQmxXvVPo8ZBCpaycqU9nRtDJvXkEq309MPRyfjmcwBL8TEscPzvIb02xdmcn9WKg3NjZB0cfnv3MbZBNCV8rgZDZD";

// Replace this with the URL of the image you want to send
const IMAGE_URL = "https://ibb.co/2cQVbcb";

// Function to generate time-based greetings
function getTimeBasedGreeting(username) {
    const currentHour = new Date().getHours();
    let greeting;

    if (currentHour >= 0 && currentHour < 12) {
        greeting = "Good Morning";
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = "Good Afternoon";
    } else {
        greeting = "Good Evening";
    }

    return `Hello ${username}, ${greeting}! Thank you so much for following and supporting our page! 🙏 Your support means a lot to us, and we truly appreciate it.🤍🤍\n\nfrom creator of page: Sunnel John Rebano `;
}

// Webhook verification (required by Facebook)
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = "page";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified!");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handle Webhook Events
app.post("/webhook", (req, res) => {
    const body = req.body;

    if (body.object === "page") {
        body.entry.forEach((entry) => {
            entry.changes.forEach((event) => {
                const senderId = event.value.sender_id;

                // Make a request to get the user's name
                getUserName(senderId, (username) => {
                    // Check for Like or Follow events (adjust the event field as needed)
                    if (event.field === "subscribed" || event.field === "feed" || event.field === "reaction") {
                        const message = getTimeBasedGreeting(username);
                        sendMessage(senderId, message);
                    }
                });
            });
        });
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

// Function to get user's name
function getUserName(senderId, callback) {
    const url = `https://graph.facebook.com/${senderId}?fields=first_name,last_name&access_token=${PAGE_ACCESS_TOKEN}`;

    axios.get(url)
        .then((response) => {
            const username = `${response.data.first_name} ${response.data.last_name}`;
            callback(username);
        })
        .catch((err) => {
            console.error("Error fetching user info", err);
            callback("User");
        });
}

// Send Message Function with Image
function sendMessage(senderId, message) {
    const url = `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

    const body = {
        recipient: { id: senderId },
        message: {
            text: message,
            attachment: {
                type: "image",
                payload: {
                    url: IMAGE_URL,
                    is_reusable: true
                }
            }
        }
    };

    axios.post(url, body)
        .then(() => {
            console.log("Message sent successfully!");
        })
        .catch((err) => {
            console.error("Failed to send message: ", err);
        });
}

// Start server
app.listen(3000, () => {
    console.log("Webhook server is running on port 3000");
});
