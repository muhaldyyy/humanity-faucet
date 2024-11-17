const axios = require('axios');
const readline = require('readline');

// Array of user agents untuk pilihan
const userAgents = {
    1: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    2: 'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    3: 'Mozilla/5.0 (Linux; Android 10; MAR-LX1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    4: 'Mozilla/5.0 (Linux; Android 12; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    5: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1'
};

// Function to claim tokens with fixed user agent
async function claimTokens(address, userAgent) {
    const url = 'https://faucet.testnet.humanity.org/api/claim';
    const payload = {
        address: address
    };
    
    const headers = {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        const response = await axios.post(url, payload, { headers });
        console.log("Status:", response.status);
        console.log("Data:", response.data);
    } catch (error) {
        if (error.response) {
            console.error("Error Status:", error.response.status);
            console.error("Error Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

// Auto-loop function
async function autoLoop(address, totalLoops, delay, userAgent) {
    while (true) {
        for (let i = 0; i < totalLoops; i++) {
            await claimTokens(address, userAgent);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const displayUserAgents = () => {
    console.log("\nPilihan User Agent:");
    for (let i = 1; i <= Object.keys(userAgents).length; i++) {
        console.log(`${i}. Android/iOS Device ${i}`);
    }
    console.log("");
};

const getUserInput = () => {
    return new Promise((resolve) => {
        displayUserAgents();
        rl.question('Pilih nomor User Agent (1-5): ', (uaChoice) => {
            rl.question('Enter Ethereum address: ', (address) => {
                rl.question('Enter total loops (e.g., 50): ', (totalLoops) => {
                    rl.question('Enter delay in seconds (e.g., 3600): ', (delay) => {
                        rl.close();
                        resolve({
                            address,
                            totalLoops: parseInt(totalLoops, 10),
                            delay: parseInt(delay, 10) * 1000,
                            userAgent: userAgents[uaChoice]
                        });
                    });
                });
            });
        });
    });
};

const startBot = async () => {
    const { address, totalLoops, delay, userAgent } = await getUserInput();
    if (address && totalLoops > 0 && delay > 0 && userAgent) {
        console.log(`\nStarting bot with User Agent: ${userAgent}`);
        autoLoop(address, totalLoops, delay, userAgent);
    } else {
        console.error("Invalid input. Please ensure all values are correct.");
    }
};

startBot();
