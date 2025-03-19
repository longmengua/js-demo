const { Client } = require('pg');
const { Worker } = require('worker_threads');
const { resolve } = require('path');

// 創建 PostgreSQL 客戶端
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    max: 10,  // 最大連接數
    idleTimeoutMillis: 30000,  // 空閒連接最大閒置時間
    connectionTimeoutMillis: 2000,  // 連接超時時間
});

// 隨機生成號碼的函數
const generateRandomNumbers = (rangeStart, rangeEnd, count) => {
    const numbers = new Set();
    while (numbers.size < count) {
        const randomNumber = Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
        numbers.add(randomNumber);
    }
    return Array.from(numbers);  // 返回隨機號碼的數組
};

// 記錄開獎結果到資料庫
const recordDrawResult = async (lotteryId, winningNumbers, specialNumber) => {
    try {
        const query = `
            INSERT INTO bet_results (lottery_id, winning_numbers, special_number, draw_date)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;
        const values = [lotteryId, JSON.stringify(winningNumbers), specialNumber];
        await client.query(query, values);
        console.log('Lottery draw result recorded successfully');
    } catch (error) {
        console.error('Error recording draw result:', error);
    }
};

const LotteryDraw = async (lotteryId) => {
    // 獲取彩票遊戲的基本資訊
    const lotteryRes = await client.query(
        'SELECT * FROM lottery_info WHERE lottery_id = $1',
        [lotteryId]
    );
    if (lotteryRes.rows.length === 0) {
        console.log('Lottery not found!');
        return undefined;
    }

    const { total_numbers, main_numbers, special_number, lottery_id } = lotteryRes.rows[0];

    // 隨機選擇主號碼
    const mainNumbers = generateRandomNumbers(1, total_numbers, main_numbers);

    // 隨機選擇特別號碼
    const specialNumbers = generateRandomNumbers(1, total_numbers, special_number);

    // 記錄開獎結果到資料庫
    await recordDrawResult(lottery_id, mainNumbers, specialNumbers[0]);

    return { mainNumbers, specialNumbers };
};

const getBetResults = async (lotteryId) => {
    const query = `
        SELECT * FROM bet_results WHERE lottery_id = $1
    `;
    const values = [lotteryId];
    const res = await client.query(query, values);
    return res.rows;
};

// 用 Worker 處理投注批次
const processWinnersWithWorker = async (batchData, winningNumbers, specialNumber) => {
    const workerFile = resolve(__dirname, './worker.js'); // Reference JavaScript file
    return new Promise((resolve, reject) => {
        const worker = new Worker(workerFile);

        worker.on('message', (winners) => {
            resolve(winners);
            // console.log('message:', winners.length);
            worker.terminate()    // 結束 Worker
        });

        worker.on('error', (error) => {
            reject(error);
            worker.terminate()    // 結束 Worker
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

        // 發送數據給 Worker
        worker.postMessage({ bettingData: batchData, winningNumbers, specialNumber });
    });
};

// 開獎函數
const drawLottery = async (lotteryId, batchSize = 10000) => {
    try {
        let mainNumbers = undefined;
        let specialNumber = undefined;

        // 獲取開獎結果
        const betResult = await getBetResults(lotteryId);
        if (betResult.length === 0) {
            const LotteryResult = await LotteryDraw(lotteryId);
            if (!LotteryResult) {
                console.log('Lottery not found!');
                return;
            }
            mainNumbers = LotteryResult.mainNumbers;
            specialNumber = LotteryResult.specialNumbers[0];
        } else if (betResult.length === 1) {
            mainNumbers = betResult[0]?.winning_numbers;
            specialNumber = betResult[0]?.specialNumber;
        } else {
            console.log('Lottery found more than one result!');
            return;
        }

        // 獲取總的投注資料數量
        const totalBetsRes = await client.query('SELECT COUNT(*) FROM betting_info WHERE lottery_id = $1', [lotteryId]);
        const totalBets = parseInt(totalBetsRes.rows[0].count, 10);

        // 批次處理投注資料
        const batches = Math.ceil(totalBets / batchSize);

        console.time('Lottery draw and winner processing time');
        for (let i = 0; i < batches; i++) {
            const offset = i * batchSize;

            // 查詢當前批次的投注資料
            const batchDataRes = await client.query(
                'SELECT * FROM betting_info WHERE lottery_id = $1 LIMIT $2 OFFSET $3',
                [lotteryId, batchSize, offset]
            );

            const batchData = batchDataRes.rows;

            // 使用 Worker 處理每個批次
            processWinnersWithWorker(batchData, mainNumbers, specialNumber).then(async (winners) => {
                // 批量插入中獎資訊
                const insertQuery = `
                    INSERT INTO winners_info (bet_id, prize_type_id, winning_amount, winning_time) 
                    VALUES 
                    ${winners.flat().map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3}, CURRENT_TIMESTAMP)`).join(', ')}
                `;
                const values = winners.flat().flatMap(winner => [winner.betId, winner.prizeTypeId, winner.winningAmount]);
                await client.query(insertQuery, values);
                // console.log('Winners processed:', winners.length);
            });
        }
        console.timeEnd('Lottery draw and winner processing time');
    } catch (error) {
        console.error('Error drawing lottery:', error);
    }
};

// 啟動應用程序
async function main() {
    await client.connect();
    // 執行開獎（例如，開獎 ID 為 1 的遊戲）
    await drawLottery(1);
    // await client.end();
}

main();
