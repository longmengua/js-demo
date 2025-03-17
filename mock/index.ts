import { Client } from 'pg';
import fs from 'fs';

// 資料庫連接設定
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
});

// 隨機生成名稱
const generateRandomName = () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Sophia', 'Daniel', 'Olivia'];
    const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// 隨機生成電子郵件
let currentTimestamp: any = undefined;
let serialNumber = 0;
const generateRandomEmail = (name: string) => {
    const emailProvider = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
    const username = name.replace(/ /g, '').toLowerCase();
    const domain = emailProvider[Math.floor(Math.random() * emailProvider.length)];

    if (!currentTimestamp || Date.now() != currentTimestamp) {
        currentTimestamp = Date.now();
        serialNumber = 0;
    } else {
        serialNumber++;
    }
    const paddingNumber = serialNumber.toString().padStart(6, '0');
    return `${username}${currentTimestamp}${paddingNumber}@${domain}`;
};

// 隨機生成交易金額
const generateRandomAmount = () => {
    return (Math.random() * (1000 - 10) + 10).toFixed(2);  // 隨機生成 10 到 1000 之間的金額
};

// 插入資料到資料庫
const batchInsert = async (query: string, values: any[][]) => {
    let toReturn: any = undefined
    console.time('批次時間');
    const batchSize = 1000; // 每批1000筆資料
    let bt = batchSize; // 每批1000筆資料
    for (let i = 0; i < values.length; i += bt) {
        const batch = values.slice(i, i + bt);

        try {
            await client.query('BEGIN'); // 開始一個新的事務
            for (const value of batch) {
                await client.query(query, value); // 逐筆插入
            }
            await client.query('COMMIT'); // 提交事務
        } catch (err: any) {
            await client.query('ROLLBACK'); // 回滾事務
            const errorData = { query, batch, error: err?.message };
            console.error(`批次插入資料錯誤，跳過此批次: ${err.message}`);
            bt = Math.floor(bt / 2); // 減小批次大小
            i -= bt; // 回退到上一個批次
            if (i == 1) {
                fs.appendFileSync('errorLog.txt', JSON.stringify(errorData) + '\n');
                bt = batchSize; // 重置批次大小
                continue;
            }
        }
    }
    console.timeEnd('批次時間');
    return toReturn;
};

// 批次插入用戶資料
const batchInsertUsers = async (userCount: number) => {
    const query = 'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING user_id';
    let values = [];
    for (let i = 0; i < userCount; i++) {
        let fullName = generateRandomName();
        const name = fullName;
        let email = generateRandomEmail(fullName);
        const passwordHash = 'hashed_password'; // 假設用戶密碼已經哈希
        values.push([name, email, passwordHash, fullName]);
        if (i % 1000 === 0) {
            await batchInsert(query, values);
            values = []
        }
    }
};

// 插入彩票活動資料
const insertLotteryInfo = async () => {
    const query = 'INSERT INTO lottery_info (name, draw_time_days, draw_time_time, total_numbers, main_numbers, special_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING lottery_id';
    const lotteryValues = [
        'Lucky Lottery', // name
        'Monday, Wednesday, Friday', // draw_time_days
        '20:00:00', // draw_time_time
        49, // total_numbers
        6, // main_numbers
        Math.floor(Math.random() * 49) + 1, // special_number
    ];
    const res = await client.query(query, lotteryValues);
    return res.rows[0].lottery_id;
};

// 插入獎項資料
const insertPrizeTypes = async (lotteryId: number) => {
    console.time('插入獎項資料');
    const query = 'INSERT INTO prize_types (lottery_id, type, numbers_range_start, numbers_range_end, pay_rate) VALUES ($1, $2, $3, $4, $5)';
    const prizeTypesValues = [
        [lotteryId, 'First Prize', 1, 10, 1000.00],
        [lotteryId, 'Second Prize', 11, 20, 500.00],
        [lotteryId, 'Third Prize', 21, 30, 100.00],
        [lotteryId, 'Consolation Prize', 31, 49, 10.00],
    ];
    await batchInsert(query, prizeTypesValues);
    console.timeEnd('插入獎項資料');
};

// 插入號碼投注位置規則
const insertBallPositions = async (lotteryId: number) => {
    console.time('插入號碼投注位置規則');
    const query = 'INSERT INTO ball_positions (lottery_id, position_name, pay_rate, valid_number_range_start, valid_number_range_end) VALUES ($1, $2, $3, $4, $5)';
    const ballPositionsValues = [
        [lotteryId, 'Position 1', 2.00, 1, 9],
        [lotteryId, 'Position 2', 2.00, 10, 18],
        [lotteryId, 'Position 3', 2.00, 19, 27],
        [lotteryId, 'Position 4', 2.00, 28, 36],
        [lotteryId, 'Position 5', 2.00, 37, 45],
        [lotteryId, 'Position 6', 2.00, 46, 49],
    ];
    await batchInsert(query, ballPositionsValues);
    console.timeEnd('插入號碼投注位置規則');
};

