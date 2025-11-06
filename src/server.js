const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const SessionManager = require('./managers/SessionManager');
const { errorHandler, notFoundHandler, requestLogger } = require('./middlewares/errorHandler');
const { apiKeyAuth } = require('./middlewares/auth');

// 路由
const sessionRoutes = require('./routes/session');
const navigationRoutes = require('./routes/navigation');
const captureRoutes = require('./routes/capture');

const config = require('./config');

// 创建Express应用
const app = express();

// 全局中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(requestLogger); // 请求日志

// 初始化会话管理器
const sessionManager = new SessionManager();
app.locals.sessionManager = sessionManager;

// API认证（如果配置了API Key）
if (config.security.apiKey) {
  app.use('/api', apiKeyAuth);
}

// API路由
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', navigationRoutes);
app.use('/api/sessions', captureRoutes);

// 根路径重定向到健康检查
app.post('/', (req, res) => {
  res.redirect('/api/sessions/health');
});

// 404处理
app.use(notFoundHandler);

// 错误处理中间件（必须最后注册）
app.use(errorHandler);

// 服务关闭时的清理
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await sessionManager.closeAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await sessionManager.closeAllSessions();
  process.exit(0);
});

// 启动服务器
const server = app.listen(config.server.port, config.server.host, () => {
  console.log(`🚀 Crawler service is running on http://${config.server.host}:${config.server.port}`);
  console.log(`📊 Health check: http://${config.server.host}:${config.server.port}/api/sessions/health`);
  console.log(`📝 API documentation available at root endpoint`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  sessionManager.closeAllSessions().finally(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  sessionManager.closeAllSessions().finally(() => {
    process.exit(1);
  });
});

module.exports = app;
