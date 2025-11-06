#!/bin/bash

# Playwright Crawler API 启动脚本

set -e

echo "🚀 启动 Playwright Crawler API..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建截图目录
mkdir -p screenshots

# 停止可能存在的旧容器
echo "🛑 停止旧容器..."
docker-compose down || true

# 构建并启动服务
echo "🏗️ 构建镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务健康状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📖 API 文档: http://localhost:8000"
    echo "🔧 Swagger UI: http://localhost:8000/docs"
    echo "📊 ReDoc: http://localhost:8000/redoc"
    echo ""
    echo "🛑 停止服务: docker-compose down"
    echo "📋 查看日志: docker-compose logs -f"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose logs
    exit 1
fi
