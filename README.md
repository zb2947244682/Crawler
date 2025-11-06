# 浏览器自动化爬虫服务

基于 Playwright 和 Express.js 的浏览器自动化爬虫 API 服务，支持会话管理、页面导航、内容捕获等功能。

## 功能特性

- ✅ **会话管理**：创建、删除和管理浏览器会话
- ✅ **页面导航**：访问URL、刷新页面、滚动操作
- ✅ **内容捕获**：截图、获取HTML、提取文本
- ✅ **Docker支持**：容器化部署
- ✅ **安全性**：API Key认证、可配置访问控制
- ✅ **性能优化**：会话超时清理、资源限制

## 快速开始

### 使用 Docker（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd crawler

# 构建并启动服务
docker-compose up --build

# 服务将在 http://localhost:3000 启动
```

### 本地开发

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install

# 启动服务
npm start

# 开发模式（带热重载）
npm run dev
```

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证**: 可选 API Key (`X-API-Key` 头或 `apiKey` 查询参数)
- **响应格式**: 统一的 JSON 格式

### 响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": 1234567890
}
```

### 会话管理

#### 创建会话
```http
POST /api/sessions
Content-Type: application/json

{
  "viewport": { "width": 1920, "height": 1080 },
  "userAgent": "Custom User Agent",
  "locale": "zh-CN"
}
```

#### 删除会话
```http
DELETE /api/sessions/{sessionId}
```

#### 获取会话列表
```http
GET /api/sessions
```

#### 获取会话统计
```http
GET /api/sessions/stats
```

### 页面导航

#### 访问URL
```http
POST /api/sessions/{sessionId}/navigate
Content-Type: application/json

{
  "url": "https://example.com",
  "waitUntil": "networkidle",
  "timeout": 30000
}
```

#### 刷新页面
```http
POST /api/sessions/{sessionId}/refresh
```

#### 滚动操作
```http
POST /api/sessions/{sessionId}/scroll
Content-Type: application/json

{
  "x": 0,
  "y": 1000,
  "behavior": "smooth"
}
```

### 内容捕获

#### 获取截图
```http
GET /api/sessions/{sessionId}/screenshot?fullPage=true&type=png&format=base64
```

#### 获取HTML
```http
GET /api/sessions/{sessionId}/html?selector=.content
```

#### 获取文本内容
```http
GET /api/sessions/{sessionId}/text?selector=h1
```

### 健康检查

```http
GET /api/sessions/health
```

## 配置选项

通过环境变量配置：

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PORT` | 3000 | 服务端口 |
| `MAX_SESSIONS` | 10 | 最大并发会话数 |
| `API_KEY` | - | API Key认证（可选） |
| `ALLOWED_DOMAINS` | - | 允许访问的域名列表 |
| `HEADLESS` | true | 是否无头模式 |
| `LOG_LEVEL` | info | 日志级别 |

## Docker 部署

### 生产环境

```bash
# 构建镜像
docker build -t crawler-service .

# 运行容器
docker run -p 3000:3000 --shm-size=2gb crawler-service
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 开发指南

### 项目结构

```
src/
├── server.js          # Express 服务入口
├── config.js          # 配置文件
├── managers/
│   └── SessionManager.js  # 会话管理器
├── routes/            # API 路由
│   ├── session.js
│   ├── navigation.js
│   └── capture.js
├── middlewares/       # 中间件
│   ├── errorHandler.js
│   └── auth.js
└── utils/             # 工具函数
    ├── response.js
    └── validation.js
```

### 添加新功能

1. 在 `routes/` 中添加新的路由文件
2. 在 `server.js` 中注册路由
3. 更新验证函数（如果需要）
4. 添加相应的中间件

### 测试

```bash
# 运行测试
npm test

# 运行特定测试
npm test -- --testNamePattern="session"
```

## 注意事项

- **内存使用**: 每个浏览器会话约占用 200-500MB 内存
- **共享内存**: Docker 容器需要至少 2GB 共享内存
- **超时管理**: 长时间未使用的会话会被自动清理
- **并发限制**: 默认最多支持 10 个并发会话
- **安全性**: 生产环境建议启用 API Key 认证

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
