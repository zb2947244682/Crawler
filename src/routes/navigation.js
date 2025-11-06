const express = require('express');
const { success, errors } = require('../utils/response');
const { isValidUrl, isValidScrollParams } = require('../utils/validation');
const config = require('../config');

const router = express.Router();

/**
 * @route POST /sessions/:sessionId/navigate
 * @desc 访问指定URL
 * @body {
 *   url: string,
 *   waitUntil?: 'load' | 'domcontentloaded' | 'networkidle',
 *   timeout?: number
 * }
 */
router.post('/:sessionId/navigate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { url, waitUntil = config.page.waitUntil, timeout = config.page.timeout } = req.body;

    if (!url) {
      return res.status(400).json(errors.INVALID_PARAMS('URL is required'));
    }

    if (!isValidUrl(url)) {
      return res.status(400).json(errors.INVALID_URL(url));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Navigating session ${sessionId} to ${url}`);

    const startTime = Date.now();

    await session.page.goto(url, {
      waitUntil,
      timeout,
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    const finalUrl = session.page.url();

    res.json(success({
      url: finalUrl,
      loadTime,
      waitUntil,
    }, 'Navigation completed successfully'));
  } catch (err) {
    console.error('Navigation error:', err);
    if (err.message.includes('timeout')) {
      return res.status(408).json(errors.OPERATION_TIMEOUT());
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/refresh
 * @desc 刷新当前页面
 * @body {
 *   waitUntil?: 'load' | 'domcontentloaded' | 'networkidle',
 *   timeout?: number
 * }
 */
router.post('/:sessionId/refresh', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { waitUntil = config.page.waitUntil, timeout = config.page.timeout } = req.body;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Refreshing session ${sessionId}`);

    const startTime = Date.now();

    await session.page.reload({
      waitUntil,
      timeout,
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    const currentUrl = session.page.url();

    res.json(success({
      url: currentUrl,
      loadTime,
      waitUntil,
    }, 'Page refreshed successfully'));
  } catch (err) {
    console.error('Refresh error:', err);
    if (err.message.includes('timeout')) {
      return res.status(408).json(errors.OPERATION_TIMEOUT());
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/scroll
 * @desc 滚动页面
 * @body {
 *   x?: number,           // 绝对位置X坐标
 *   y?: number,           // 绝对位置Y坐标
 *   deltaY?: number,      // 相对滚动量（正数向下，负数向上）
 *   selector?: string,    // 滚动到指定元素
 *   behavior?: 'auto' | 'smooth'  // 滚动行为
 * }
 */
router.post('/:sessionId/scroll', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { x, y, deltaY, selector, behavior = 'auto' } = req.body;

    if (!isValidScrollParams(req.body)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid scroll parameters'));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Scrolling session ${sessionId}`, { x, y, deltaY, selector, behavior });

    let result;

    if (selector) {
      // 滚动到指定元素
      await session.page.locator(selector).scrollIntoViewIfNeeded();
      result = { action: 'scrollToElement', selector };
    } else if (x !== undefined && y !== undefined) {
      // 滚动到绝对位置
      await session.page.evaluate(({ x, y }) => {
        window.scrollTo(x, y);
      }, { x, y });
      result = { action: 'scrollToPosition', x, y };
    } else if (deltaY !== undefined) {
      // 相对滚动
      await session.page.mouse.wheel(0, deltaY);
      result = { action: 'scrollRelative', deltaY };
    } else {
      // 默认滚动到顶部
      await session.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      result = { action: 'scrollToTop' };
    }

    // 可选：等待滚动完成
    if (behavior === 'smooth') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    res.json(success(result, 'Scroll completed successfully'));
  } catch (err) {
    console.error('Scroll error:', err);
    if (err.message.includes('not found') && req.body.selector) {
      return res.status(404).json(errors.SELECTOR_NOT_FOUND(req.body.selector));
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/scroll/top
 * @desc 滚动到页面顶部
 */
router.post('/:sessionId/scroll/top', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    await session.page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    res.json(success({ action: 'scrollToTop' }, 'Scrolled to top successfully'));
  } catch (err) {
    console.error('Scroll to top error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/scroll/bottom
 * @desc 滚动到页面底部
 */
router.post('/:sessionId/scroll/bottom', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    await session.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    res.json(success({ action: 'scrollToBottom' }, 'Scrolled to bottom successfully'));
  } catch (err) {
    console.error('Scroll to bottom error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route GET /sessions/:sessionId/url
 * @desc 获取当前页面URL
 */
router.get('/:sessionId/url', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    const currentUrl = session.page.url();

    res.json(success({ url: currentUrl }, 'Current URL retrieved successfully'));
  } catch (err) {
    console.error('Get URL error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

module.exports = router;
