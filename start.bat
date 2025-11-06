@echo off
REM Playwright Crawler API Windows 启动脚本

echo 🚀 启动 Playwright Crawler API...

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装，请先安装 Docker
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose 未安装，请先安装 Docker Compose
        pause
        exit /b 1
    )
)

REM 创建截图目录
if not exist screenshots mkdir screenshots

REM 停止可能存在的旧容器
echo 🛑 停止旧容器...
docker-compose down >nul 2>&1

REM 构建并启动服务
echo 🏗️ 构建镜像...
docker-compose build

echo 🚀 启动服务...
docker-compose up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务健康状态
echo 🔍 检查服务状态...
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 服务启动成功！
    echo.
    echo 📖 API 文档: http://localhost:8000
    echo 🔧 Swagger UI: http://localhost:8000/docs
    echo 📊 ReDoc: http://localhost:8000/redoc
    echo.
    echo 🛑 停止服务: docker-compose down
    echo 📋 查看日志: docker-compose logs -f
) else (
    echo ❌ 服务启动失败，请检查日志
    docker-compose logs
    pause
    exit /b 1
)

pause
