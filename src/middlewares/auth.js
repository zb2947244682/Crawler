const { error } = require('../utils/response');
const config = require('../config');

/**
 * API Key 认证中间件
 */
function apiKeyAuth(req, res, next) {
  // 如果未配置 API Key，则跳过认证
  if (!config.security.apiKey) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json(error('MISSING_API_KEY', 'API key is required', 401));
  }

  if (apiKey !== config.security.apiKey) {
    return res.status(403).json(error('INVALID_API_KEY', 'Invalid API key', 403));
  }

  next();
}

/**
 * 会话存在性验证中间件
 */
function validateSession(sessionManager) {
  return (req, res, next) => {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json(error('MISSING_SESSION_ID', 'Session ID is required', 400));
    }

    try {
      // 验证会话存在
      sessionManager.getSession(sessionId);
      next();
    } catch (err) {
      return res.status(404).json(error('SESSION_NOT_FOUND', err.message, 404));
    }
  };
}

module.exports = {
  apiKeyAuth,
  validateSession,
};
