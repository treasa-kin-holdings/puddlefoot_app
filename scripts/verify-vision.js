const fs = require('fs');
const path = require('path');
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
                'Content-Length': Buffer.byteLength(data)
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

// Helper to encode image
function encodeImage(filePath) {
    const bitmap = fs.readFileSync(filePath);
    return Buffer.from(bitmap).toString('base64');
}

async function verifyVision() {
    console.log("Verifying Vision Endpoints...");

    const imagePath = path.join(__dirname, '../public/puddlefoot.jpg'); // Using the penguin image as a test "plant" (funny, but tests the pipeline)

    if (!fs.existsSync(imagePath)) {
        console.error("Test image not found:", imagePath);
        return;
    }

    const base64Image = encodeImage(imagePath);
    const payload = JSON.stringify({ image: `data:image/jpeg;base64,${base64Image}` });

    // 1. Test Identify
    console.log("\n--- Testing /api/identify ---");
    try {
        const idRes = await postRequest('/api/identify', payload);
        console.log(`Status: ${idRes.status}`);
        if (idRes.status === 200) {
            console.log("Response:", idRes.body.substring(0, 300));
        } else {
            console.error("Error:", idRes.body);
        }
    } catch (e) {
        console.error("Identify failed:", e.message);
    }

    // 2. Test Diagnose
    console.log("\n--- Testing /api/diagnose ---");
    try {
        const diagRes = await postRequest('/api/diagnose', payload);
        console.log(`Status: ${diagRes.status}`);
        if (diagRes.status === 200) {
            console.log("Response:", diagRes.body.substring(0, 300));
        } else {
            console.error("Error:", diagRes.body);
        }
    } catch (e) {
        console.error("Diagnose failed:", e.message);
    }
}

verifyVision();
