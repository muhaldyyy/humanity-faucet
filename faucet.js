const axios = require('axios');
const readline = require('readline');
const crypto = require('crypto');

// Array of user agents untuk pilihan
const userAgents = {
    1: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    2: 'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    3: 'Mozilla/5.0 (Linux; Android 10; MAR-LX1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    4: 'Mozilla/5.0 (Linux; Android 12; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    5: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1'
};

// Generate fingerprint unik untuk setiap sesi
function generateFingerprint() {
    return crypto.randomBytes(16).toString('hex');
}

// Generate nilai acak untuk cookie dan header
function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
}

// Function untuk mendapatkan timestamp dalam format yang tepat
function getTimestamp() {
    return new Date().toISOString();
}

// Function untuk generate cookie yang terlihat legitimate
function generateCookies() {
    return {
        '_ga': `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
        '_gid': `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
        'session': generateRandomString(32),
        'visitor_id': generateRandomString(16)
    };
}

// Function to claim tokens with enhanced anti-rate limit measures
async function claimTokens(address, userAgent, fingerprint) {
    const url = 'https://faucet.testnet.humanity.org/api/claim';
    const payload = {
        address: address,
        timestamp: getTimestamp(),
        fingerprint: fingerprint
    };
    
    // Generate cookies untuk request ini
    const cookies = generateCookies();
    const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');

    const headers = {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://faucet.testnet.humanity.org',
        'Referer': 'https://faucet.testnet.humanity.org/',
        'Cookie': cookieString,
        'X-Fingerprint': fingerprint,
        'X-Real-IP': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    };

    try {
        // Tambahkan jitter ke delay untuk membuat pola request lebih alami
        const jitter = Math.floor(Math.random() * 1000);
        await new Promise(resolve => setTimeout(resolve, jitter));

        const response = await axios.post(url, payload, { 
            headers,
            timeout: 10000, // 10 second timeout
            validateStatus: status => status < 500, // Handle all status codes below 500
            maxRedirects: 5
        });

        console.log(`[${new Date().toLocaleTimeString()}] Status:`, response.status);
        console.log(`[${new Date().toLocaleTimeString()}] Data:`, response.data);

        // Jika mendapat rate limit, tunggu lebih lama
        if (response.status === 429) {
            const waitTime = parseInt(response.headers['retry-after']) * 1000 || 60000;
            console.log(`Rate limited. Waiting for ${waitTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    } catch (error) {
        if (error.response) {
            console.error(`[${new Date().toLocaleTimeString()}] Error Status:`, error.response.status);
            console.error(`[${new Date().toLocaleTimeString()}] Error Data:`, error.response.data);
            
            // Handle specific error cases
            if (error.response.status === 429) {
                const waitTime = parseInt(error.response.headers['retry-after']) * 1000 || 60000;
                console.log(`Rate limited. Waiting for ${waitTime/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } else {
            console.error(`[${new Date().toLocaleTimeString()}] Error:`, error.message);
        }
    }
}

// Modified auto-loop function with exponential backoff
async function autoLoop(address, totalLoops, baseDelay, userAgent) {
    const fingerprint = generateFingerprint();
    let currentDelay = baseDelay;
    let consecutiveErrors = 0;
    
    while (true) {
        for (let i = 0; i < totalLoops; i++) {
            try {
                await claimTokens(address, userAgent, fingerprint);
                
                // Reset delay if successful
                if (consecutiveErrors > 0) {
                    consecutiveErrors = 0;
                    currentDelay = baseDelay;
                }
            } catch (error) {
                consecutiveErrors++;
                // Exponential backoff on error
                currentDelay = baseDelay * Math.pow(2, consecutiveErrors);
                console.log(`Increasing delay to ${currentDelay/1000} seconds due to errors`);
            }
            
            // Add random jitter to delay
            const jitter = Math.floor(Math.random() * (currentDelay * 0.1));
            const totalDelay = currentDelay + jitter;
            console.log(`Waiting ${totalDelay/1000} seconds before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
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
                    rl.question('Enter base delay in seconds (e.g., 3600): ', (delay) => {
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
        console.log(`Initial delay: ${delay/1000} seconds`);
        autoLoop(address, totalLoops, delay, userAgent);
    } else {
        console.error("Invalid input. Please ensure all values are correct.");
    }
};

startBot();
