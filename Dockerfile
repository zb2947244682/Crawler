# 基于Node.js 20 Alpine的Docker镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装Playwright系统依赖和VNC服务器，以及中文字体
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    supervisor \
    fluxbox \
    font-noto-cjk \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# 设置Playwright环境变量
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 设置Chrome在Docker中运行的环境变量
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/bin/chromium-browser

# 复制package.json并安装依赖
COPY package*.json ./
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 复制supervisor配置文件
COPY supervisord.conf /etc/supervisord.conf

# 暴露端口 (API + VNC Web界面)
EXPOSE 3000 8080

# 启动supervisor管理所有服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
