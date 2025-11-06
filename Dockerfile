# 基于Node.js 20 Alpine的Docker镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装Playwright系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    && rm -rf /var/cache/apk/*

# 设置Playwright环境变量
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 复制package.json并安装依赖
COPY package*.json ./
RUN npm install --production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制应用代码
COPY . .

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
