const start = Date.now();
console.log("Starting benchmark...");

fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "Hello, testing latency." })
})
    .then(res => res.json())
    .then(data => {
        const end = Date.now();
        console.log(`Response received in ${end - start}ms`);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    })
    .catch(err => console.error("Error:", err));
