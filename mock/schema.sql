-- user_info 表格 (儲存使用者資訊)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,  -- 用戶名，唯一
    email VARCHAR(100) NOT NULL UNIQUE,  -- 電子郵件，唯一
    password_hash VARCHAR(255) NOT NULL,  -- 加密過的密碼
    full_name VARCHAR(100) NOT NULL,  -- 用戶全名
    phone_number VARCHAR(20),  -- 用戶電話號碼
    date_of_birth DATE,  -- 用戶出生日期
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 註冊日期
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 最後登入時間
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'banned')) DEFAULT 'active'  -- 用戶狀態
);

-- lottery_info 表格 (儲存遊戲基本資訊)
CREATE TABLE lottery_info (
    lottery_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    draw_time_days VARCHAR(255) NOT NULL, -- 使用逗號分隔
    draw_time_time TIME NOT NULL,
    total_numbers INT NOT NULL,
    main_numbers INT NOT NULL,
    special_number INT NOT NULL
);

-- prize_types 表格 (儲存不同獎項資訊)
CREATE TABLE prize_types (
    prize_type_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    numbers_range_start INT NOT NULL,
    numbers_range_end INT NOT NULL,
    pay_rate DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- ball_positions 表格 (儲存號碼投注位置的規則)
CREATE TABLE ball_positions (
    ball_position_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    position_name VARCHAR(50) NOT NULL,
    pay_rate DECIMAL(10, 2) NOT NULL,
    valid_number_range_start INT NOT NULL,
    valid_number_range_end INT NOT NULL,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- zodiac_prizes 表格 (儲存生肖獎項資訊)
CREATE TABLE zodiac_prizes (
    zodiac_prize_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    zodiac_name VARCHAR(10) NOT NULL,
    numbers JSON NOT NULL, -- 儲存號碼範圍 [6,18,30,42] 等
    pay_rate DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- double_side_bets 表格 (儲存雙面投注選項)
CREATE TABLE double_side_bets (
    double_side_bet_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    side_name VARCHAR(10) NOT NULL, -- 大, 小, 單, 雙
    number_range_start INT NOT NULL,
    number_range_end INT NOT NULL,
    pay_rate DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- betting_info 表格 (儲存使用者的投注資訊)
CREATE TABLE betting_info (
    bet_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    user_id INT NOT NULL, -- 用戶 ID
    bet_type VARCHAR(50) NOT NULL, -- 正碼, 生肖, 雙面等
    betting_numbers JSON NOT NULL, -- 儲存投注的號碼 [8, 18, 28]
    bet_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- cancellation_policy 表格 (儲存取消政策)
CREATE TABLE cancellation_policy (
    policy_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    can_cancel_before_closing BOOLEAN NOT NULL,
    cancellation_deadline INTERVAL NOT NULL, -- 例如 '30 MINUTE'
    cancellation_limit INT NOT NULL,
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- transaction_info 表格 (儲存用戶交易記錄)
CREATE TABLE transaction_info (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    bet_id INT NOT NULL,  -- 參照 betting_info 中的 bet_id
    amount DECIMAL(10, 2) NOT NULL,  -- 交易金額
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('bet', 'win', 'refund')) NOT NULL,  -- 交易類型：投注、獲勝、退款
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (bet_id) REFERENCES betting_info(bet_id)
);

-- winners_info 表格 (儲存中獎資訊)
CREATE TABLE winners_info (
    winner_id SERIAL PRIMARY KEY,
    bet_id INT NOT NULL,  -- 參照 betting_info 中的 bet_id
    prize_type_id INT NOT NULL,  -- 參照 prize_types 中的獎項類型
    winning_amount DECIMAL(10, 2) NOT NULL,  -- 獲勝金額
    winning_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bet_id) REFERENCES betting_info(bet_id),
    FOREIGN KEY (prize_type_id) REFERENCES prize_types(prize_type_id)
);

-- bet_results 表格 (儲存開獎結果)
CREATE TABLE bet_results (
    result_id SERIAL PRIMARY KEY,
    lottery_id INT NOT NULL,
    draw_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 開獎日期
    winning_numbers JSON NOT NULL,  -- 開獎號碼 [8, 18, 28]
    special_number INT NOT NULL,  -- 特別號
    FOREIGN KEY (lottery_id) REFERENCES lottery_info(lottery_id)
);

-- achievements 表格 (儲存用戶獎勳或獎勳資訊) => 給予用戶在投注過程中的獎勳或獎勳系統（如累積積分等）
CREATE TABLE achievements (
    achievement_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,  -- 例如 'Lucky Winner', 'High Roller' 等
    achievement_description TEXT,  -- 描述
    achievement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
