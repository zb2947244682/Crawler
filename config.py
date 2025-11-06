"""
Playwright Crawler API 配置
"""

import os
from typing import Optional

class Config:
    """应用配置"""

    # 服务器配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # 截图配置
    SCREENSHOTS_DIR: str = os.getenv("SCREENSHOTS_DIR", "screenshots")

    # Playwright 配置
    PLAYWRIGHT_HEADLESS: bool = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
    PLAYWRIGHT_BROWSER: str = os.getenv("PLAYWRIGHT_BROWSER", "chromium")

    # 超时配置（毫秒）
    DEFAULT_TIMEOUT: int = int(os.getenv("DEFAULT_TIMEOUT", "30000"))
    NAVIGATION_TIMEOUT: int = int(os.getenv("NAVIGATION_TIMEOUT", "60000"))

    # 浏览器默认配置
    DEFAULT_VIEWPORT_WIDTH: int = int(os.getenv("DEFAULT_VIEWPORT_WIDTH", "1920"))
    DEFAULT_VIEWPORT_HEIGHT: int = int(os.getenv("DEFAULT_VIEWPORT_HEIGHT", "1080"))
    DEFAULT_USER_AGENT: Optional[str] = os.getenv("DEFAULT_USER_AGENT")
    DEFAULT_LOCALE: str = os.getenv("DEFAULT_LOCALE", "zh-CN")
    DEFAULT_TIMEZONE: str = os.getenv("DEFAULT_TIMEZONE", "Asia/Shanghai")

    # Docker 配置
    DOCKER_MEMORY_LIMIT: str = os.getenv("DOCKER_MEMORY_LIMIT", "2g")
    DOCKER_SHM_SIZE: str = os.getenv("DOCKER_SHM_SIZE", "2g")

# 全局配置实例
config = Config()
