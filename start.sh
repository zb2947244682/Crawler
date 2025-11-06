#!/bin/bash

echo "🚀 启动爬虫API服务..."

# 检查Docker是否可用
if command -v docker &> /dev/null; then
    echo "🐳 使用Docker启动..."

    # 构建镜像
    docker build -t crawler-api .

    # 运行容器
    docker run -d \
        --name crawler-api \
        -p 3000:3000 \
        --restart unless-stopped \
        crawler-api

    echo "✅ 服务已启动!"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📖 API文档: http://localhost:3000/"
    echo "💚 健康检查: http://localhost:3000/health"

else
    echo "📦 使用本地Node.js启动..."

    # 检查依赖
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # 启动服务
    npm start
fi
