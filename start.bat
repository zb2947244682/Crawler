@echo off
chcp 65001 >nul
echo 🚀 启动爬虫API服务...

REM 检查Docker是否可用
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 使用Docker启动...

    REM 构建镜像
    echo 构建Docker镜像...
    docker build -t crawler-api .

    REM 检查构建是否成功
    if %errorlevel% neq 0 (
        echo ❌ Docker镜像构建失败
        pause
        exit /b 1
    )

    REM 停止可能存在的旧容器
    docker stop crawler-api >nul 2>&1
    docker rm crawler-api >nul 2>&1

    REM 运行容器
    echo 启动Docker容器...
    docker run -d ^
        --name crawler-api ^
        -p 3000:3000 ^
        --restart unless-stopped ^
        crawler-api

    if %errorlevel% equ 0 (
        echo ✅ 服务已启动!
        echo 🌐 访问地址: http://localhost:3000
        echo 📖 API文档: http://localhost:3000/
        echo 💚 健康检查: http://localhost:3000/health
        echo.
        echo 按任意键查看容器日志...
        pause >nul
        docker logs -f crawler-api
    ) else (
        echo ❌ Docker容器启动失败
        pause
        exit /b 1
    )

) else (
    echo 📦 使用本地Node.js启动...

    REM 检查node是否安装
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 未找到Node.js，请先安装Node.js
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    )

    REM 检查npm是否安装
    npm --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 未找到npm，请确保Node.js正确安装
        pause
        exit /b 1
    )

    REM 检查依赖
    if not exist "node_modules" (
        echo 安装项目依赖...
        npm install
        if %errorlevel% neq 0 (
            echo ❌ 依赖安装失败
            pause
            exit /b 1
        )
    ) else (
        echo 依赖已存在，跳过安装
    )

    REM 启动服务
    echo 启动API服务...
    npm start
)

pause
