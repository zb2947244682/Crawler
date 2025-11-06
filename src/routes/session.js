const express = require('express');
const { success, errors } = require('../utils/response');
const { isValidViewport } = require('../utils/validation');

const router = express.Router();

/**
 * @route POST /sessions
 * @desc 创建新会话
 * @body {
 *   viewport?: { width: number, height: number },
 *   userAgent?: string,
 *   locale?: string,
 *   timezone?: string,
 *   geolocation?: { latitude: number, longitude: number },
 *   permissions?: string[],
 *   headless?: boolean
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      viewport,
      userAgent,
      locale,
      timezone,
      geolocation,
      permissions,
      headless,
      metadata,
    } = req.body;

    // 验证视口参数
    if (viewport && !isValidViewport(viewport)) {
      return res.status(400).json(errors.INVALID_PARAMS('Invalid viewport dimensions'));
    }

    const sessionManager = req.app.locals.sessionManager;

    const options = {
      viewport,
      userAgent,
      locale,
      timezone,
      geolocation,
      permissions,
      metadata,
      browserOptions: {
        headless: headless !== undefined ? headless : undefined,
      },
    };

    const session = await sessionManager.createSession(options);

    res.json(success(session, 'Session created successfully'));
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route DELETE /sessions/:sessionId
 * @desc 删除会话
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { force } = req.query;

    const sessionManager = req.app.locals.sessionManager;

    await sessionManager.deleteSession(sessionId, force === 'true');

    res.json(success(null, 'Session deleted successfully'));
  } catch (err) {
    console.error('Delete session error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json(errors.SESSION_NOT_FOUND(req.params.sessionId));
    }
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/list
 * @desc 获取所有会话列表
 */
router.post('/list', (req, res) => {
  try {
    const sessionManager = req.app.locals.sessionManager;
    const sessions = sessionManager.getAllSessions();

    res.json(success({ sessions }, 'Sessions retrieved successfully'));
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/stats
 * @desc 获取会话统计信息
 */
router.post('/stats', (req, res) => {
  try {
    const sessionManager = req.app.locals.sessionManager;
    const stats = sessionManager.getStats();

    res.json(success(stats, 'Session stats retrieved successfully'));
  } catch (err) {
    console.error('Get session stats error:', err);
    res.status(500).json(errors.BROWSER_ERROR(err.message));
  }
});

/**
 * @route POST /sessions/health
 * @desc 健康检查
 */
router.post('/health', (req, res) => {
  const sessionManager = req.app.locals.sessionManager;
  const stats = sessionManager.getStats();

  // 检查服务是否正常
  const isHealthy = stats.totalSessions <= stats.maxConcurrentSessions;

  if (isHealthy) {
    res.json(success({
      status: 'healthy',
      ...stats,
      timestamp: Math.floor(Date.now() / 1000),
    }));
  } else {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNHEALTHY',
        message: 'Service is unhealthy',
      },
      data: stats,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
});

module.exports = router;
