from locust import HttpUser, task, between
import time

class CourseActivityUser(HttpUser):
    wait_time = between(0.5, 1)  # 每個請求間隔 0.5-1 秒

    def on_start(self):
        """模擬使用者登入，取得 Bearer Token (如果適用)"""
        self.token = ""  # 這裡填入有效的 Bearer Token

    @task
    def get_member_info(self):
        """xxx API"""
        member_id = 924879
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "*/*",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
        url = f"/api"
        self.client.get(url, headers=headers)
