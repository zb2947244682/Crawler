import asyncio
import os
import uuid
from typing import Dict, Optional, List, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from playwright_stealth import stealth_async
import aiofiles
from datetime import datetime
import json
from config import config

class BrowserManager:
    """浏览器管理器"""

    def __init__(self):
        self.playwright = None
        self.browsers: Dict[str, Dict[str, Any]] = {}  # browser_id -> browser_info
        self.screenshots_dir = config.SCREENSHOTS_DIR
        os.makedirs(self.screenshots_dir, exist_ok=True)

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup_all()

    async def initialize(self):
        """初始化Playwright"""
        if not self.playwright:
            self.playwright = await async_playwright().start()

    async def cleanup_all(self):
        """清理所有浏览器实例"""
        for browser_info in self.browsers.values():
            try:
                await browser_info['context'].close()
                await browser_info['browser'].close()
            except Exception as e:
                print(f"清理浏览器时出错: {e}")

        self.browsers.clear()

        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def create_browser(
        self,
        headless: bool = True,
        user_agent: Optional[str] = None,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
        locale: str = "zh-CN",
        timezone_id: str = "Asia/Shanghai"
    ) -> str:
        """创建新的浏览器实例"""

        if not self.playwright:
            await self.initialize()

        browser_id = str(uuid.uuid4())

        # 启动浏览器
        browser = await self.playwright.chromium.launch(
            headless=headless,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor"
            ]
        )

        # 创建上下文
        context = await browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            user_agent=user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale=locale,
            timezone_id=timezone_id,
            ignore_https_errors=True,
            extra_http_headers={}
        )

        # 创建页面
        page = await context.new_page()

        # 应用stealth插件
        await stealth_async(page)

        # 保存浏览器信息
        self.browsers[browser_id] = {
            'browser': browser,
            'context': context,
            'page': page,
            'headers': {},
            'created_at': datetime.utcnow().isoformat()
        }

        return browser_id

    def _get_browser_info(self, browser_id: str) -> Dict[str, Any]:
        """获取浏览器信息"""
        if browser_id not in self.browsers:
            raise ValueError(f"浏览器实例 {browser_id} 不存在")
        return self.browsers[browser_id]

    async def navigate(
        self,
        browser_id: str,
        url: str,
        wait_until: str = "networkidle",
        timeout: int = 30000
    ) -> Dict[str, Any]:
        """导航到指定URL"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            # 设置额外的请求头
            if browser_info['headers']:
                await page.set_extra_http_headers(browser_info['headers'])

            response = await page.goto(url, wait_until=wait_until, timeout=timeout)

            return {
                "success": True,
                "url": page.url,
                "title": await page.title(),
                "status": response.status if response else None,
                "headers": dict(response.headers) if response else None
            }
        except Exception as e:
            raise Exception(f"导航失败: {str(e)}")

    async def get_html(self, browser_id: str) -> str:
        """获取页面HTML内容"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            html = await page.content()
            return html
        except Exception as e:
            raise Exception(f"获取HTML失败: {str(e)}")

    async def set_cookies(self, browser_id: str, cookies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """设置Cookie"""
        browser_info = self._get_browser_info(browser_id)
        context = browser_info['context']

        try:
            await context.add_cookies(cookies)
            return {"success": True, "message": f"成功设置 {len(cookies)} 个Cookie"}
        except Exception as e:
            raise Exception(f"设置Cookie失败: {str(e)}")

    async def set_headers(self, browser_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
        """设置请求头"""
        browser_info = self._get_browser_info(browser_id)

        try:
            browser_info['headers'].update(headers)
            return {"success": True, "message": f"成功设置 {len(headers)} 个请求头"}
        except Exception as e:
            raise Exception(f"设置请求头失败: {str(e)}")

    async def refresh_page(self, browser_id: str) -> Dict[str, Any]:
        """刷新页面"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            response = await page.reload(wait_until="networkidle", timeout=30000)
            return {
                "success": True,
                "url": page.url,
                "title": await page.title(),
                "status": response.status if response else None
            }
        except Exception as e:
            raise Exception(f"刷新页面失败: {str(e)}")

    async def get_page_status(self, browser_id: str) -> Dict[str, Any]:
        """获取页面状态"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            # 获取页面基本信息
            url = page.url
            title = await page.title()

            # 获取页面大小
            viewport = page.viewport_size

            # 获取滚动位置
            scroll_position = await page.evaluate("""
                () => ({
                    x: window.pageXOffset,
                    y: window.pageYOffset,
                    width: document.documentElement.scrollWidth,
                    height: document.documentElement.scrollHeight,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight
                })
            """)

            # 获取网络状态
            network_status = await page.evaluate("""
                () => ({
                    readyState: document.readyState,
                    loading: window.performance.timing.loadEventEnd === 0
                })
            """)

            return {
                "url": url,
                "title": title,
                "viewport": viewport,
                "scroll_position": scroll_position,
                "network_status": network_status,
                "cookies_count": len(await page.context.cookies()),
                "headers": browser_info['headers']
            }
        except Exception as e:
            raise Exception(f"获取页面状态失败: {str(e)}")

    async def scroll_page(
        self,
        browser_id: str,
        x: int = 0,
        y: int = 0,
        behavior: str = "smooth"
    ) -> Dict[str, Any]:
        """滚动页面"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            if x == 0 and y == 0:
                # 如果是滚动到顶部或底部，根据当前位置决定
                current_scroll = await page.evaluate("() => ({x: window.pageXOffset, y: window.pageYOffset})")
                if current_scroll['y'] > 0:
                    # 滚动到顶部
                    await page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
                    return {"success": True, "action": "scroll_to_top"}
                else:
                    # 滚动到底部
                    await page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})")
                    return {"success": True, "action": "scroll_to_bottom"}
            else:
                # 滚动到指定位置
                await page.evaluate(f"window.scrollTo({{left: {x}, top: {y}, behavior: '{behavior}'}})")
                return {"success": True, "action": "scroll_to_position", "position": {"x": x, "y": y}}
        except Exception as e:
            raise Exception(f"滚动失败: {str(e)}")

    async def take_screenshot(
        self,
        browser_id: str,
        full_page: bool = True,
        format: str = "png",
        quality: Optional[int] = None
    ) -> str:
        """获取页面截图"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{browser_id}_{timestamp}.{format}"
            filepath = os.path.join(self.screenshots_dir, filename)

            await page.screenshot(
                path=filepath,
                full_page=full_page,
                type=format,
                quality=quality
            )

            return filepath
        except Exception as e:
            raise Exception(f"截图失败: {str(e)}")

    async def close_browser(self, browser_id: str) -> Dict[str, Any]:
        """关闭浏览器实例"""
        if browser_id not in self.browsers:
            return {"success": True, "message": "浏览器实例已关闭或不存在"}

        try:
            browser_info = self.browsers[browser_id]
            await browser_info['context'].close()
            await browser_info['browser'].close()
            del self.browsers[browser_id]
            return {"success": True, "message": "浏览器实例已关闭"}
        except Exception as e:
            raise Exception(f"关闭浏览器失败: {str(e)}")

    async def execute_js(self, browser_id: str, script: str) -> Any:
        """执行JavaScript代码"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            result = await page.evaluate(script)
            return result
        except Exception as e:
            raise Exception(f"执行JavaScript失败: {str(e)}")

    async def click_element(self, browser_id: str, selector: str, timeout: int = 10000) -> Dict[str, Any]:
        """点击元素"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            await page.click(selector, timeout=timeout)
            return {"success": True, "message": f"成功点击元素: {selector}"}
        except Exception as e:
            raise Exception(f"点击元素失败: {str(e)}")

    async def type_text(self, browser_id: str, selector: str, text: str, delay: int = 100) -> Dict[str, Any]:
        """输入文本"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            await page.fill(selector, "")
            await page.type(selector, text, delay=delay)
            return {"success": True, "message": f"成功输入文本到: {selector}"}
        except Exception as e:
            raise Exception(f"输入文本失败: {str(e)}")

    async def wait_for_element(self, browser_id: str, selector: str, timeout: int = 10000) -> Dict[str, Any]:
        """等待元素出现"""
        browser_info = self._get_browser_info(browser_id)
        page = browser_info['page']

        try:
            await page.wait_for_selector(selector, timeout=timeout)
            return {"success": True, "message": f"元素已出现: {selector}"}
        except Exception as e:
            raise Exception(f"等待元素失败: {str(e)}")
