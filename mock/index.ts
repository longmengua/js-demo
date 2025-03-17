import { Client } from 'pg';

// 創建資料庫連線
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
});

// 隨機生成名稱（中文和英文）
const generateRandomName = () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Sophia', 'Daniel', 'Olivia'];
    const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// 隨機生成電子郵件
const generateRandomEmail = (name: string, id: number) => {
    const emailProvider = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
    const username = name.replace(/ /g, '').toLowerCase();
    const domain = emailProvider[Math.floor(Math.random() * emailProvider.length)];
    return `${username}${id}@${domain}`; // 使用 id 來保證唯一性
};

// 隨機生成開獎號碼
const generateRandomWinningNumbers = () => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
        const number = Math.floor(Math.random() * 49) + 1;
        if (!numbers.includes(number)) {
            numbers.push(number);
        }
    }
    return numbers.join(',');
};

// 隨機生成票券號碼
const generateRandomTicketNumbers = () => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
        const number = Math.floor(Math.random() * 49) + 1;
        if (!numbers.includes(number)) {
            numbers.push(number);
        }
    }
    return numbers.join(',');
};

// 隨機生成獎金
const generateRandomPrize = () => {
    return (Math.random() * 1000000).toFixed(2);
};

// 批量插入資料
const batchInsert = async (query: string, values: any[][]) => {
    try {
        await client.query('BEGIN'); // 開始事務
        for (let i = 0; i < values.length; i++) {
            await client.query(query, values[i]);
        }
        await client.query('COMMIT'); // 提交事務
    } catch (err) {
        await client.query('ROLLBACK'); // 回滾事務
        throw err;
    }
};

// 定義一個異步函數來處理資料庫操作
async function main() {
    console.time('總時間'); // 開始計時

    try {
        // 連接到資料庫
        await client.connect();
        console.log('成功連接到 PostgreSQL 資料庫');

        // 插入用戶資料
        const insertUser = 'INSERT INTO users (name, email) VALUES ($1, $2)';
        const totalUsers = 2000000; // 插入 200 萬用戶
        const usersValues = [];
        for (let i = 0; i < totalUsers; i++) {
            const name = generateRandomName();
            const email = generateRandomEmail(name, i);
            usersValues.push([name, email]);
        }
        console.time('插入用戶資料');
        await batchInsert(insertUser, usersValues);
        console.timeEnd('插入用戶資料');
        console.log(`${totalUsers} 用戶資料插入完成`);

        // 插入大樂透活動資料
        const insertLottery = 'INSERT INTO lotteries (lottery_date, total_prize) VALUES ($1, $2)';
        const totalLotteries = 1000; // 1000 場活動
        const lotteriesValues = [];
        for (let i = 0; i < totalLotteries; i++) {
            const lotteryDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 31) + 1);
            const totalPrize = (Math.random() * 100000000).toFixed(2);
            lotteriesValues.push([lotteryDate, totalPrize]);
        }
        console.time('插入大樂透活動資料');
        await batchInsert(insertLottery, lotteriesValues);
        console.timeEnd('插入大樂透活動資料');
        console.log(`${totalLotteries} 大樂透活動資料插入完成`);

        // 插入票券資料
        const insertTicket = 'INSERT INTO lottery_tickets (user_id, lottery_id, numbers) VALUES ($1, $2, $3)';
        const totalTickets = 10000000; // 1000 萬票券資料
        const ticketsValues = [];
        for (let i = 0; i < totalTickets; i++) {
            const userId = Math.floor(Math.random() * totalUsers) + 1;
            const lotteryId = Math.floor(Math.random() * totalLotteries) + 1;
            const numbers = generateRandomTicketNumbers();
            ticketsValues.push([userId, lotteryId, numbers]);
        }
        console.time('插入票券資料');
        await batchInsert(insertTicket, ticketsValues);
        console.timeEnd('插入票券資料');
        console.log(`${totalTickets} 票券資料插入完成`);
    } catch (err) {
        console.error('錯誤:', err);
    } finally {
        // 關閉資料庫連線
        await client.end();
        console.timeEnd('總時間');
        console.log('資料庫連線已關閉');
    }
}

// 執行主函數
main();
