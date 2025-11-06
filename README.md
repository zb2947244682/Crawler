# 🚀 爬虫API服务

基于Node.js + Playwright的现代化爬虫API服务，支持浏览器自动化、页面渲染、数据抓取等功能。

## ⚡ Windows快速开始

```batch
# 1. 确保已安装Node.js (https://nodejs.org/)
# 2. 双击 start.bat 一键启动服务
start.bat

# 3. 在浏览器访问: http://localhost:3000
# 4. 运行测试: 双击 test.bat
```

## ✨ 特性

- 🖥️ **浏览器自动化**: 基于Playwright，支持Chrome/Chromium
- 🔄 **会话管理**: 支持多浏览器会话并发处理
- 🍪 **Cookie管理**: 完整的Cookie设置和获取功能
- 📋 **Header控制**: 自定义HTTP请求头
- 📸 **截图功能**: 支持全页或元素截图
- 🎯 **元素操作**: 点击、等待、滚动等交互
- 🐳 **Docker部署**: 开箱即用的容器化部署
- 🔒 **反检测**: 集成stealth插件，绕过基本反爬检测

## 🏗️ 架构

```
crawler-api/
├── server.js          # 主服务入口
├── routes/
│   └── crawler.js     # 爬虫API路由
├── utils/
│   └── browser.js     # 浏览器池管理
├── Dockerfile         # Docker构建配置
├── docker-compose.yml # 容器编排
└── test.js           # API测试脚本
```

## 🚀 快速开始

### 使用Docker（推荐）

```bash
# 1. 构建镜像
docker build -t crawler-api .

# 2. 运行容器
docker run -d -p 3000:3000 --name crawler-api crawler-api

# 或使用docker-compose
docker-compose up -d
```

### 本地开发（Windows）

```batch
# 1. 安装依赖
npm install

# 2. 启动服务
npm run dev

# 3. 运行测试
npm test
```

**快速启动脚本：**
```batch
# 双击运行 start.bat 即可一键启动服务
start.bat

# 或运行测试
test.bat
```

## 📖 API文档

服务启动后访问 `http://localhost:3000` 查看完整的API文档和使用示例。

### 核心API接口

#### 1. 创建浏览器会话
```http
POST /api/browser/create
```

**请求体:**
```json
{
  "userAgent": "自定义User-Agent",
  "viewport": {"width": 1920, "height": 1080},
  "headless": true,
  "proxy": {"server": "http://proxy:8080"},
  "extraHTTPHeaders": {"X-Custom": "value"}
}
```

**响应:**
```json
{
  "success": true,
  "sessionId": "abc-123-def"
}
```

#### 2. 导航到页面
```http
POST /api/browser/{sessionId}/navigate
```

**请求体:**
```json
{
  "url": "https://example.com",
  "waitUntil": "domcontentloaded",
  "timeout": 30000
}
```

#### 3. 获取HTML内容
```http
GET /api/browser/{sessionId}/html
```

**响应:**
```json
{
  "success": true,
  "html": "<html>...</html>",
  "url": "https://example.com"
}
```

#### 4. 设置Cookies
```http
POST /api/browser/{sessionId}/cookies/set
```

**请求体:**
```json
{
  "cookies": [
    {
      "name": "token",
      "value": "abc123",
      "domain": "example.com",
      "path": "/",
      "expires": -1
    }
  ]
}
```

#### 5. 页面滚动
```http
POST /api/browser/{sessionId}/scroll
```

**请求体:**
```json
{
  "scrollToBottom": true
}
// 或
{
  "x": 0,
  "y": 1000,
  "behavior": "smooth"
}
// 或滚动到指定元素
{
  "selector": "#target-element"
}
```

#### 6. 截取页面截图
```http
POST /api/browser/{sessionId}/screenshot
```

**请求体:**
```json
{
  "fullPage": true,
  "type": "png",
  "quality": 80
}
```

**响应:**
```json
{
  "success": true,
  "screenshot": "base64编码的图片数据",
  "size": 12345
}
```

## 🧪 测试

运行内置测试脚本：

```bash
npm test
```

或手动测试：

```bash
# 创建会话
curl -X POST http://localhost:3000/api/browser/create \
  -H "Content-Type: application/json" \
  -d '{}'

# 导航页面
curl -X POST http://localhost:3000/api/browser/{sessionId}/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/html"}'

# 获取HTML
curl http://localhost:3000/api/browser/{sessionId}/html

# 截取页面截图
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true, "type": "png"}'

# 关闭会话
curl -X POST http://localhost:3000/api/browser/{sessionId}/close
```

## ⚙️ 配置

### 环境变量

- `PORT`: 服务端口（默认3000）
- `NODE_ENV`: 运行环境（development/production）
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: Chromium可执行文件路径

### 浏览器池配置

在 `utils/browser.js` 中可以调整：

- `MAX_BROWSERS`: 最大浏览器实例数
- `BROWSER_TIMEOUT`: 浏览器实例超时时间

## 🔧 高级用法

### 代理设置

```json
{
  "proxy": {
    "server": "http://proxy.example.com:8080",
    "username": "user",
    "password": "pass"
  }
}
```

### 自定义JavaScript执行

通过导航接口的扩展参数可以执行自定义JS：

```json
{
  "url": "https://example.com",
  "jsScript": "document.title = 'Modified Title';"
}
```

### 等待策略

```json
{
  "waitUntil": "networkidle",  // 网络空闲
  "waitForSelector": "#content", // 等待元素
  "timeout": 30000
}
```

## 🐳 Docker部署

### 生产环境配置

```bash
# 使用docker-compose部署
docker-compose up -d

# 查看日志
docker-compose logs -f crawler-api

# 扩容实例
docker-compose up -d --scale crawler-api=3
```

### 资源限制

```yaml
services:
  crawler-api:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'
```

## 🔒 安全注意事项

1. **会话管理**: 及时关闭不需要的浏览器会话
2. **资源限制**: 设置合理的内存和CPU限制
3. **访问控制**: 在生产环境中添加API认证
4. **日志监控**: 监控API使用情况和错误日志

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如果遇到问题，请：

1. 查看服务日志：`docker-compose logs crawler-api`
2. 检查健康状态：`GET /health`
3. 查看活跃会话：`GET /api/sessions`
