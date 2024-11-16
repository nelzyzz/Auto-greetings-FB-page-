const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace this with your User Access Token
const USER_ACCESS_TOKEN = "EAALmznqNGzYBO5HDUtBBEL1ZCILKSnNX8ISxZCmup7pS8l3Nvr4CNkI7jsc0ASMuEMVc3TqWevILEGrWZCh5CSZBMEmVVRhPTOvY9TBJK5P7rvDgYwmawNik0LfmLFRxVINMT0wKOcQP2XBmMAby6Ul166qRoVqO0nG2CyCeZCUUbLZBn0zb50i7AT70WzmlKZBdPRwuS06oYWetlSWn4odCe4CrQgZD"; // Replace with your User Access Token
const IMAGE_URL = "https://ibb.co/2cQVbcb"; // Replace this with the image URL you want to send

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
            entry.changes.forEach(async (event) => {
                const senderId = event.value.sender_id;
                const username = await getUsername(senderId);

                // Check for Like or Follow events
                if (event.field === "feed" && event.value.verb === "add") {
                    const message = getTimeBasedGreeting(username);
                    await sendMessage(senderId, message);
                }
            });
        });
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

// Fetch username of the person who liked or followed the page
async function getUsername(userId) {
    try {
        const response = await axios.get(`https://graph.facebook.com/${userId}?access_token=${USER_ACCESS_TOKEN}`);
        return response.data.name; // Get the user's name
    } catch (error) {
        console.error("Error fetching username:", error);
        return "User"; // Fallback if there's an error
    }
}

// Function to fetch the Page Access Token using the User Access Token
async function getPageAccessToken() {
    try {
        const response = await axios.get(`https://graph.facebook.com/v12.0/me/accounts?access_token=${USER_ACCESS_TOKEN}`);
        
        // Extract the Page Access Token from the response
        if (response.data && response.data.data) {
            const page = response.data.data[0]; // Assuming you want to use the first page in the list
            const pageAccessToken = page.access_token;
            console.log("Page Access Token:", pageAccessToken);
            return pageAccessToken;
        }
    } catch (error) {
        console.error("Error fetching page access token:", error);
    }
}

// Send Message Function with Image using the Page Access Token
async function sendMessage(senderId, message) {
    const pageAccessToken = await getPageAccessToken();
    
    if (!pageAccessToken) {
        console.error("No Page Access Token available");
        return;
    }

    const url = `https://graph.facebook.com/v12.0/me/messages?access_token=${pageAccessToken}`;

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

    try {
        const response = await axios.post(url, body);
        console.log("Message sent successfully!");
    } catch (error) {
        console.error("Failed to send message: ", error);
    }
}

// Start server
app.listen(3000, () => {
    console.log("Webhook server is running on port 3000");
});
