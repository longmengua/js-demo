import { Client } from 'pg';

// 創建 PostgreSQL 客戶端
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
});

// 隨機生成號碼的函數
const generateRandomNumbers = (rangeStart: number, rangeEnd: number, count: number): number[] => {
    const numbers: Set<number> = new Set();
    while (numbers.size < count) {
        const randomNumber = Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
        numbers.add(randomNumber);
    }
    return Array.from(numbers);
};

// 記錄開獎結果到資料庫（你可以選擇是否要儲存開獎結果）
const recordDrawResult = async (lotteryId: number, winningNumbers: number[], specialNumber: number) => {
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

// 計算中獎金額
const calculateWinningAmount = async (lotteryId: number, betType: string, bettingNumbers: number[], winningNumbers: number[], specialNumber: number): Promise<number> => {
    let winningAmount = 0;

    // 根據 bet_type 來判斷獎金計算邏輯
    switch (betType) {
        case '正碼':
            // 假設正碼是主號碼中任意 3 顆號碼匹配
            const matchedMainNumbers = bettingNumbers.filter(num => winningNumbers.includes(num)).length;
            if (matchedMainNumbers >= 3) {
                // 這裡的計算邏輯你可以根據實際情況來修改
                winningAmount = matchedMainNumbers * 100;  // 假設每中一個號碼獎金為 100
            }
            break;

        case '生肖':
            // 假設生肖是依照特別號碼來匹配
            if (bettingNumbers.includes(specialNumber)) {
                winningAmount = 500;  // 假設生肖中獎金額是 500
            }
            break;

        case '雙面':
            // 假設雙面是根據大小單雙來判斷
            // 這裡可以根據特定邏輯來處理
            break;

        // 更多的投注類型可以根據需求添加
    }

    return winningAmount;
};

// 處理中獎結果並更新資料庫
const notifyWinnersAndUpdate = async (lotteryId: number, winningNumbers: number[], specialNumber: number) => {
    try {
        // 查找所有該彩票遊戲的投注資料
        const betsRes = await client.query(
            'SELECT * FROM betting_info WHERE lottery_id = $1',
            [lotteryId]
        );

        if (betsRes.rows.length === 0) {
            console.log('No bets found for this lottery!');
            return;
        }

        // 遍歷每個投注，並比對是否中獎
        for (let bet of betsRes.rows) {
            const { bet_id, user_id, bet_type, betting_numbers } = bet;

            // 計算中獎金額
            const winningAmount = await calculateWinningAmount(lotteryId, bet_type, betting_numbers, winningNumbers, specialNumber);

            if (winningAmount > 0) {
                // 中獎，將結果插入到 winners_info 表格
                const insertQuery = `
                    INSERT INTO winners_info (bet_id, prize_type_id, winning_amount, winning_time)
                    VALUES ($1, (SELECT prize_type_id FROM prize_types WHERE lottery_id = $2 LIMIT 1), $3, CURRENT_TIMESTAMP)
                `;
                await client.query(insertQuery, [bet_id, lotteryId, winningAmount]);
                console.log(`User ${user_id} won ${winningAmount} on bet ${bet_id}`);

                // 這裡還可以添加其他的通知邏輯，比如發送郵件、訊息等
            }
        }
    } catch (error) {
        console.error('Error notifying winners and updating database:', error);
    }
};

// 開獎函數
const drawLottery = async (lotteryId: number) => {
    try {
        // 獲取彩票遊戲的基本資訊
        const res = await client.query(
            'SELECT * FROM lottery_info WHERE lottery_id = $1',
            [lotteryId]
        );

        if (res.rows.length === 0) {
            console.log('Lottery not found!');
            return;
        }

        const lottery = res.rows[0];
        const { total_numbers, main_numbers, special_number, draw_time_days, draw_time_time } = lottery;

        // 隨機選擇主號碼
        const mainNumbers = generateRandomNumbers(1, total_numbers, main_numbers);

        // 隨機選擇特別號碼
        const specialNumbers = generateRandomNumbers(1, total_numbers, special_number);

        // 記錄開獎結果到資料庫
        await recordDrawResult(lotteryId, mainNumbers, specialNumbers[0]);

        // 通知中獎用戶並更新中獎資料
        await notifyWinnersAndUpdate(lotteryId, mainNumbers, specialNumbers[0]);

    } catch (error) {
        console.error('Error drawing lottery:', error);
    }
};

// 啟動應用程序
async function main() {
    await client.connect();
    // 執行開獎（例如，開獎 ID 為 1 的遊戲）
    await drawLottery(1);
    await client.end();
}

main();