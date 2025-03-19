const { parentPort } = require('worker_threads');  // 引入 worker_threads 模組

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Worker 代碼（用來處理每個批次的投注中獎邏輯）
parentPort?.on('message', async (workerData) => {
    const { bettingData, winningNumbers, specialNumber } = workerData;

    const winners = [];

    // 處理每個投注的中獎邏輯
    // console.log('Worker started', bettingData.length);
    for (const bet of bettingData) {
        const betNumbers = bet.betting_numbers;
        const matchedMainNumbers = betNumbers.filter((num) => winningNumbers.includes(num));
        const matchedSpecialNumber = betNumbers.includes(specialNumber);

        // 計算中獎金額
        const winningAmount = matchedMainNumbers.length * 1000 + (matchedSpecialNumber ? 5000 : 0);

        if (winningAmount > 0) {
            winners.push({
                betId: bet.bet_id,
                prizeTypeId: 1, // 假設為 "正碼"
                winningAmount,
            });
        }
    }
    // console.log('Batch processed', bettingData.length);
    parentPort?.postMessage(winners);
});