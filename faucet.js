const axios = require('axios');
const readline = require('readline');

// Array of user agents untuk rotasi
const userAgents = [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; MAR-LX1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 12; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1'
];

// Function untuk mendapatkan random user agent
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Function untuk mendapatkan random delay
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to claim tokens with modified headers
async function claimTokens(address, sessionId) {
    const url = 'https://faucet.testnet.humanity.org/api/claim';
    const payload = {
        address: address
    };
    
    // Generate random headers untuk setiap request
    const headers = {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'User-Agent': getRandomUserAgent(),
        'X-Session-ID': sessionId, // Unique session identifier
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        // Tambahkan random delay sebelum setiap request
        const randomDelay = getRandomDelay(1000, 3000);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        const response = await axios.post(url, payload, { 
            headers,
            // Tambahkan random proxy jika tersedia
            // proxy: {
            //     host: 'proxy-host',
            //     port: proxy-port
            // }
        });
        
        console.log(`[Session ${sessionId}] Status:`, response.status);
        console.log(`[Session ${sessionId}] Data:`, response.data);
    } catch (error) {
        if (error.response) {
            console.error(`[Session ${sessionId}] Error Status:`, error.response.status);
            console.error(`[Session ${sessionId}] Error Data:`, error.response.data);
        } else {
            console.error(`[Session ${sessionId}] Error:`, error.message);
        }
    }
}

// Modified auto-loop function with session tracking
async function autoLoop(address, totalLoops, delay, sessionId) {
    while (true) {
        for (let i = 0; i < totalLoops; i++) {
            await claimTokens(address, sessionId);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const getUserInput = () => {
    return new Promise((resolve) => {
        rl.question('Enter Ethereum address: ', (address) => {
            rl.question('Enter total loops (e.g., 50): ', (totalLoops) => {
                rl.question('Enter delay in seconds (e.g., 3600): ', (delay) => {
                    rl.question('Enter session ID (1 or 2): ', (sessionId) => {
                        rl.close();
                        resolve({
                            address,
                            totalLoops: parseInt(totalLoops, 10),
                            delay: parseInt(delay, 10) * 1000,
                            sessionId: sessionId.toString()
                        });
                    });
                });
            });
        });
    });
};

const startBot = async () => {
    const { address, totalLoops, delay, sessionId } = await getUserInput();
    if (address && totalLoops > 0 && delay > 0) {
        console.log(`Starting bot with session ID: ${sessionId}`);
        autoLoop(address, totalLoops, delay, sessionId);
    } else {
        console.error("Invalid input. Please ensure all values are correct.");
    }
};

startBot();
