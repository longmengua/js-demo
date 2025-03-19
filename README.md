# js-demo

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