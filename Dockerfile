# 使用 Playwright 官方镜像作为基础镜像
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN groupadd -r crawler && useradd -r -g crawler crawler

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production

# 复制应用代码
COPY src/ ./src/

# 更改文件所有权
RUN chown -R crawler:crawler /app
USER crawler

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 3000, path: '/api/sessions/health', method: 'POST'}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => process.exit(1)); req.end()"

# 启动应用
CMD ["node", "src/server.js"]
