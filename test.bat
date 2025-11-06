@echo off
chcp 65001 >nul
echo 🧪 开始测试爬虫API...

REM 检查node是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 运行测试脚本
echo 运行API测试...
node test.js

if %errorlevel% equ 0 (
    echo ✅ 所有测试通过！
) else (
    echo ❌ 测试失败！
)

echo.
pause
