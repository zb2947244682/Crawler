# 🪟 Windows使用指南

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.0 或更高版本
- **npm**: 自动包含在Node.js中
- **PowerShell** 或 **命令提示符**

### 安装Node.js

如果还没有安装Node.js：

1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 **LTS版本** (推荐)
3. 双击安装程序，按默认设置安装
4. 验证安装：
   ```batch
   node --version
   npm --version
   ```

## 🛠️ 一键启动

### 方法1：使用批处理脚本（推荐）

1. **双击 `start.bat`** - 自动检测环境并启动服务
2. 脚本会：
   - 检查Docker环境
   - 如果有Docker：自动构建和运行容器
   - 如果没有Docker：安装依赖并启动Node.js服务

### 方法2：手动启动

```batch
# 1. 安装项目依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在新终端窗口运行测试
npm test
```

## 🧪 运行测试

### 使用批处理脚本
```batch
# 双击 test.bat 运行完整测试套件
test.bat
```

### 手动测试
```batch
npm test
```

测试内容包括：
- ✅ 健康检查
- ✅ 浏览器会话创建
- ✅ 页面导航
- ✅ HTML内容获取
- ✅ 页面截图
- ✅ 会话状态检查
- ✅ 会话清理

## 📡 API使用示例（Windows）

### PowerShell中使用

```powershell
# 创建会话
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/browser/create" -ContentType "application/json" -Body "{}"

# 导航页面
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/browser/{sessionId}/navigate" -ContentType "application/json" -Body '{"url": "https://httpbin.org/html"}'

# 获取HTML
Invoke-RestMethod -Uri "http://localhost:3000/api/browser/{sessionId}/html"

# 截图
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/browser/{sessionId}/screenshot" -ContentType "application/json" -Body '{"fullPage": true}'
```

### 命令提示符中使用

```batch
# 创建会话
curl -X POST http://localhost:3000/api/browser/create -H "Content-Type: application/json" -d "{}"

# 导航页面
curl -X POST http://localhost:3000/api/browser/{sessionId}/navigate -H "Content-Type: application/json" -d "{\"url\": \"https://httpbin.org/html\"}"

# 获取HTML
curl http://localhost:3000/api/browser/{sessionId}/html

# 截图
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot -H "Content-Type: application/json" -d "{\"fullPage\": true}"
```

## 🐳 Docker在Windows上

### 使用Docker Desktop

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 启动Docker Desktop
3. 双击 `start.bat` 会自动使用Docker

### Docker命令

```batch
# 构建镜像
docker build -t crawler-api .

# 运行容器
docker run -d -p 3000:3000 --name crawler-api crawler-api

# 查看日志
docker logs crawler-api

# 停止容器
docker stop crawler-api

# 删除容器
docker rm crawler-api
```

## 🔧 故障排除

### Node.js相关问题

```batch
# 检查Node.js版本
node --version

# 检查npm版本
npm --version

# 清除npm缓存
npm cache clean --force

# 重新安装依赖
rmdir /s /q node_modules
npm install
```

### Docker相关问题

```batch
# 检查Docker版本
docker --version

# 检查Docker是否运行
docker info

# 查看所有容器
docker ps -a

# 停止并删除所有相关容器
docker stop crawler-api
docker rm crawler-api
```

### 端口冲突

如果3000端口被占用：

```batch
# 检查端口使用情况
netstat -ano | findstr :3000

# 杀死占用进程 (PID替换为实际值)
taskkill /PID <PID> /F

# 或使用不同端口
set PORT=3001
npm start
```

### 权限问题

如果遇到权限错误：

```batch
# 以管理员身份运行命令提示符
# 右键点击开始菜单 -> "命令提示符(管理员)" 或 "Windows PowerShell(管理员)"
```

## 📁 项目文件说明

```
crawler-api/
├── start.bat          # 🚀 Windows一键启动脚本
├── test.bat           # 🧪 Windows测试脚本
├── server.js          # 🌐 主服务文件
├── routes/crawler.js  # 🔗 API路由定义
├── utils/browser.js   # 🏊‍♂️ 浏览器池管理
├── package.json       # 📦 Node.js依赖配置
├── README.md          # 📖 项目文档
└── docker-compose.yml # 🐳 Docker编排配置
```

## ⚡ 性能优化（Windows）

### 内存设置

```batch
# 设置Node.js内存限制
set NODE_OPTIONS=--max-old-space-size=4096
npm start
```

### 浏览器池配置

在 `utils/browser.js` 中调整：

```javascript
// 根据你的电脑配置调整
const MAX_BROWSERS = 4; // 减少数量节省内存
```

## 🔍 开发调试

### 查看实时日志

```batch
# 开发模式查看详细日志
npm run dev
```

### 浏览器开发者工具

启动服务后访问：`http://localhost:3000`

## 📞 获取帮助

遇到问题时：

1. **检查服务状态**: `http://localhost:3000/health`
2. **查看错误日志**: 在启动窗口查看错误信息
3. **验证环境**: 运行 `test.bat` 检查各项功能
4. **检查端口**: 确保3000端口未被占用

---

**🎯 提示**: 在Windows上开发时，推荐使用 `start.bat` 脚本，它会自动处理环境检测和依赖安装！
