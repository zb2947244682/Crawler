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
