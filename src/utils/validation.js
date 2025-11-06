/**
 * 输入验证工具
 */

/**
 * 验证 URL
 * @param {string} url - 要验证的URL
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  if (url.length > 2048) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证 CSS 选择器
 * @param {string} selector - CSS选择器
 * @returns {boolean} 是否有效
 */
function isValidSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  // 基本的CSS选择器验证（可以根据需要扩展）
  const invalidChars = /[<>{}[\]\\]/;
  return !invalidChars.test(selector) && selector.length > 0 && selector.length < 1000;
}

/**
 * 验证视口尺寸
 * @param {Object} viewport - 视口配置
 * @returns {boolean} 是否有效
 */
function isValidViewport(viewport) {
  if (!viewport || typeof viewport !== 'object') {
    return false;
  }

  const { width, height } = viewport;

  if (typeof width !== 'number' || typeof height !== 'number') {
    return false;
  }

  // 合理范围检查
  return width >= 320 && width <= 3840 && height >= 240 && height <= 8000;
}

/**
 * 验证会话ID
 * @param {string} sessionId - 会话ID
 * @returns {boolean} 是否有效
 */
function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }

  // UUID v4 格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * 验证滚动参数
 * @param {Object} params - 滚动参数
 * @returns {boolean} 是否有效
 */
function isValidScrollParams(params) {
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { x, y, deltaY, selector, behavior } = params;

  // 检查坐标参数
  if (x !== undefined && (typeof x !== 'number' || x < 0)) {
    return false;
  }
  if (y !== undefined && (typeof y !== 'number' || y < 0)) {
    return false;
  }

  // 检查相对滚动参数
  if (deltaY !== undefined && typeof deltaY !== 'number') {
    return false;
  }

  // 检查行为参数
  if (behavior !== undefined && !['auto', 'smooth'].includes(behavior)) {
    return false;
  }

  // 检查选择器
  if (selector !== undefined && !isValidSelector(selector)) {
    return false;
  }

  return true;
}

/**
 * 验证截图参数
 * @param {Object} params - 截图参数
 * @returns {boolean} 是否有效
 */
function isValidScreenshotParams(params) {
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { quality, type, fullPage } = params;

  // 检查质量参数
  if (quality !== undefined && (typeof quality !== 'number' || quality < 1 || quality > 100)) {
    return false;
  }

  // 检查类型参数
  if (type !== undefined && !['png', 'jpeg'].includes(type)) {
    return false;
  }

  // 检查全页参数
  if (fullPage !== undefined && typeof fullPage !== 'boolean') {
    return false;
  }

  return true;
}

module.exports = {
  isValidUrl,
  isValidSelector,
  isValidViewport,
  isValidSessionId,
  isValidScrollParams,
  isValidScreenshotParams,
};
