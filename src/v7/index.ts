import { Pool } from 'pg';

// 創建 PostgreSQL 連線池
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    max: 40,  // 假設你的 VM 可以承受 40 個並行連線
    idleTimeoutMillis: 30000,  // 空閒連線最大閒置時間設為 30 秒
    connectionTimeoutMillis: 2000,  // 連線超時時間設為 2 秒
});

// 隨機生成號碼的函數
const generateRandomNumbers = (rangeStart: number, rangeEnd: number, count: number): number[] => {
    const numbers: Set<number> = new Set();
    while (numbers.size < count) {
        const randomNumber = Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
        numbers.add(randomNumber);
    }
    return Array.from(numbers);  // 返回隨機號碼的數組
};

// 記錄開獎結果到資料庫
const recordDrawResult = async (lotteryId: number, winningNumbers: number[], specialNumber: number): Promise<void> => {
    const client = await pool.connect();
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
    } finally {
        client.release();  // 釋放連線回池中
    }
};

// 優化後的中獎處理函數（批量插入中獎資料）
const processWinners = async (bettingData: any[], winningNumbers: number[], specialNumber: number): Promise<void> => {
    const client = await pool.connect();
    const winners: any[] = [];

    // 處理每個投注的中獎邏輯
    for (const bet of bettingData) {
        const betNumbers = bet.betting_numbers;
        const matchedMainNumbers = betNumbers.filter((num: number) => winningNumbers.includes(num));
        const matchedSpecialNumber = betNumbers.includes(specialNumber);

        // 計算中獎金額，假設是根據中獎號碼的數量來決定
        const winningAmount = matchedMainNumbers.length * 1000 + (matchedSpecialNumber ? 5000 : 0);

        if (winningAmount > 0) {
            winners.push({
                betId: bet.bet_id,
                prizeTypeId: 1, // 假設為 "正碼"
                winningAmount,
            });
        }
    }

    // 批量插入中獎資訊
    if (winners.length > 0) {
        const insertQuery = `
            INSERT INTO winners_info (bet_id, prize_type_id, winning_amount, winning_time) 
            VALUES 
            ${winners.map((winner, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3}, CURRENT_TIMESTAMP)`).join(', ')}
        `;
        const values = winners.flatMap(winner => [winner.betId, winner.prizeTypeId, winner.winningAmount]);
        await client.query(insertQuery, values);
        // console.log('Batch winner records inserted successfully');
    }
    client.release();  // 釋放連線回池中
};

const LotteryDraw = async (lotteryId: number) => {
    const client = await pool.connect();
    try {
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

        return { mainNumbers, specialNumbers }
    } catch (error) {
        console.error('Error in LotteryDraw:', error);
    } finally {
        client.release();  // 釋放連線回池中
    }
};

const getBetResults = async (lotteryId: number) => {
    const client = await pool.connect();
    const query = `
        SELECT * FROM bet_results WHERE lottery_id = $1
    `;
    const values = [lotteryId];
    const res = await client.query(query, values);
    client.release();  // 釋放連線回池中
    return res.rows;
}

// 控制並行查詢數量的函數
const processWithLimitedConcurrency = async (
    batches: Promise<void>[],
    maxConcurrency: number
): Promise<void> => {
    let index = 0;

    // 使用遞歸方式控制並行數量
    const nextBatch = async () => {
        if (index >= batches.length) return;
        const currentBatch = batches[index];
        index++;

        // 等待當前批次完成，再繼續下一批
        await currentBatch;
        await nextBatch();
    };

    // 限制並行執行的批次數量
    const concurrencyTasks = Array.from({ length: maxConcurrency }, nextBatch);
    await Promise.all(concurrencyTasks);
};

// 開獎函數
const drawLottery = async (lotteryId: number, batchSize: number = 20000, maxConcurrency: number = 16): Promise<void> => {
    try {
        let mainNumbers = undefined;
        let specialNumber = undefined
        // 獲取開獎結果
        const betResult = await getBetResults(lotteryId);
        if (betResult.length === 0) {
            // 獲得開獎資訊
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
        const client = await pool.connect();
        const totalBetsRes = await client.query('SELECT COUNT(*) FROM betting_info WHERE lottery_id = $1', [lotteryId]);
        const totalBets = parseInt(totalBetsRes.rows[0].count, 10);

        // 批次處理投注資料
        const batches = Math.ceil(totalBets / batchSize);
        const batchPromises: Array<Promise<void>> = [];

        console.time('Lottery draw and winner processing time');
        for (let i = 0; i < batches; i++) {
            const offset = i * batchSize;

            // 查詢當前批次的投注資料
            const batchDataRes = await client.query(
                'SELECT * FROM betting_info WHERE lottery_id = $1 LIMIT $2 OFFSET $3',
                [lotteryId, batchSize, offset]
            );

            const batchData = batchDataRes.rows;

            // 將每個批次的處理封裝成 Promise 並加入批次列表
            batchPromises.push(processWinners(batchData, mainNumbers, specialNumber));
        }

        // 控制並行數量
        await processWithLimitedConcurrency(batchPromises, maxConcurrency);
        console.timeEnd('Lottery draw and winner processing time');
    } catch (error) {
        console.error('Error drawing lottery:', error);
    }
};

// 啟動應用程序
async function main(): Promise<void> {
    // setInterval(() => {
    //     if (global.gc) {
    //         // Check memory usage before GC
    //         const beforeGc = process.memoryUsage().heapUsed;
    //         // console.log(`Memory before GC: ${beforeGc / 1024 / 1024} MB`);

    //         // Trigger manual garbage collection
    //         global.gc();

    //         // Check memory usage after GC
    //         const afterGc = process.memoryUsage().heapUsed;
    //         // console.log(`Memory after GC: ${afterGc / 1024 / 1024} MB`);

    //         console.log(`Memory freed by GC: ${(beforeGc - afterGc) / 1024 / 1024} MB`);
    //     } else {
    //         console.log('Garbage collection is not exposed');
    //     }
    // }, 1000); // 每隔 1 秒觸發一次垃圾回收
    // 執行開獎（例如，開獎 ID 為 1 的遊戲）
    await drawLottery(1);
    await pool.end();  // 關閉連線池
}

main();
