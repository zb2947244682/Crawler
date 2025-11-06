import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getBrowser, releaseBrowser } from '../utils/browser.js';

const router = express.Router();

// 存储活跃的浏览器会话
const activeSessions = new Map();

// 中间件：验证session
const validateSession = (req, res, next) => {
  const { sessionId } = req.params || req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: '缺少sessionId参数' });
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: '会话不存在或已过期' });
  }

  req.session = session;
  next();
};

/**
 * POST /api/browser/create
 * 创建新的浏览器会话
 */
router.post('/browser/create', async (req, res) => {
  const {
    userAgent,
    viewport = { width: 1920, height: 1080 },
    headless = process.env.NODE_ENV === 'production' ? false : true, // 生产环境默认可视化
    proxy,
    extraHTTPHeaders = {},
    remoteView = false // 启用远程查看
  } = req.body;

  try {
    const sessionId = uuidv4();

    const browserInstance = await getBrowser({
      userAgent,
      viewport,
      headless: remoteView ? false : headless, // 如果启用远程查看，强制使用可视化浏览器
      proxy,
      extraHTTPHeaders,
      remoteView
    });

    const session = {
      id: sessionId,
      browserInstance,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      remoteView
    };

    activeSessions.set(sessionId, session);

    // 构建远程查看链接 - 通过URL路径区分会话
    const remoteViewUrl = remoteView ? `http://localhost:8080/vnc/${sessionId}` : null;

    res.json({
      success: true,
      sessionId,
      remoteViewUrl,
      message: remoteView ? '浏览器会话创建成功，支持远程查看' : '浏览器会话创建成功',
      remoteViewEnabled: remoteView
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/navigate
 * 导航到指定URL
 */
router.post('/browser/:sessionId/navigate', validateSession, async (req, res) => {
  const { url, waitUntil = 'domcontentloaded', timeout = 30000 } = req.body;
  const { browserInstance } = req.session;

  if (!url) {
    return res.status(400).json({ success: false, error: '缺少url参数' });
  }

  try {
    await browserInstance.page.goto(url, { waitUntil, timeout });
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      url: browserInstance.page.url(),
      title: await browserInstance.page.title()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/:sessionId/html
 * 获取当前页面的HTML内容
 */
router.get('/browser/:sessionId/html', validateSession, async (req, res) => {
  const { browserInstance } = req.session;

  try {
    const html = await browserInstance.page.content();
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      html,
      url: browserInstance.page.url()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/cookies/set
 * 设置cookies
 */
router.post('/browser/:sessionId/cookies/set', validateSession, async (req, res) => {
  const { cookies } = req.body;
  const { browserInstance } = req.session;

  if (!Array.isArray(cookies)) {
    return res.status(400).json({ success: false, error: 'cookies必须是数组' });
  }

  try {
    const formattedCookies = cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || new URL(browserInstance.page.url()).hostname,
      path: cookie.path || '/',
      expires: cookie.expires || -1,
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite || 'Lax'
    }));

    await browserInstance.context.addCookies(formattedCookies);
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      message: `成功设置 ${cookies.length} 个cookie`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/:sessionId/cookies/get
 * 获取当前页面的cookies
 */
router.get('/browser/:sessionId/cookies/get', validateSession, async (req, res) => {
  const { browserInstance } = req.session;

  try {
    const cookies = await browserInstance.context.cookies();
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      cookies
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/headers/set
 * 设置额外的HTTP头
 */
router.post('/browser/:sessionId/headers/set', validateSession, async (req, res) => {
  const { headers } = req.body;
  const { browserInstance } = req.session;

  if (!headers || typeof headers !== 'object') {
    return res.status(400).json({ success: false, error: 'headers必须是对象' });
  }

  try {
    await browserInstance.context.setExtraHTTPHeaders(headers);
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      message: 'HTTP头设置成功'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/refresh
 * 刷新当前页面
 */
router.post('/browser/:sessionId/refresh', validateSession, async (req, res) => {
  const { waitUntil = 'domcontentloaded', timeout = 30000 } = req.body;
  const { browserInstance } = req.session;

  try {
    await browserInstance.page.reload({ waitUntil, timeout });
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      url: browserInstance.page.url(),
      title: await browserInstance.page.title()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/scroll
 * 滚动页面
 */
router.post('/browser/:sessionId/scroll', validateSession, async (req, res) => {
  const {
    x = 0,
    y = 0,
    behavior = 'smooth',
    selector,
    scrollToBottom = false
  } = req.body;
  const { browserInstance } = req.session;

  try {
    if (scrollToBottom) {
      // 滚动到底部
      await browserInstance.page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      });
    } else if (selector) {
      // 滚动到指定元素
      await browserInstance.page.locator(selector).scrollIntoViewIfNeeded();
    } else {
      // 滚动到指定位置
      await browserInstance.page.evaluate(({ x, y, behavior }) => {
        window.scrollTo({ left: x, top: y, behavior });
      }, { x, y, behavior });
    }

    // 等待滚动完成
    await browserInstance.page.waitForTimeout(1000);
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      scrollPosition: await browserInstance.page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/click
 * 点击页面元素
 */
router.post('/browser/:sessionId/click', validateSession, async (req, res) => {
  const { selector, delay = 1000 } = req.body;
  const { browserInstance } = req.session;

  if (!selector) {
    return res.status(400).json({ success: false, error: '缺少selector参数' });
  }

  try {
    await browserInstance.page.click(selector);
    if (delay > 0) {
      await browserInstance.page.waitForTimeout(delay);
    }
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      message: '点击操作完成'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/wait
 * 等待元素出现
 */
router.post('/browser/:sessionId/wait', validateSession, async (req, res) => {
  const { selector, timeout = 10000 } = req.body;
  const { browserInstance } = req.session;

  if (!selector) {
    return res.status(400).json({ success: false, error: '缺少selector参数' });
  }

  try {
    await browserInstance.page.waitForSelector(selector, { timeout });
    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      message: '元素等待完成'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/:sessionId/status
 * 获取浏览器会话状态
 */
router.get('/browser/:sessionId/status', validateSession, async (req, res) => {
  const session = req.session;
  const { browserInstance } = session;

  try {
    const url = browserInstance.page.url();
    const title = await browserInstance.page.title();

    res.json({
      success: true,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        age: Date.now() - session.createdAt
      },
      page: {
        url,
        title,
        viewport: await browserInstance.page.viewportSize()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/screenshot
 * 截取页面截图
 */
router.post('/browser/:sessionId/screenshot', validateSession, async (req, res) => {
  const {
    fullPage = true,
    type = 'png',
    quality = 80,
    selector
  } = req.body;
  const { browserInstance } = req.session;

  try {
    let screenshotBuffer;

    if (selector) {
      // 截取指定元素
      const element = await browserInstance.page.locator(selector);
      screenshotBuffer = await element.screenshot({ type, quality });
    } else {
      // 截取整个页面
      screenshotBuffer = await browserInstance.page.screenshot({
        fullPage,
        type,
        quality
      });
    }

    req.session.lastActivity = Date.now();

    res.json({
      success: true,
      screenshot: screenshotBuffer.toString('base64'),
      size: screenshotBuffer.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/:sessionId/close
 * 关闭浏览器会话
 */
router.post('/browser/:sessionId/close', validateSession, async (req, res) => {
  const session = req.session;

  try {
    activeSessions.delete(session.id);
    await releaseBrowser(session.browserInstance);

    res.json({
      success: true,
      message: '浏览器会话已关闭'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sessions
 * 获取所有活跃会话列表
 */
router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    id: session.id,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    age: Date.now() - session.createdAt
  }));

  res.json({
    success: true,
    sessions,
    total: sessions.length
  });
});

/**
 * GET /vnc/:sessionId
 * 远程查看浏览器界面
 */
router.get('/vnc/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // 检查会话是否存在
  const session = activeSessions.get(sessionId);
  if (!session || !session.remoteView) {
    return res.status(404).send(`
      <html>
        <body>
          <h2>会话不存在或未启用远程查看</h2>
          <p>Session ID: ${sessionId}</p>
          <p><a href="/">返回首页</a></p>
        </body>
      </html>
    `);
  }

  // 返回noVNC页面
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
            }
            .header {
                background: #333;
                color: white;
                padding: 10px;
                text-align: center;
                font-size: 14px;
            }
            .session-info {
                background: #e8f4fd;
                padding: 8px;
                border-bottom: 1px solid #ccc;
                font-size: 12px;
            }
            #noVNC_container {
                width: 100%;
                height: calc(100vh - 60px);
            }
            .status {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="header">
            远程浏览器查看器 - 会话: ${sessionId}
        </div>
        <div class="session-info">
            创建时间: ${new Date(session.createdAt).toLocaleString()} |
            最后活动: ${new Date(session.lastActivity).toLocaleString()} |
            远程查看: ${session.remoteView ? '启用' : '禁用'}
        </div>
        <div id="noVNC_container">
            <div id="noVNC_screen">
                <div id="noVNC_status">正在连接到VNC服务器...</div>
            </div>
        </div>
        <div id="noVNC_status" class="status">正在初始化...</div>

        <script type="module">
            import RFB from '/app/core/rfb.js';
            import * as Log from '/app/core/util/logging.js';

            // 设置日志级别
            Log.init_logging('warn');

            let rfb;

            function connect() {
                const host = window.location.hostname;
                const port = 8080; // WebSocket端口
                const path = 'websockify'; // noVNC WebSocket路径

                const url = 'ws://' + host + ':' + port + '/' + path;

                console.log('连接到:', url);

                rfb = new RFB(document.getElementById('noVNC_screen'), url, {
                    credentials: {},
                    shared: true,
                    repeaterID: '',
                    wsProtocols: ['binary']
                });

                rfb.addEventListener('connect', () => {
                    console.log('VNC连接成功');
                    document.getElementById('noVNC_status').textContent = '已连接 - 会话: ${sessionId}';
                    document.getElementById('noVNC_status').style.background = 'rgba(0,150,0,0.8)';
                });

                rfb.addEventListener('disconnect', () => {
                    console.log('VNC连接断开');
                    document.getElementById('noVNC_status').textContent = '连接断开';
                    document.getElementById('noVNC_status').style.background = 'rgba(150,0,0,0.8)';
                });

                rfb.addEventListener('credentialsrequired', () => {
                    console.log('需要VNC凭证');
                    document.getElementById('noVNC_status').textContent = '需要凭证';
                    document.getElementById('noVNC_status').style.background = 'rgba(150,150,0,0.8)';
                });

                rfb.addEventListener('securityfailure', (e) => {
                    console.error('VNC安全错误:', e.detail);
                    document.getElementById('noVNC_status').textContent = '安全错误: ' + e.detail.reason;
                    document.getElementById('noVNC_status').style.background = 'rgba(150,0,0,0.8)';
                });
            }

            // 页面加载完成后连接
            window.addEventListener('load', () => {
                console.log('页面加载完成，开始连接VNC');
                connect();
            });

            // 页面卸载时断开连接
            window.addEventListener('beforeunload', () => {
                if (rfb) {
                    console.log('断开VNC连接');
                    rfb.disconnect();
                }
            });
        </script>
    </body>
    </html>
  `);
});

export default router;
