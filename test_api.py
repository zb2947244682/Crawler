#!/usr/bin/env python3
"""
Playwright Crawler API 测试脚本
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    """测试API功能"""
    print("🧪 开始测试 Playwright Crawler API...")

    try:
        # 1. 健康检查
        print("\n1. 健康检查...")
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        print("✅ 健康检查通过")

        # 2. 创建浏览器实例
        print("\n2. 创建浏览器实例...")
        browser_data = {
            "headless": True,
            "viewport_width": 1920,
            "viewport_height": 1080
        }
        response = requests.post(f"{BASE_URL}/browser/create", json=browser_data)
        assert response.status_code == 200
        browser_id = response.json()["browser_id"]
        print(f"✅ 浏览器实例创建成功: {browser_id}")

        # 3. 导航到测试页面
        print("\n3. 导航到测试页面...")
        navigate_data = {
            "browser_id": browser_id,
            "url": "https://httpbin.org/html",
            "wait_until": "networkidle"
        }
        response = requests.post(f"{BASE_URL}/browser/navigate", json=navigate_data)
        assert response.status_code == 200
        print("✅ 页面导航成功")

        # 4. 获取页面HTML
        print("\n4. 获取页面HTML...")
        response = requests.get(f"{BASE_URL}/browser/{browser_id}/html")
        assert response.status_code == 200
        html_content = response.json()["html"]
        assert len(html_content) > 0
        print(f"✅ 获取HTML成功，长度: {len(html_content)} 字符")

        # 5. 获取页面状态
        print("\n5. 获取页面状态...")
        response = requests.get(f"{BASE_URL}/browser/{browser_id}/status")
        assert response.status_code == 200
        status = response.json()["status"]
        assert "url" in status
        print(f"✅ 页面状态获取成功，当前URL: {status['url']}")

        # 6. 执行JavaScript
        print("\n6. 执行JavaScript...")
        js_data = {
            "browser_id": browser_id,
            "script": "return document.title;"
        }
        response = requests.post(f"{BASE_URL}/browser/js/execute", json=js_data)
        assert response.status_code == 200
        title = response.json()["result"]
        print(f"✅ JavaScript执行成功，页面标题: {title}")

        # 7. 滚动页面
        print("\n7. 滚动页面...")
        scroll_data = {
            "browser_id": browser_id,
            "x": 0,
            "y": 500
        }
        response = requests.post(f"{BASE_URL}/browser/{browser_id}/scroll", json=scroll_data)
        assert response.status_code == 200
        print("✅ 页面滚动成功")

        # 8. 获取截图
        print("\n8. 获取截图...")
        screenshot_data = {
            "browser_id": browser_id,
            "full_page": False,
            "format": "png"
        }
        response = requests.post(f"{BASE_URL}/browser/{browser_id}/screenshot", json=screenshot_data)
        assert response.status_code == 200
        print("✅ 截图获取成功")

        # 9. 设置Cookie
        print("\n9. 设置Cookie...")
        cookie_data = {
            "browser_id": browser_id,
            "cookies": [
                {
                    "name": "test_cookie",
                    "value": "test_value",
                    "domain": "httpbin.org",
                    "path": "/"
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/browser/cookies/set", json=cookie_data)
        assert response.status_code == 200
        print("✅ Cookie设置成功")

        # 10. 获取Cookie
        print("\n10. 获取Cookie...")
        response = requests.get(f"{BASE_URL}/browser/{browser_id}/cookies")
        assert response.status_code == 200
        cookies = response.json()["cookies"]
        print(f"✅ 获取Cookie成功，共 {len(cookies)} 个Cookie")

        # 11. 列出浏览器实例
        print("\n11. 列出浏览器实例...")
        response = requests.get(f"{BASE_URL}/browser/list")
        assert response.status_code == 200
        browsers = response.json()["browsers"]
        assert len(browsers) > 0
        print(f"✅ 浏览器实例列表获取成功，共 {len(browsers)} 个实例")

        # 12. 关闭浏览器
        print("\n12. 关闭浏览器...")
        response = requests.delete(f"{BASE_URL}/browser/{browser_id}")
        assert response.status_code == 200
        print("✅ 浏览器关闭成功")

        print("\n🎉 所有测试通过！API工作正常。")
        return True

    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器，请确保服务正在运行")
        print("启动服务: python app.py 或 docker-compose up")
        return False
    except AssertionError as e:
        print(f"❌ 测试失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
