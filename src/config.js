/**
 * 配置文件
 */

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    timeout: 30000, // 30秒超时
  },

  // 会话管理配置
  session: {
    // 会话超时时间（毫秒），30分钟
    timeout: 30 * 60 * 1000,
    // 最大并发会话数
    maxConcurrentSessions: parseInt(process.env.MAX_SESSIONS) || 20,
    // 清理间隔（毫秒），每5分钟清理一次
    cleanupInterval: 5 * 60 * 1000,
  },

  // Playwright 浏览器配置
  browser: {
    headless: process.env.HEADLESS !== 'false', // 默认无头模式
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    // 默认上下文配置（模拟真实浏览器）
    defaultContext: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
        'Sec-Ch-Ua': '"Chromium";v="120", "Microsoft Edge";v="120", "Not_A Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
      },
    },
    // 浏览器启动参数
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      // 添加更多真实浏览器参数
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  },

  // 页面操作配置
  page: {
    // 默认等待策略
    waitUntil: 'networkidle',
    // 默认超时时间
    timeout: 30000,
    // 截图质量
    screenshotQuality: 80,
  },

  // 安全配置
  security: {
    // API Key（如果启用认证）
    apiKey: process.env.API_KEY,
    // URL 白名单（可选）
    allowedDomains: process.env.ALLOWED_DOMAINS?.split(',') || null,
    // 最大 URL 长度
    maxUrlLength: 2048,
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
