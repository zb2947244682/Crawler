from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import uvicorn
import asyncio
import os
import uuid
from datetime import datetime
import json

from browser_manager import BrowserManager
from config import config

app = FastAPI(
    title="Playwright Crawler API",
    description="基于Playwright的爬虫工具API服务",
    version="1.0.0"
)

# 初始化浏览器管理器
browser_manager = BrowserManager()

# Pydantic模型
class BrowserCreateRequest(BaseModel):
    headless: bool = True
    user_agent: Optional[str] = None
    viewport_width: int = 1920
    viewport_height: int = 1080
    locale: str = "zh-CN"
    timezone_id: str = "Asia/Shanghai"

class NavigateRequest(BaseModel):
    browser_id: str
    url: str
    wait_until: str = "networkidle"
    timeout: int = 30000

class SetCookieRequest(BaseModel):
    browser_id: str
    cookies: List[Dict[str, Any]]

class SetHeaderRequest(BaseModel):
    browser_id: str
    headers: Dict[str, str]

class ScrollRequest(BaseModel):
    browser_id: str
    x: int = 0
    y: int = 0
    behavior: str = "smooth"

class ScreenshotRequest(BaseModel):
    browser_id: str
    full_page: bool = True
    format: str = "png"
    quality: Optional[int] = None

class ExecuteJSRequest(BaseModel):
    browser_id: str
    script: str

class ClickElementRequest(BaseModel):
    browser_id: str
    selector: str
    timeout: int = 10000

class TypeTextRequest(BaseModel):
    browser_id: str
    selector: str
    text: str
    delay: int = 100

class WaitForElementRequest(BaseModel):
    browser_id: str
    selector: str
    timeout: int = 10000

# API路由
@app.get("/", response_class=HTMLResponse)
async def root():
    """API首页"""
    return """
    <html>
        <head>
            <title>Playwright Crawler API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .endpoint { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
                .method { font-weight: bold; color: #007acc; }
            </style>
        </head>
        <body>
            <h1>🚀 Playwright Crawler API</h1>
            <p>基于Playwright的爬虫工具API服务</p>

            <h2>📋 API端点</h2>

            <div class="endpoint">
                <span class="method">POST</span> /browser/create - 创建新浏览器实例
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/navigate - 导航到URL
            </div>

            <div class="endpoint">
                <span class="method">GET</span> /browser/{browser_id}/html - 获取页面HTML
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/cookies/set - 设置Cookie
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/headers/set - 设置请求头
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/{browser_id}/refresh - 刷新页面
            </div>

            <div class="endpoint">
                <span class="method">GET</span> /browser/{browser_id}/status - 获取页面状态
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/{browser_id}/scroll - 滚动页面
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/{browser_id}/screenshot - 获取截图
            </div>

            <div class="endpoint">
                <span class="method">DELETE</span> /browser/{browser_id} - 关闭浏览器
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/js/execute - 执行JavaScript代码
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/element/click - 点击页面元素
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/element/type - 输入文本到元素
            </div>

            <div class="endpoint">
                <span class="method">POST</span> /browser/element/wait - 等待元素出现
            </div>

            <div class="endpoint">
                <span class="method">GET</span> /browser/{browser_id}/cookies - 获取Cookie
            </div>

            <div class="endpoint">
                <span class="method">GET</span> /browser/list - 列出所有浏览器实例
            </div>

            <h2>📖 文档</h2>
            <p><a href="/docs">Swagger UI 文档</a></p>
            <p><a href="/redoc">ReDoc 文档</a></p>
        </body>
    </html>
    """

@app.post("/browser/create")
async def create_browser(request: BrowserCreateRequest):
    """创建新浏览器实例"""
    try:
        browser_id = await browser_manager.create_browser(
            headless=request.headless,
            user_agent=request.user_agent,
            viewport_width=request.viewport_width,
            viewport_height=request.viewport_height,
            locale=request.locale,
            timezone_id=request.timezone_id
        )
        return {
            "success": True,
            "browser_id": browser_id,
            "message": "浏览器实例创建成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建浏览器失败: {str(e)}")

