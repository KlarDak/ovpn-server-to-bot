import { feedbackWebhookUrl, subIndex } from "../utils/envUtil.js";
import { encodeToken } from "../utils/jwtUtil.js";

// NOT USED IN PRODUCTION, ONLY FOR TESTING PURPOSES
try {
    const args = process.argv.slice(2);
    const type = args[0] || "none";
    const uuid = args[1] || "uuid";

    const response = await fetch(feedbackWebhookUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${encodeToken(subIndex(), "feedback", "bot")}`,
        },
        body: JSON.stringify({
            "host": subIndex(),
            "uuid": uuid,
            "type": type,
            "timestamp": Date.now(),
         }),
    });

    if (!response.ok) {
        console.error("Failed to send feedback:", response.statusText);
    }

    const result = await response.json();
}
catch (error) {
    console.error("An error has been occurred during feedback sending:", error);
}