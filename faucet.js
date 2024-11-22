const axios = require('axios');
const readline = require('readline');

// Function to claim tokens
async function claimTokens(address, successCount) {
    const url = 'https://faucet.testnet.humanity.org/api/claim';

    const payload = {
        address: address
    };

    const headers = {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        const timestamp = new Date().toLocaleTimeString(); // Mengambil waktu dalam format jam:menit:detik
        successCount++; // Increment success count
        console.log(`[${timestamp}] Success: ${successCount}, Response: ${response.status}, ${JSON.stringify(response.data)}`);
    } catch (error) {
        const timestamp = new Date().toISOString(); // Get current timestamp
        if (error.response) {
            console.error(`[${timestamp}] Response: ${error.response.status}, ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(`[${timestamp}] Error: ${error.message}`);
        }
    }
    return successCount; // Return the updated success count
}

// Function to auto-loop the claimTokens function
async function autoLoop(address, totalLoops, delay) {
    let successCount = 0; // Initialize success count
    while (true) {
        for (let i = 0; i < totalLoops; i++) {
            successCount = await claimTokens(address, successCount); // Update success count
        }
        // Wait for the specified delay after completing the loops
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Set up readline for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to get user input
const getUserInput = () => {
    return new Promise((resolve) => {
        rl.question('Enter Ethereum address: ', (address) => {
            rl.question('Enter total loops (e.g., 50): ', (totalLoops) => {
                rl.question('Enter delay in seconds (e.g., 3600): ', (delay) => {
                    rl.close();
                    resolve({
                        address,
                        totalLoops: parseInt(totalLoops, 10),
                        delay: parseInt(delay, 10) * 1000 // Convert to milliseconds
                    });
                });
            });
        });
    });
};

// Main function to start the bot
const startBot = async () => {
    const { address, totalLoops, delay } = await getUserInput();

    if (address && totalLoops > 0 && delay > 0) {
        autoLoop(address, totalLoops, delay);
    } else {
        console.error("Invalid input. Please ensure all values are correct.");
    }
};

// Start the bot
startBot();
