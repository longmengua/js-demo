# js-demo

# milestone

- 2025.03.20 
    - 初步測試兩百萬筆用戶資料、一千萬筆投注資料、單一資料庫連線、批次處理量為一萬筆，開獎時間為5分鐘內。(v1)
    - 改用worker處理、單一資料庫連線、批次處理量為兩萬筆，開獎時間為「4:36.214」。(v2)
    - v1版本改用連接池方式處理，max為20，開獎時間為「3:14.813」。(v3)
    - 調整v3版本的批次處理量為兩萬筆，開獎時間為「1:46.142」。(v4)
    - 調整v4版本的批次處理量為四萬筆，開獎時間為「1:47.003」。(v5)
        - 看起來有一個瓶頸，調整批次處理數量、連線數已經不會影響效率了，在排查看看瓶頸在哪。
    - 

# phases

- phase 1
    - 新增相關需要的DB, ELK, Locust的docker-compose file

- phase 2
    - 新增typescript環境，初始化typescript config檔案「npx tsc --init」。

- phase 3
    - 參考 Ku Leo，實作「台灣大樂透」
        - https://www.kubct.net/wp/%e5%8f%b0%e7%81%a3%e5%a4%a7%e6%a8%82%e9%80%8f/

- phase 3.1
    - 先依據規則，設計 schema。

- phase 3.2
    - 建立生成模擬測試資料的ts檔案，用戶2百萬筆，投注資料1千萬筆。

- phase 3.3
    - 測試開獎效能，針對 local 端處理，不搭配任何其他架構
        - 先用傳統式 DB 測試

- phase 3.4
    - 轉用 noSQL 測試 

- phase 3.5
    - 搭配 Redis 優化開獎效能