const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers, body });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function verify() {
    console.log("Verifying Backend Endpoints...");

    // 1. Test Chat
    console.log("\n--- Testing /api/chat ---");
    try {
        const chatData = JSON.stringify({ message: "Hello Puddlefoot" });
        const chatRes = await postRequest('/api/chat', chatData);
        console.log(`Status: ${chatRes.status}`);
        if (chatRes.status === 200) {
            console.log("Body:", chatRes.body.substring(0, 200) + "..."); // Truncate
        } else {
            console.error("Error:", chatRes.body);
        }
    } catch (e) {
        console.error("Chat request failed:", e.message);
    }

    // 2. Test Speak
    console.log("\n--- Testing /api/speak ---");
    try {
        const speakData = JSON.stringify({ text: "Hello there." });
        const speakRes = await postRequest('/api/speak', speakData);
        console.log(`Status: ${speakRes.status}`);
        console.log(`Content-Type: ${speakRes.headers['content-type']}`);
        if (speakRes.status === 200 && speakRes.headers['content-type']?.includes('audio')) {
            console.log("Success: Received audio response.");
        } else {
            console.error("Error/Unexpected:", speakRes.body);
        }
    } catch (e) {
        console.error("Speak request failed:", e.message);
    }
}

// Wait a bit for server to start if running immediately
setTimeout(verify, 3000);
