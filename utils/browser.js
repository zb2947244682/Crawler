import { chromium } from 'playwright';

const BROWSER_POOL = [];
const MAX_BROWSERS = 6; // 根据CPU核数调整
const BROWSER_TIMEOUT = 5 * 60 * 1000; // 5分钟超时

class BrowserInstance {
  constructor(browser, context, page, createdAt = Date.now()) {
    this.browser = browser;
    this.context = context;
    this.page = page;
    this.createdAt = createdAt;
    this.lastUsed = createdAt;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  updateLastUsed() {
    this.lastUsed = Date.now();
  }

  isExpired() {
    return Date.now() - this.createdAt > BROWSER_TIMEOUT;
  }
}

/**
 * 从浏览器池获取浏览器实例
 * @returns {Promise<BrowserInstance>}
 */
export async function getBrowser(options = {}) {
  const {
    userAgent,
    viewport = { width: 1920, height: 1080 },
    headless = true,
    proxy,
    extraHTTPHeaders = {}
  } = options;

  // 清理过期浏览器
  cleanupExpiredBrowsers();

  // 尝试从池中获取
  if (BROWSER_POOL.length > 0) {
    const instance = BROWSER_POOL.pop();
    instance.updateLastUsed();
    return instance;
  }

  // 创建新浏览器实例
  const browser = await chromium.launch({
    headless,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    proxy,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-features=ImproveInformer,TranslateUI,BlinkGenPropertyTrees',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport,
    userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    extraHTTPHeaders,
    ignoreHTTPSErrors: true,
    bypassCSP: true
  });

  const page = await context.newPage();

  // 手动实现基本的反检测功能
  await page.evaluateOnNewDocument(() => {
    // 移除webdriver属性
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // 修改navigator属性
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' }
      ]
    });

    // 修改语言
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en']
    });

    // 修改权限
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  const instance = new BrowserInstance(browser, context, page);
  return instance;
}

/**
 * 将浏览器实例放回池中
 * @param {BrowserInstance} instance
 */
export async function releaseBrowser(instance) {
  if (!instance || !instance.browser) return;

  try {
    // 重置页面状态
    await instance.page.goto('about:blank');

    // 清除cookies和localStorage（可选）
    // await instance.context.clearCookies();
    // await instance.page.evaluate(() => localStorage.clear());

    // 如果池未满，放回池中
    if (BROWSER_POOL.length < MAX_BROWSERS) {
      BROWSER_POOL.push(instance);
    } else {
      await instance.browser.close();
    }
  } catch (error) {
    console.error('释放浏览器实例时出错:', error);
    try {
      await instance.browser.close();
    } catch (e) {
      // 忽略关闭错误
    }
  }
}

/**
 * 清理过期浏览器
 */
function cleanupExpiredBrowsers() {
  const now = Date.now();
  const expired = BROWSER_POOL.filter(instance => instance.isExpired());

  BROWSER_POOL.splice(0, BROWSER_POOL.length,
    ...BROWSER_POOL.filter(instance => !instance.isExpired())
  );

  // 异步关闭过期浏览器
  expired.forEach(async (instance) => {
    try {
      await instance.browser.close();
    } catch (error) {
      console.error('清理过期浏览器时出错:', error);
    }
  });

  if (expired.length > 0) {
    console.log(`清理了 ${expired.length} 个过期浏览器实例`);
  }
}

/**
 * 获取浏览器池状态
 */
export function getPoolStats() {
  return {
    activeBrowsers: BROWSER_POOL.length,
    maxBrowsers: MAX_BROWSERS,
    browsers: BROWSER_POOL.map(instance => ({
      id: instance.id,
      createdAt: instance.createdAt,
      lastUsed: instance.lastUsed,
      age: Date.now() - instance.createdAt
    }))
  };
}

/**
 * 强制清理所有浏览器
 */
export async function cleanupAllBrowsers() {
  const browsers = [...BROWSER_POOL];
  BROWSER_POOL.length = 0;

  await Promise.all(browsers.map(async (instance) => {
    try {
      await instance.browser.close();
    } catch (error) {
      console.error('强制清理浏览器时出错:', error);
    }
  }));

  console.log(`强制清理了 ${browsers.length} 个浏览器实例`);
}

// 定期清理过期浏览器
setInterval(cleanupExpiredBrowsers, 60000); // 每分钟清理一次