@app.post("/browser/navigate")
async def navigate_browser(request: NavigateRequest):
    """导航到指定URL"""
    try:
        result = await browser_manager.navigate(
            request.browser_id,
            request.url,
            request.wait_until,
            request.timeout
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导航失败: {str(e)}")

@app.get("/browser/{browser_id}/html")
async def get_page_html(browser_id: str):
    """获取页面HTML内容"""
    try:
        html = await browser_manager.get_html(browser_id)
        return {"success": True, "html": html}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取HTML失败: {str(e)}")

@app.post("/browser/cookies/set")
async def set_cookies(request: SetCookieRequest):
    """设置Cookie"""
    try:
        result = await browser_manager.set_cookies(request.browser_id, request.cookies)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"设置Cookie失败: {str(e)}")

@app.post("/browser/headers/set")
async def set_headers(request: SetHeaderRequest):
    """设置请求头"""
    try:
        result = await browser_manager.set_headers(request.browser_id, request.headers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"设置请求头失败: {str(e)}")

@app.post("/browser/{browser_id}/refresh")
async def refresh_page(browser_id: str):
    """刷新页面"""
    try:
        result = await browser_manager.refresh_page(browser_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刷新页面失败: {str(e)}")

@app.get("/browser/{browser_id}/status")
async def get_page_status(browser_id: str):
    """获取页面状态"""
    try:
        status = await browser_manager.get_page_status(browser_id)
        return {"success": True, "status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")

@app.post("/browser/{browser_id}/scroll")
async def scroll_page(browser_id: str, request: ScrollRequest):
    """滚动页面"""
    try:
        result = await browser_manager.scroll_page(
            browser_id,
            request.x,
            request.y,
            request.behavior
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"滚动失败: {str(e)}")

@app.post("/browser/{browser_id}/screenshot")
async def take_screenshot(browser_id: str, request: ScreenshotRequest, background_tasks: BackgroundTasks):
    """获取页面截图"""
    try:
        screenshot_path = await browser_manager.take_screenshot(
            browser_id,
            request.full_page,
            request.format,
            request.quality
        )
        return FileResponse(
            screenshot_path,
            media_type=f"image/{request.format}",
            filename=f"screenshot.{request.format}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"截图失败: {str(e)}")

@app.delete("/browser/{browser_id}")
async def close_browser(browser_id: str):
    """关闭浏览器实例"""
    try:
        result = await browser_manager.close_browser(browser_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"关闭浏览器失败: {str(e)}")

@app.post("/browser/js/execute")
async def execute_javascript(request: ExecuteJSRequest):
    """执行JavaScript代码"""
    try:
        result = await browser_manager.execute_js(request.browser_id, request.script)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行JavaScript失败: {str(e)}")

@app.post("/browser/element/click")
async def click_element(request: ClickElementRequest):
    """点击页面元素"""
    try:
        result = await browser_manager.click_element(request.browser_id, request.selector, request.timeout)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"点击元素失败: {str(e)}")

@app.post("/browser/element/type")
async def type_text(request: TypeTextRequest):
    """输入文本到元素"""
    try:
        result = await browser_manager.type_text(request.browser_id, request.selector, request.text, request.delay)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"输入文本失败: {str(e)}")

@app.post("/browser/element/wait")
async def wait_for_element(request: WaitForElementRequest):
    """等待元素出现"""
    try:
        result = await browser_manager.wait_for_element(request.browser_id, request.selector, request.timeout)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"等待元素失败: {str(e)}")

@app.get("/browser/{browser_id}/cookies")
async def get_cookies(browser_id: str):
    """获取当前页面的Cookie"""
    try:
        browser_info = browser_manager.browsers.get(browser_id)
        if not browser_info:
            raise HTTPException(status_code=404, detail=f"浏览器实例 {browser_id} 不存在")
        cookies = await browser_info['page'].context.cookies()
        return {"success": True, "cookies": cookies}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Cookie失败: {str(e)}")

@app.get("/browser/list")
async def list_browsers():
    """列出所有活跃的浏览器实例"""
    browsers_info = []
    for browser_id, browser_info in browser_manager.browsers.items():
        try:
            page = browser_info['page']
            browsers_info.append({
                "browser_id": browser_id,
                "url": page.url,
                "title": await page.title(),
                "created_at": browser_info['created_at']
            })
        except Exception:
            browsers_info.append({
                "browser_id": browser_id,
                "error": "无法获取页面信息",
                "created_at": browser_info['created_at']
            })

    return {"success": True, "browsers": browsers_info}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "active_browsers": len(browser_manager.browsers)
    }

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    await browser_manager.cleanup_all()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level=config.LOG_LEVEL.lower()
    )
