select count(*) from users;
select count(*) from betting_info;
select count(*) from transaction_info;
select count(*) from winners_info wi;

-- 批次刪除資料，一千萬筆資料
DO $$ 
DECLARE 
    batch_size INT := 100000;  -- 每次刪除 10 萬筆
    rows_deleted INT := 1; 
BEGIN
    WHILE rows_deleted > 0 LOOP
        DELETE FROM betting_info 
        WHERE bet_id IN (
            SELECT bet_id FROM betting_info 
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = betting_info.user_id)
            ORDER BY bet_id 
            LIMIT batch_size
        );

        GET DIAGNOSTICS rows_deleted = ROW_COUNT; -- 取得刪除的行數
        
        COMMIT; -- 確保每批刪除後都提交
    END LOOP;
END $$;

-- 關閉索引 & 觸發器（減少插入成本）
ALTER TABLE transaction_info SET UNLOGGED;  -- 降低寫入成本
ALTER TABLE transaction_info DISABLE TRIGGER ALL;  -- 停用觸發器（如果有的話）
-- 插入完成後重新啟用索引 & 觸發器
ALTER TABLE transaction_info SET LOGGED;  
ALTER TABLE transaction_info ENABLE TRIGGER ALL;  


-- 批次新增資料，一千萬筆資料
DO $$ 
DECLARE 
    batch_size INT := 100000;  -- 每批插入 10 萬筆
    total_batches INT := 100;  -- 總共執行 100 批
    i INT := 0;
BEGIN
    WHILE i < total_batches LOOP
        INSERT INTO transaction_info (user_id, bet_id, amount, transaction_type, transaction_time)
        SELECT user_id, bet_id, amount, transaction_type, transaction_time
        FROM (
            SELECT 
                b.user_id, 
                b.bet_id, 
                (RANDOM() * 100)::DECIMAL(10,2) AS amount,  
                'bet' AS transaction_type, 
                NOW() - (INTERVAL '1 day' * FLOOR(RANDOM() * 30)) AS transaction_time
            FROM betting_info b
            ORDER BY b.bet_id
            LIMIT batch_size
        ) AS subquery;

        i := i + 1;
    END LOOP;

    COMMIT;  -- 統一提交
END $$;


