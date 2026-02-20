// Native fetch is available in Node 18+

async function testChat() {
    console.log("Testing Chat API...");
    try {
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'guest'
            },
            body: JSON.stringify({
                message: "Hello debug",
                history: []
            })
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testChat();
