-- 用戶資料表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,       -- 用戶ID
    name VARCHAR(255) NOT NULL,   -- 用戶名稱
    email VARCHAR(255) UNIQUE NOT NULL,  -- 用戶電子郵件
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 註冊時間
);

-- 大樂透活動資料表
CREATE TABLE IF NOT EXISTS lotteries (
    id SERIAL PRIMARY KEY,       -- 活動ID
    lottery_date DATE NOT NULL,   -- 開獎日期
    total_prize DECIMAL(15, 2) NOT NULL, -- 總獎金
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 活動創建時間
);

-- 票券資料表，記錄用戶參與的每張彩票和所選號碼
CREATE TABLE IF NOT EXISTS lottery_tickets (
    id SERIAL PRIMARY KEY,       -- 票券ID
    user_id INT NOT NULL,        -- 用戶ID (參與者)
    lottery_id INT NOT NULL,     -- 活動ID (對應 lotteries 表)
    numbers VARCHAR(255) NOT NULL,  -- 用戶選擇的號碼（以逗號分隔）
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 購買時間
    FOREIGN KEY (user_id) REFERENCES users(id), -- 用戶外鍵
    FOREIGN KEY (lottery_id) REFERENCES lotteries(id) -- 大樂透活動外鍵
);

-- 開獎結果表，記錄每期大樂透的開獎號碼
CREATE TABLE IF NOT EXISTS lottery_results (
    id SERIAL PRIMARY KEY,       -- 開獎結果ID
    lottery_id INT NOT NULL,     -- 活動ID
    winning_numbers VARCHAR(255) NOT NULL,  -- 開獎號碼
    draw_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 開獎時間
    FOREIGN KEY (lottery_id) REFERENCES lotteries(id) -- 活動外鍵
);

-- 中奖者表，記錄每期中獎的用戶資訊
CREATE TABLE IF NOT EXISTS lottery_winners (
    id SERIAL PRIMARY KEY,       -- 中獎紀錄ID
    lottery_result_id INT NOT NULL,   -- 開獎結果ID
    user_id INT NOT NULL,        -- 中獎的用戶ID
    prize DECIMAL(15, 2) NOT NULL,  -- 獎金
    FOREIGN KEY (lottery_result_id) REFERENCES lottery_results(id), -- 開獎結果外鍵
    FOREIGN KEY (user_id) REFERENCES users(id) -- 用戶外鍵
);