// 插入生肖獎項資料
const insertZodiacPrizes = async (lotteryId: number) => {
    console.time('插入生肖獎項資料');
    const query = 'INSERT INTO zodiac_prizes (lottery_id, zodiac_name, numbers, pay_rate) VALUES ($1, $2, $3, $4)';
    const zodiacPrizesValues = [
        [lotteryId, 'Rat', JSON.stringify([1, 13, 25, 37]), 100.00],
        [lotteryId, 'Ox', JSON.stringify([2, 14, 26, 38]), 100.00],
        [lotteryId, 'Tiger', JSON.stringify([3, 15, 27, 39]), 100.00],
        [lotteryId, 'Rabbit', JSON.stringify([4, 16, 28, 40]), 100.00],
        [lotteryId, 'Dragon', JSON.stringify([5, 17, 29, 41]), 100.00],
    ];
    await batchInsert(query, zodiacPrizesValues);
    console.timeEnd('插入生肖獎項資料');
};

// 插入雙面投注資料
const insertDoubleSideBets = async (lotteryId: number) => {
    console.time('插入雙面投注資料');
    const query = 'INSERT INTO double_side_bets (lottery_id, side_name, number_range_start, number_range_end, pay_rate) VALUES ($1, $2, $3, $4, $5)';
    const doubleSideBetsValues = [
        [lotteryId, 'Large', 25, 49, 2.00],
        [lotteryId, 'Small', 1, 24, 2.00],
        [lotteryId, 'Odd', 1, 49, 1.90],
        [lotteryId, 'Even', 1, 49, 1.90],
    ];
    await batchInsert(query, doubleSideBetsValues);
    console.timeEnd('插入雙面投注資料');
};

// 批次插入投注資料
const batchInsertBettingInfo = async (lotteryId: number, numberOfUsers: number, numberOfBets: number) => {
    const query = 'INSERT INTO betting_info (lottery_id, user_id, bet_type, betting_numbers, bet_time) VALUES ($1, $2, $3, $4, $5) RETURNING bet_id';
    const values = [];
    for (let i = 0; i < numberOfBets; i++) {
        const userId = Math.floor(Math.random() * numberOfUsers) + 1;
        values.push([lotteryId, userId, 'Main Numbers', JSON.stringify([5, 12, 19, 26, 33, 40]), new Date()]);
        values.push([lotteryId, userId, 'Zodiac', JSON.stringify([1, 13, 25, 37]), new Date()]);
        if (i % 1000 === 0) {
            await batchInsert(query, values);
        }
    }
};

// 插入交易記錄資料
const insertTransactionInfo = async (numberOfUsers: number, numberOfBets: number) => {
    console.time('插入交易記錄資料');
    const query = 'INSERT INTO transaction_info (user_id, bet_id, amount, transaction_type) VALUES ($1, $2, $3, $4)';
    let transactionValues = [];
    for (let i = 0; i < numberOfBets; i++) {
        const userId = Math.floor(Math.random() * numberOfUsers) + 1;
        const betId = i + 1;
        transactionValues.push([userId, betId, generateRandomAmount(), 'Bet']);
        if (i % 1000 === 0) {
            await batchInsert(query, transactionValues);
            transactionValues = [];
        }
    }
    console.timeEnd('插入交易記錄資料');
};

// 主執行函數
async function main() {
    try {
        await client.connect();
        console.log('成功連接到 PostgreSQL 資料庫');

        // 插入彩票活動資料並獲得 lottery_id
        const lotteryId = 1;
        // await insertLotteryInfo();
        // await insertPrizeTypes(lotteryId);
        // await insertBallPositions(lotteryId);
        // await insertZodiacPrizes(lotteryId);
        // await insertDoubleSideBets(lotteryId);

        // 插入200萬筆用戶資料
        const numberOfUsers = 2000000;
        // await batchInsertUsers(numberOfUsers);

        // 插入1000筆投注資料
        const numberOfBets = 10000000;
        await batchInsertBettingInfo(lotteryId, numberOfUsers, numberOfBets);

        // 插入交易記錄資料
        // await insertTransactionInfo(numberOfUsers, numberOfBets);

        console.log('所有資料插入完成');
    } catch (err) {
        console.error('錯誤:', err);
    } finally {
        await client.end();
        console.log('資料庫連線已關閉');
    }
}

// 執行主函數
main();
