const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Replace this with your Page Access Token
const PAGE_ACCESS_TOKEN = "your_page_access_token";

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
                const username = "User"; // Replace this with API call to get the user's name dynamically

                // Check for Like or Follow events
                if (event.field === "feed" && event.value.verb === "add") {
                    const message = getTimeBasedGreeting(username);
                    sendMessage(senderId, message);
                }
            });
        });
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

// Send Message Function with Image
function sendMessage(senderId, message) {
    const request = require("request");
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

    request.post({ uri: url, json: body }, (err, res, body) => {
        if (!err) {
            console.log("Message sent successfully!");
        } else {
            console.error("Failed to send message: ", err);
        }
    });
}

// Start server
app.listen(3000, () => {
    console.log("Webhook server is running on port 3000");
});
