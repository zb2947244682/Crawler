// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import crawlerRouter from './routes/crawler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由
app.use('/api', crawlerRouter);

// VNC远程查看路由
app.get('/vnc/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // 检查会话是否存在（这里需要导入activeSessions，但会有循环依赖问题）
  // 暂时返回一个简单的测试页面
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>远程浏览器查看 - 会话 ${sessionId}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: #f0f0f0;
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            .header {
                background: #333;
                color: white;
                padding: 15px;
                text-align: center;
                font-size: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .status {
                background: #e8f4fd;
                border: 1px solid #b8daff;
                border-radius: 8px;
                padding: 20px;
                margin: 20px;
                text-align: center;
                max-width: 600px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .session-info {
                background: #f8f9fa;
                border-radius: 6px;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #007bff;
            }
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="header">
            🖥️ 远程浏览器查看器
        </div>

        <div class="container">
            <div class="status">
                <div class="loading"></div>
                <strong>正在连接到浏览器会话...</strong>
                <div class="session-info">
                    <strong>会话ID:</strong> ${sessionId}<br>
                    <strong>状态:</strong> 连接中...<br>
                    <strong>时间:</strong> ${new Date().toLocaleString()}
                </div>
                <p>如果连接失败，请确保：</p>
                <ul style="text-align: left; display: inline-block;">
                    <li>浏览器会话已启用远程查看</li>
                    <li>VNC服务正在运行</li>
                    <li>网络连接正常</li>
                </ul>
            </div>
        </div>

        <script>
            // 简单的重连逻辑
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 10;

            function updateStatus(message, isError = false) {
                const statusDiv = document.querySelector('.status');
                const sessionInfo = document.querySelector('.session-info');

                if (isError) {
                    statusDiv.style.borderColor = '#dc3545';
                    statusDiv.style.backgroundColor = '#f8d7da';
                }

                // 移除loading动画
                const loading = document.querySelector('.loading');
                if (loading) {
                    loading.remove();
                }

                statusDiv.innerHTML = '<strong>' + message + '</strong>' +
                    '<div class="session-info">' + sessionInfo.innerHTML + '</div>' +
                    '<p>如果连接失败，请确保：</p>' +
                    '<ul style="text-align: left; display: inline-block;">' +
                    '<li>浏览器会话已启用远程查看</li>' +
                    '<li>VNC服务正在运行</li>' +
                    '<li>网络连接正常</li>' +
                    '</ul>';
            }

            // 检查VNC连接状态
            function checkVNCConnection() {
                // 这里可以添加实际的VNC连接检查逻辑
                setTimeout(() => {
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        updateStatus('正在尝试连接 (' + reconnectAttempts + '/' + maxReconnectAttempts + ')...', false);
                        checkVNCConnection();
                    } else {
                        updateStatus('连接失败，请检查服务状态', true);
                    }
                }, 2000);
            }

            // 页面加载完成后开始检查连接
            window.addEventListener('load', () => {
                updateStatus('正在初始化连接...');
                setTimeout(checkVNCConnection, 1000);
            });
        </script>
    </body>
    </html>
  `);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 首页
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>爬虫API服务</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .api-list { margin: 20px 0; }
            .api-item { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { font-weight: bold; color: #007bff; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .status { padding: 10px; background: #e8f5e8; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 爬虫API服务</h1>
            <div class="status">
                <strong>服务状态:</strong> ✅ 运行中 | <strong>端口:</strong> ${PORT}
            </div>

            <h2>📋 API接口列表</h2>
            <div class="api-list">
                <div class="api-item">
                    <span class="method">POST</span> /api/browser/create
                    <p>创建新的浏览器会话</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/navigate
                    <p>导航到指定URL</p>
                </div>

                <div class="api-item">
                    <span class="method">GET</span> /api/browser/{sessionId}/html
                    <p>获取页面HTML内容</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/cookies/set
                    <p>设置cookies</p>
                </div>

                <div class="api-item">
                    <span class="method">GET</span> /api/browser/{sessionId}/cookies/get
                    <p>获取cookies</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/headers/set
                    <p>设置HTTP头</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/refresh
                    <p>刷新页面</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/scroll
                    <p>滚动页面</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/click
                    <p>点击元素</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/wait
                    <p>等待元素出现</p>
                </div>

                <div class="api-item">
                    <span class="method">GET</span> /api/browser/{sessionId}/status
                    <p>获取会话状态</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/screenshot
                    <p>截取页面截图</p>
                </div>

                <div class="api-item">
                    <span class="method">POST</span> /api/browser/{sessionId}/close
                    <p>关闭浏览器会话</p>
                </div>

                <div class="api-item">
                    <span class="method">GET</span> /api/sessions
                    <p>获取活跃会话列表</p>
                </div>
            </div>

            <h2>💡 使用示例</h2>
            <h3>1. 创建浏览器会话</h3>
            <pre><code>curl -X POST http://localhost:${PORT}/api/browser/create \\
  -H "Content-Type: application/json" \\
  -d '{}'</code></pre>

            <h3>2. 导航到页面</h3>
            <pre><code>curl -X POST http://localhost:${PORT}/api/browser/{sessionId}/navigate \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'</code></pre>

            <h3>3. 获取HTML内容</h3>
            <pre><code>curl http://localhost:${PORT}/api/browser/{sessionId}/html</code></pre>

            <h3>4. 设置Cookies</h3>
            <pre><code>curl -X POST http://localhost:${PORT}/api/browser/{sessionId}/cookies/set \\
  -H "Content-Type: application/json" \\
  -d '{"cookies": [{"name": "token", "value": "abc123", "domain": "example.com"}]}'</code></pre>

            <h3>5. 截取页面截图</h3>
            <pre><code>curl -X POST http://localhost:${PORT}/api/browser/{sessionId}/screenshot \\
  -H "Content-Type: application/json" \\
  -d '{"fullPage": true}'</code></pre>
        </div>
    </body>
    </html>
  `);
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 爬虫API服务已启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});

export default app;
