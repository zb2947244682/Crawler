/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 * @param {Object} data - 响应数据
 * @param {string} message - 可选的消息
 * @returns {Object} 响应对象
 */
function success(data = null, message = '') {
  return {
    success: true,
    data,
    message,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * 错误响应
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP 状态码
 * @returns {Object} 响应对象
 */
function error(code, message, statusCode = 500) {
  return {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: Math.floor(Date.now() / 1000),
    statusCode,
  };
}

/**
 * 常见的错误响应
 */
const errors = {
  SESSION_NOT_FOUND: (sessionId) => error('SESSION_NOT_FOUND', `Session ${sessionId} not found`, 404),
  SESSION_TIMEOUT: () => error('SESSION_TIMEOUT', 'Session timeout', 408),
  INVALID_URL: (url) => error('INVALID_URL', `Invalid URL: ${url}`, 400),
  BROWSER_ERROR: (message) => error('BROWSER_ERROR', `Browser error: ${message}`, 500),
  INVALID_PARAMS: (message) => error('INVALID_PARAMS', `Invalid parameters: ${message}`, 400),
  SELECTOR_NOT_FOUND: (selector) => error('SELECTOR_NOT_FOUND', `Selector not found: ${selector}`, 404),
  OPERATION_TIMEOUT: () => error('OPERATION_TIMEOUT', 'Operation timeout', 408),
  MAX_SESSIONS_EXCEEDED: () => error('MAX_SESSIONS_EXCEEDED', 'Maximum concurrent sessions exceeded', 429),
};

module.exports = {
  success,
  error,
  errors,
};
