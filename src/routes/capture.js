const express = require('express');
const { success, errors } = require('../utils/response');
const { isValidSelector, isValidScreenshotParams } = require('../utils/validation');
const config = require('../config');

const router = express.Router();

/**
 * @route POST /sessions/:sessionId/screenshot
 * @desc 获取页面截图
 * @body {
 *   fullPage?: boolean,    // 是否截取整个页面
 *   quality?: number,      // JPEG质量 (1-100)
 *   type?: 'png' | 'jpeg', // 图片格式
 *   format?: 'base64' | 'binary'  // 返回格式
 * }
 */
router.post('/:sessionId/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      fullPage = true,
      quality = config.page.screenshotQuality,
      type = 'png',
      format = 'base64'
    } = req.body;

    const params = { fullPage: fullPage === 'true', quality: parseInt(quality), type };
    if (!isValidScreenshotParams(params)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid screenshot parameters'));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Taking screenshot for session ${sessionId}`, params);

    const startTime = Date.now();

    const screenshotOptions = {
      fullPage: params.fullPage,
      type: params.type,
    };

    if (params.type === 'jpeg') {
      screenshotOptions.quality = params.quality;
    }

    const buffer = await session.page.screenshot(screenshotOptions);

    const endTime = Date.now();
    const captureTime = endTime - startTime;

    if (format === 'base64') {
      // 返回Base64编码
      const base64 = buffer.toString('base64');
      res.json(success({
        image: base64,
        format: params.type,
        size: buffer.length,
        captureTime,
        fullPage: params.fullPage,
      }, 'Screenshot captured successfully'));
    } else {
      // 返回二进制数据
      res.setHeader('Content-Type', `image/${params.type}`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Capture-Time', captureTime.toString());
      res.send(buffer);
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/html
 * @desc 获取页面HTML代码
 * @body {
 *   selector?: string,     // CSS选择器（可选，不传则返回整页）
 *   waitForSelector?: boolean,  // 是否等待选择器出现
 *   innerHtml?: boolean    // 是否只返回innerHTML
 * }
 */
router.post('/:sessionId/html', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      selector,
      waitForSelector = false,
      innerHtml = false
    } = req.body;

    if (selector && !isValidSelector(selector)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid CSS selector'));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Getting HTML for session ${sessionId}`, { selector, waitForSelector, innerHtml });

    let html;

    if (selector) {
      // 等待选择器出现（如果需要）
      if (waitForSelector === 'true') {
        await session.page.waitForSelector(selector, { timeout: config.page.timeout });
      }

      // 获取单个元素或多个元素的HTML
      if (innerHtml === 'true') {
        html = await session.page.$eval(selector, el => el.innerHTML);
      } else {
        html = await session.page.$eval(selector, el => el.outerHTML);
      }
    } else {
      // 获取整个页面的HTML
      html = await session.page.content();
    }

    res.json(success({
      html,
      selector: selector || null,
      length: html.length,
      timestamp: Math.floor(Date.now() / 1000),
    }, 'HTML retrieved successfully'));
  } catch (err) {
    console.error('Get HTML error:', err);
    if (err.message.includes('not found') && req.query.selector) {
      return res.status(404).json(errors.SELECTOR_NOT_FOUND(req.query.selector));
    }
    if (err.message.includes('timeout')) {
      return res.status(408).json(errors.OPERATION_TIMEOUT());
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/html/multiple
 * @desc 获取多个元素的HTML代码
 * @body {
 *   selector: string,      // CSS选择器（必需）
 *   waitForSelector?: boolean,  // 是否等待选择器出现
 *   innerHtml?: boolean    // 是否只返回innerHTML
 * }
 */
router.post('/:sessionId/html/multiple', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      selector,
      waitForSelector = false,
      innerHtml = false
    } = req.body;

    if (!selector) {
      return res.status(400).json(errors.INVALID_PARAMS('Selector is required for multiple elements'));
    }

    if (!isValidSelector(selector)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid CSS selector'));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Getting multiple HTML for session ${sessionId}`, { selector, waitForSelector, innerHtml });

    // 等待选择器出现（如果需要）
    if (waitForSelector === 'true') {
      await session.page.waitForSelector(selector, { timeout: config.page.timeout });
    }

    // 获取多个元素的HTML
    const elements = await session.page.$$eval(selector, (els, innerHtml) => {
      return els.map((el, index) => ({
        index,
        html: innerHtml === 'true' ? el.innerHTML : el.outerHTML,
      }));
    }, innerHtml);

    res.json(success({
      elements,
      selector,
      count: elements.length,
      timestamp: Math.floor(Date.now() / 1000),
    }, 'Multiple HTML elements retrieved successfully'));
  } catch (err) {
    console.error('Get multiple HTML error:', err);
    if (err.message.includes('timeout')) {
      return res.status(408).json(errors.OPERATION_TIMEOUT());
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/:sessionId/text
 * @desc 获取页面文本内容
 * @body {
 *   selector?: string,     // CSS选择器（可选）
 *   waitForSelector?: boolean  // 是否等待选择器出现
 * }
 */
router.post('/:sessionId/text', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selector, waitForSelector = false } = req.body;

    if (selector && !isValidSelector(selector)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid CSS selector'));
    }

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Getting text for session ${sessionId}`, { selector, waitForSelector });

    let text;

    if (selector) {
      // 等待选择器出现（如果需要）
      if (waitForSelector === 'true') {
        await session.page.waitForSelector(selector, { timeout: config.page.timeout });
      }

      text = await session.page.$eval(selector, el => el.textContent.trim());
    } else {
      // 获取整个页面的文本内容
      text = await session.page.evaluate(() => {
        return document.body.textContent.trim();
      });
    }

    res.json(success({
      text,
      selector: selector || null,
      length: text.length,
      timestamp: Math.floor(Date.now() / 1000),
    }, 'Text content retrieved successfully'));
  } catch (err) {
    console.error('Get text error:', err);
    if (err.message.includes('not found') && req.query.selector) {
      return res.status(404).json(errors.SELECTOR_NOT_FOUND(req.query.selector));
    }
    if (err.message.includes('timeout')) {
      return res.status(408).json(errors.OPERATION_TIMEOUT());
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route GET /sessions/:sessionId/snapshot
 * @desc 快速截图 - 直接在浏览器中显示图片
 */
router.get('/:sessionId/snapshot', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Taking quick snapshot for session ${sessionId}`);

    const startTime = Date.now();

    // 使用默认配置快速截图：全页PNG
    const screenshotOptions = {
      fullPage: true,
      type: 'png',
    };

    const buffer = await session.page.screenshot(screenshotOptions);

    const endTime = Date.now();
    const captureTime = endTime - startTime;

    // 设置响应头，让浏览器直接显示图片
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Capture-Time', captureTime.toString());
    res.setHeader('Cache-Control', 'no-cache');

    res.send(buffer);
  } catch (err) {
    console.error('Quick snapshot error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route GET /sessions/:sessionId/htmlsource
 * @desc 快速源码输出 - 自动下载HTML文件
 */
router.get('/:sessionId/htmlsource', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionManager = req.app.locals.sessionManager;
    const session = sessionManager.getSession(sessionId);

    console.log(`Getting HTML source for session ${sessionId}`);

    // 获取整个页面的HTML内容
    const html = await session.page.content();

    // 获取页面标题作为文件名
    const title = await session.page.title();
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;

    // 设置响应头，让浏览器自动下载HTML文件
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(html);
  } catch (err) {
    console.error('HTML source error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

module.exports = router;
