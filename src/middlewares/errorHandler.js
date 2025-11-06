const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err);

  // 默认错误响应
  let errorResponse = error('INTERNAL_ERROR', 'Internal server error');

  // 处理已知的错误类型
  if (err.message) {
    if (err.message.includes('Session') && err.message.includes('not found')) {
      errorResponse = error('SESSION_NOT_FOUND', err.message, 404);
    } else if (err.message.includes('timeout')) {
      errorResponse = error('OPERATION_TIMEOUT', err.message, 408);
    } else if (err.message.includes('Invalid URL')) {
      errorResponse = error('INVALID_URL', err.message, 400);
    } else if (err.message.includes('Maximum concurrent sessions')) {
      errorResponse = error('MAX_SESSIONS_EXCEEDED', err.message, 429);
    } else if (err.message.includes('Browser') || err.message.includes('playwright')) {
      errorResponse = error('BROWSER_ERROR', err.message, 500);
    }
  }

  // 如果是自定义错误对象
  if (err.statusCode) {
    errorResponse.statusCode = err.statusCode;
  }

  res.status(errorResponse.statusCode).json(errorResponse);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  res.status(404).json(error('NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404));
}

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
};
