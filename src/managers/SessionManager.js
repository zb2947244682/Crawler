const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * 会话管理器
 * 负责管理所有浏览器会话的创建、存储和清理
 */
class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> sessionData
    this.browserInstances = new Map(); // 用于复用浏览器实例（可选）

    // 启动定时清理任务
    this.startCleanupTask();

    console.log('SessionManager initialized');
  }

  /**
   * 创建新会话
   * @param {Object} options - 会话选项
   * @returns {Object} 会话信息
   */
  async createSession(options = {}) {
    try {
      // 检查并发会话数限制
      if (this.sessions.size >= config.session.maxConcurrentSessions) {
        throw new Error(`Maximum concurrent sessions (${config.session.maxConcurrentSessions}) exceeded`);
      }

      const sessionId = uuidv4();

      // 合并默认配置和用户选项
      const browserOptions = {
        headless: config.browser.headless,
        args: config.browser.args,
        ...options.browserOptions,
      };

      const contextOptions = {
        viewport: config.browser.defaultViewport,
        userAgent: options.userAgent,
        locale: options.locale,
        timezoneId: options.timezone,
        geolocation: options.geolocation,
        permissions: options.permissions,
        ...options.contextOptions,
      };

      // 如果支持自定义视口
      if (options.viewport) {
        contextOptions.viewport = {
          width: Math.max(320, Math.min(3840, options.viewport.width || 1920)),
          height: Math.max(240, Math.min(8000, options.viewport.height || 1080)),
        };
      }

      console.log(`Creating session ${sessionId} with viewport:`, contextOptions.viewport);

      // 启动浏览器（这里可以实现连接池复用）
      const browser = await chromium.launch(browserOptions);
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      const sessionData = {
        sessionId,
        browser,
        context,
        page,
        viewport: contextOptions.viewport,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        metadata: options.metadata || {},
      };

      this.sessions.set(sessionId, sessionData);

      console.log(`Session ${sessionId} created successfully`);

      return {
        sessionId,
        viewport: contextOptions.viewport,
        createdAt: sessionData.createdAt,
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  /**
   * 获取会话
   * @param {string} sessionId - 会话ID
   * @returns {Object} 会话数据
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 更新最后访问时间
    session.lastAccessedAt = new Date();

    return session;
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @param {boolean} force - 是否强制删除
   */
  async deleteSession(sessionId, force = false) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      console.log(`Deleting session ${sessionId}`);

      // 关闭资源（按照正确的顺序）
      try {
        await session.page.close();
      } catch (e) {
        console.warn(`Failed to close page for session ${sessionId}:`, e.message);
      }

      try {
        await session.context.close();
      } catch (e) {
        console.warn(`Failed to close context for session ${sessionId}:`, e.message);
      }

      try {
        await session.browser.close();
      } catch (e) {
        console.warn(`Failed to close browser for session ${sessionId}:`, e.message);
      }

      this.sessions.delete(sessionId);

      console.log(`Session ${sessionId} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      if (!force) {
        throw error;
      }
    }
  }

  /**
   * 获取所有会话信息
   * @returns {Array} 会话列表
   */
  getAllSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.sessions) {
      sessions.push({
        sessionId,
        viewport: session.viewport,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        metadata: session.metadata,
      });
    }
    return sessions;
  }

  /**
   * 获取会话统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const now = new Date();
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => (now - session.lastAccessedAt) < config.session.timeout
    ).length;

    return {
      totalSessions,
      activeSessions,
      maxConcurrentSessions: config.session.maxConcurrentSessions,
    };
  }

  /**
   * 启动定时清理任务
   */
  startCleanupTask() {
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, config.session.cleanupInterval);
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions) {
      const timeSinceLastAccess = now - session.lastAccessedAt;
      if (timeSinceLastAccess > config.session.timeout) {
        expiredSessions.push(sessionId);
      }
    }

    console.log(`Found ${expiredSessions.length} expired sessions to clean up`);

    for (const sessionId of expiredSessions) {
      try {
        await this.deleteSession(sessionId, true);
      } catch (error) {
        console.error(`Failed to cleanup session ${sessionId}:`, error);
      }
    }
  }

  /**
   * 关闭所有会话（用于服务关闭时）
   */
  async closeAllSessions() {
    console.log('Closing all sessions...');

    const promises = [];
    for (const sessionId of this.sessions.keys()) {
      promises.push(this.deleteSession(sessionId, true));
    }

    await Promise.allSettled(promises);
    console.log('All sessions closed');
  }
}

module.exports = SessionManager;
