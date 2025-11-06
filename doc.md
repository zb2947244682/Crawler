# 浏览器自动化爬虫服务 API 文档

## 概述

这是一个基于 Playwright 和 Express.js 的浏览器自动化爬虫服务，提供完整的浏览器会话管理和页面操作功能。所有接口都使用 POST 方法，支持各种编程语言调用。

## 基本信息

- **Base URL**: `http://localhost:3000/api`
- **认证**: 可选 API Key (通过 `X-API-Key` 请求头或 `API_KEY` 环境变量)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **超时时间**: 默认 30 秒

## 参数说明约定

- **必需参数**: 标记为"（必需）"，必须在请求中提供
- **可选参数**: 标记为"（可选）"，有默认值，可以不提供
- **默认值**: 明确标注每个可选参数的默认值
- **使用建议**: 一般情况下，只需传入必需参数或空对象 `{}` 即可使用默认配置

### 快速开始示例

```bash
# 1. 创建会话（使用默认配置）
curl -X POST http://localhost:3000/api/sessions -H "Content-Type: application/json" -d '{}'

# 2. 访问页面（只需URL）
curl -X POST http://localhost:3000/api/sessions/{sessionId}/navigate \
  -H "Content-Type: application/json" -d '{"url": "https://example.com"}'

# 3. 截图（使用默认配置）
curl -X POST http://localhost:3000/api/sessions/{sessionId}/screenshot \
  -H "Content-Type: application/json" -d '{}'

# 4. 获取HTML（使用默认配置）
curl -X POST http://localhost:3000/api/sessions/{sessionId}/html \
  -H "Content-Type: application/json" -d '{}'
```

## 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": true,           // 请求是否成功
  "data": { ... },          // 响应数据
  "message": "操作成功",     // 响应消息
  "timestamp": 1234567890   // 响应时间戳
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",        // 错误代码
    "message": "错误描述"        // 错误详细信息
  },
  "timestamp": 1234567890
}
```

## 1. 会话管理 API

### 1.1 创建会话

创建新的浏览器会话，每个会话包含独立的浏览器实例、上下文和页面。

**接口**: `POST /sessions`

**请求体参数**:

```json
{
  "viewport": {         // 可选，默认使用系统配置
    "width": 1920,      // 浏览器视口宽度，默认 1920
    "height": 1080      // 浏览器视口高度，默认 1080
  },
  "userAgent": "...",   // 可选，默认使用系统配置
  "locale": "zh-CN",    // 可选，默认 "zh-CN"
  "timezone": "Asia/Shanghai",  // 可选，默认 "Asia/Shanghai"
  "geolocation": {      // 可选，无默认值
    "latitude": 39.9042,   // 纬度
    "longitude": 116.4074  // 经度
  },
  "permissions": ["geolocation"],  // 可选，无默认值
  "headless": true,     // 可选，默认 true
  "metadata": {}        // 可选，无默认值
}
```

**参数说明**:
- `viewport`: 可选参数，默认使用系统配置的视口大小
- `userAgent`: 可选参数，默认使用系统配置的User-Agent
- `locale`: 可选参数，默认 "zh-CN"
- `timezone`: 可选参数，默认 "Asia/Shanghai"
- `geolocation`: 可选参数，无默认值，需要地理位置服务时才传入
- `permissions`: 可选参数，无默认值，需要特殊权限时才传入
- `headless`: 可选参数，默认 true（无头模式）
- `metadata`: 可选参数，自定义数据存储，无默认值

**默认使用场景**: 一般情况下，只需传入空对象 `{}` 即可使用系统默认配置。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "sessionId": "abc123-def456-ghi789",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "createdAt": "2025-01-06T13:45:30.123Z"
  },
  "message": "Session created successfully",
  "timestamp": 1736171130
}
```

**使用示例**:

```bash
# 创建基础会话
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}'

# 创建自定义配置的会话
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "viewport": {"width": 1366, "height": 768},
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "locale": "zh-CN",
    "timezone": "Asia/Shanghai"
  }'
```

### 1.2 删除会话

删除指定的浏览器会话，释放所有相关资源。

**接口**: `DELETE /sessions/:sessionId`

**URL参数**:
- `sessionId`: 会话ID（必需）

**查询参数**:
- `force`: 是否强制删除（可选），值为 `"true"` 时会忽略错误强制删除，默认 false

**参数说明**:
- `sessionId`: 创建会话时返回的唯一标识符（必需参数）
- `force`: 强制删除选项，当会话处于异常状态时使用（可选参数，默认 false）

**响应示例**:

```json
{
  "success": true,
  "data": null,
  "message": "Session deleted successfully",
  "timestamp": 1736171190
}
```

**使用示例**:

```bash
# 正常删除会话
curl -X DELETE http://localhost:3000/api/sessions/abc123-def456-ghi789

# 强制删除会话
curl -X DELETE "http://localhost:3000/api/sessions/abc123-def456-ghi789?force=true"
```

### 1.3 获取会话列表

获取所有当前活动会话的详细信息。

**接口**: `POST /sessions/list`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "abc123-def456-ghi789",
        "viewport": {
          "width": 1920,
          "height": 1080
        },
        "createdAt": "2025-01-06T13:45:30.123Z",
        "lastAccessedAt": "2025-01-06T13:46:15.456Z",
        "metadata": {
          "userId": "123"
        }
      }
    ]
  },
  "message": "Sessions retrieved successfully",
  "timestamp": 1736171175
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/list
```

### 1.4 获取会话统计

获取当前会话系统的统计信息。

**接口**: `POST /sessions/stats`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "totalSessions": 2,      // 总会话数
    "activeSessions": 2,     // 活跃会话数
    "maxConcurrentSessions": 20  // 最大并发会话数
  },
  "message": "Session stats retrieved successfully",
  "timestamp": 1736171180
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/stats
```

### 1.5 健康检查

检查服务是否正常运行。

**接口**: `POST /sessions/health`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "totalSessions": 1,
    "activeSessions": 1,
    "maxConcurrentSessions": 20,
    "timestamp": 1736171185
  },
  "timestamp": 1736171185
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/health
```

## 2. 页面导航 API

### 2.1 访问URL

导航到指定的URL地址。

**接口**: `POST /sessions/:sessionId/navigate`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "url": "https://example.com",     // 要访问的URL（必需）
  "waitUntil": "networkidle",       // 等待策略（可选），默认 "networkidle"
  "timeout": 30000                  // 超时时间（毫秒，可选），默认 30000
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `url`: 要导航的完整URL，必须是有效的HTTP或HTTPS链接（必需参数）
- `waitUntil`: 页面加载等待策略（可选参数，默认 "networkidle"）
  - `"load"`: 等待页面完全加载
  - `"domcontentloaded"`: 等待DOM内容加载完成
  - `"networkidle"`: 等待网络请求基本完成（推荐）
- `timeout`: 最大等待时间，超过此时间会返回超时错误（可选参数，默认 30000ms）

**默认使用场景**: 一般情况下，只需传入 `{"url": "https://example.com"}` 即可。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "url": "https://www.xiaohongshu.com/login",
    "loadTime": 1221,       // 页面加载耗时（毫秒）
    "waitUntil": "networkidle"
  },
  "message": "Navigation completed successfully",
  "timestamp": 1736171200
}
```

**使用示例**:

```bash
# 访问小红书登录页面
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/navigate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.xiaohongshu.com/login",
    "waitUntil": "networkidle",
    "timeout": 30000
  }'
```

### 2.2 刷新页面

刷新当前页面。

**接口**: `POST /sessions/:sessionId/refresh`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "waitUntil": "networkidle",  // 等待策略（可选），默认 "networkidle"
  "timeout": 30000             // 超时时间（毫秒，可选），默认 30000
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `waitUntil`: 页面加载等待策略（可选参数，默认 "networkidle"），同导航API
- `timeout`: 最大等待时间（可选参数，默认 30000ms），同导航API

**默认使用场景**: 一般情况下传入空对象 `{}` 即可使用默认配置。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "url": "https://www.xiaohongshu.com/login",
    "loadTime": 850,
    "waitUntil": "networkidle"
  },
  "message": "Page refreshed successfully",
  "timestamp": 1736171210
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2.3 滚动页面

控制页面的滚动行为。

**接口**: `POST /sessions/:sessionId/scroll`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "x": 0,           // 滚动到绝对X坐标（可选）
  "y": 1000,        // 滚动到绝对Y坐标（可选）
  "deltaY": 500,    // 相对滚动距离，正数向下，负数向上（可选）
  "selector": ".content",  // 滚动到指定元素的选择器（可选）
  "behavior": "auto"       // 滚动行为（可选），默认 "auto"
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `x`: 水平滚动位置（像素，可选参数）
- `y`: 垂直滚动位置（像素，可选参数）
- `deltaY`: 相对垂直滚动距离，正数向下滚动，负数向上滚动（可选参数）
- `selector`: CSS选择器，滚动到指定元素位置（可选参数）
- `behavior`: 滚动动画效果（可选参数，默认 "auto"）
  - `"auto"`: 瞬间滚动
  - `"smooth"`: 平滑滚动

**注意**: 以上参数只需提供一种滚动方式即可（x/y、deltaY、或selector）

**默认使用场景**: 传入 `{"deltaY": 500}` 向下滚动500像素，或传入 `{"selector": ".target"}` 滚动到指定元素。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "action": "scrollToPosition",
    "x": 0,
    "y": 1000
  },
  "message": "Scroll completed successfully",
  "timestamp": 1736171220
}
```

**使用示例**:

```bash
# 滚动到指定位置
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/scroll \
  -H "Content-Type: application/json" \
  -d '{"x": 0, "y": 1000}'

# 相对滚动
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/scroll \
  -H "Content-Type: application/json" \
  -d '{"deltaY": 500}'

# 滚动到元素
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/scroll \
  -H "Content-Type: application/json" \
  -d '{"selector": ".content", "behavior": "smooth"}'
```

### 2.4 滚动到顶部

快速滚动到页面顶部。

**接口**: `POST /sessions/:sessionId/scroll/top`

**URL参数**:
- `sessionId`: 会话ID（必需）

**响应示例**:

```json
{
  "success": true,
  "data": {
    "action": "scrollToTop"
  },
  "message": "Scrolled to top successfully",
  "timestamp": 1736171230
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/scroll/top
```

### 2.5 滚动到底部

快速滚动到页面底部。

**接口**: `POST /sessions/:sessionId/scroll/bottom`

**URL参数**:
- `sessionId`: 会话ID（必需）

**响应示例**:

```json
{
  "success": true,
  "data": {
    "action": "scrollToBottom"
  },
  "message": "Scrolled to bottom successfully",
  "timestamp": 1736171240
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/scroll/bottom
```

### 2.6 获取当前URL

获取当前页面的URL地址。

**接口**: `POST /sessions/:sessionId/url`

**URL参数**:
- `sessionId`: 会话ID（必需）

**响应示例**:

```json
{
  "success": true,
  "data": {
    "url": "https://www.xiaohongshu.com/login"
  },
  "message": "Current URL retrieved successfully",
  "timestamp": 1736171250
}
```

**使用示例**:

```bash
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/url
```

## 3. 内容捕获 API

### 3.1 获取页面截图

捕获当前页面的屏幕截图。

**接口**: `POST /sessions/:sessionId/screenshot`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "fullPage": true,     // 是否截取整个页面（可选），默认 true
  "quality": 80,        // JPEG质量 (1-100，可选)，仅对JPEG格式有效，默认 80
  "type": "png",        // 图片格式（可选），默认 "png"
  "format": "base64"    // 返回格式（可选），默认 "base64"
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `fullPage`: 是否截取整个页面的完整内容，包括滚动区域（可选参数，默认 true）
- `quality`: JPEG图片质量，1-100之间的整数，仅在type为"jpeg"时有效（可选参数，默认 80）
- `type`: 图片格式，"png"为无损压缩，"jpeg"为有损压缩但文件更小（可选参数，默认 "png"）
- `format`: 返回格式，"base64"返回JSON中的字符串，"binary"直接返回图片数据（可选参数，默认 "base64"）

**默认使用场景**: 一般情况下传入空对象 `{}` 即可获取全页PNG截图的base64编码。

**响应示例** (base64格式):

```json
{
  "success": true,
  "data": {
    "image": "iVBORw0KGgoAAAANSUhEUgAA...",
    "format": "png",
    "size": 68786,
    "captureTime": 245,
    "fullPage": true
  },
  "message": "Screenshot captured successfully",
  "timestamp": 1736171260
}
```

**使用示例**:

```bash
# 获取全页PNG截图（base64格式）
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true, "type": "png", "format": "base64"}'

# 获取可见区域JPEG截图（二进制格式）
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": false, "type": "jpeg", "quality": 90, "format": "binary"}' \
  --output screenshot.jpg
```

### 3.2 获取HTML内容

获取页面或指定元素的HTML代码。

**接口**: `POST /sessions/:sessionId/html`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "selector": ".content",     // CSS选择器（可选），不传则返回整个页面HTML
  "waitForSelector": false,   // 是否等待选择器出现（可选），默认 false
  "innerHtml": false          // 是否只返回innerHTML（可选），默认 false
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `selector`: CSS选择器，用于选择特定的HTML元素（可选参数，不传则返回整个页面HTML）
- `waitForSelector`: 是否等待指定选择器对应的元素出现后再获取HTML（可选参数，默认 false）
- `innerHtml`: 控制返回HTML的范围，false返回包含标签的完整HTML，true只返回标签内部内容（可选参数，默认 false）

**默认使用场景**: 一般情况下传入空对象 `{}` 即可获取整个页面的HTML内容。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "html": "<div class=\"content\"><h1>标题</h1><p>内容</p></div>",
    "selector": ".content",
    "length": 58,
    "timestamp": 1736171270
  },
  "message": "HTML retrieved successfully",
  "timestamp": 1736171270
}
```

**使用示例**:

```bash
# 获取整个页面HTML
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/html \
  -H "Content-Type: application/json" \
  -d '{}'

# 获取指定元素HTML
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/html \
  -H "Content-Type: application/json" \
  -d '{"selector": ".login-container", "innerHtml": true}'
```

### 3.3 获取多个元素HTML

获取页面中匹配选择器的所有元素的HTML内容。

**接口**: `POST /sessions/:sessionId/html/multiple`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "selector": "img",          // CSS选择器（必需）
  "waitForSelector": false,   // 是否等待选择器出现，默认 false
  "innerHtml": false          // 是否只返回innerHTML，默认 false
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `selector`: CSS选择器，用于选择特定的HTML元素（必需参数）
- `waitForSelector`: 是否等待指定选择器对应的元素出现后再获取HTML（可选参数，默认 false）
- `innerHtml`: 控制返回HTML的范围，false返回包含标签的完整HTML，true只返回标签内部内容（可选参数，默认 false）

**默认使用场景**: 一般情况下只需传入 `{"selector": "img"}` 即可获取所有图片元素的完整HTML。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "index": 0,
        "html": "<img src=\"/image1.jpg\" alt=\"图片1\">"
      },
      {
        "index": 1,
        "html": "<img src=\"/image2.jpg\" alt=\"图片2\">"
      }
    ],
    "selector": "img",
    "count": 2,
    "timestamp": 1736171280
  },
  "message": "Multiple HTML elements retrieved successfully",
  "timestamp": 1736171280
}
```

**使用示例**:

```bash
# 获取页面中所有的图片元素
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/html/multiple \
  -H "Content-Type: application/json" \
  -d '{"selector": "img"}'

# 获取所有链接元素
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/html/multiple \
  -H "Content-Type: application/json" \
  -d '{"selector": "a", "innerHtml": true}'
```

## 4. 快速访问接口 (GET方法)

为了方便快速查看页面状态，我们提供了两个GET接口，无需POST请求，直接在浏览器中访问即可。

### 4.1 快速截图

**接口**: `GET /sessions/:sessionId/snapshot`

**功能**: 直接在浏览器中显示当前页面的截图，无需下载。

**URL参数**:
- `sessionId`: 会话ID（必需）

**响应**: 直接返回PNG图片的二进制数据，浏览器会自动显示图片。

**使用方法**:
1. 在浏览器中访问: `http://localhost:3000/api/sessions/{sessionId}/snapshot`
2. 页面会直接显示当前会话的截图
3. 支持刷新获取最新截图

**示例**:
```bash
# 在浏览器中直接访问查看截图
http://localhost:3000/api/sessions/abc123-def456-ghi789/snapshot
```

### 4.2 快速源码下载

**接口**: `GET /sessions/:sessionId/htmlsource`

**功能**: 自动下载当前页面的HTML源码文件。

**URL参数**:
- `sessionId`: 会话ID（必需）

**响应**: 返回HTML文件的二进制数据，浏览器会自动下载。

**文件名**: 使用页面标题自动生成，格式为 `{页面标题}_{时间戳}.html`，特殊字符会被替换为下划线，标题长度限制为50个字符。

**使用方法**:
1. 在浏览器中访问: `http://localhost:3000/api/sessions/{sessionId}/htmlsource`
2. 浏览器会自动下载HTML文件
3. 文件名基于页面标题自动生成

**示例**:
```bash
# 在浏览器中访问自动下载HTML源码
http://localhost:3000/api/sessions/abc123-def456-ghi789/htmlsource
```

### 4.3 快速访问接口的特点

- **无需POST请求**: 直接GET访问，方便在浏览器中快速查看
- **零配置**: 无需传递任何参数，使用默认配置
- **实时响应**: 获取当前页面的实时状态
- **浏览器友好**: 充分利用浏览器的原生功能（显示图片、下载文件）

**适用场景**:
- 快速检查页面加载状态
- 调试爬虫抓取结果
- 临时查看页面截图
- 下载页面源码进行分析

## 5. 获取文本内容

**接口**: `POST /sessions/:sessionId/text`

**URL参数**:
- `sessionId`: 会话ID（必需）

**请求体参数**:

```json
{
  "selector": ".article-content",  // CSS选择器（可选），不传则获取整个页面文本
  "waitForSelector": false         // 是否等待选择器出现（可选），默认 false
}
```

**参数说明**:
- `sessionId`: 会话ID（必需参数）
- `selector`: CSS选择器，选择特定的元素获取其文本内容（可选参数，不传则获取整个页面文本）
- `waitForSelector`: 是否等待元素出现后再提取文本（可选参数，默认 false）

**默认使用场景**: 一般情况下传入空对象 `{}` 即可获取整个页面的文本内容。

**响应示例**:

```json
{
  "success": true,
  "data": {
    "text": "这是文章的内容文本，包含了所有可见的文字内容。",
    "selector": ".article-content",
    "length": 45,
    "timestamp": 1736171290
  },
  "message": "Text content retrieved successfully",
  "timestamp": 1736171290
}
```

**使用示例**:

```bash
# 获取整个页面文本
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/text \
  -H "Content-Type: application/json" \
  -d '{}'

# 获取指定元素的文本
curl -X POST http://localhost:3000/api/sessions/abc123-def456-ghi789/text \
  -H "Content-Type: application/json" \
  -d '{"selector": "h1"}'
```

## 错误处理

### 常见错误代码

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| `SESSION_NOT_FOUND` | 404 | 会话不存在 |
| `INVALID_PARAMS` | 400 | 参数无效 |
| `INVALID_URL` | 400 | URL格式无效 |
| `INVALID_PARAMS` | 400 | CSS选择器无效 |
| `SELECTOR_NOT_FOUND` | 404 | 元素未找到 |
| `OPERATION_TIMEOUT` | 408 | 操作超时 |
| `BROWSER_ERROR` | 500 | 浏览器内部错误 |
| `MAX_SESSIONS_EXCEEDED` | 429 | 超过最大会话数限制 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session abc123-def456-ghi789 not found"
  },
  "timestamp": 1736171300
}
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|-------|--------|------|
| `PORT` | 3000 | 服务端口 |
| `HOST` | 0.0.0.0 | 服务绑定地址 |
| `MAX_SESSIONS` | 20 | 最大并发会话数 |
| `API_KEY` | - | API认证密钥 |
| `ALLOWED_DOMAINS` | - | 允许访问的域名列表 |
| `HEADLESS` | true | 是否使用无头模式 |

### 会话配置

- **会话超时**: 30分钟无操作自动清理
- **最大并发**: 默认20个会话
- **清理间隔**: 每5分钟检查一次过期会话

### 浏览器配置

- **默认User-Agent**: Edge浏览器标识
- **默认语言**: zh-CN
- **默认时区**: Asia/Shanghai
- **默认视口**: 1920x1080

## 使用建议

### 1. 会话管理
- 及时删除不需要的会话以释放资源
- 避免创建过多并发会话

### 2. 页面操作
- 使用适当的 `waitUntil` 策略确保页面加载完成
- 对于动态内容，考虑使用 `waitForSelector`

### 3. 选择器使用
- 优先使用稳定的CSS选择器（如ID、类名）
- 避免使用复杂的XPath表达式
- 对于动态生成的元素，考虑使用 `waitForSelector`

### 4. 性能优化
- 合理设置超时时间
- 对于大页面截图，考虑分块截图

## 完整使用流程示例

```bash
#!/bin/bash

# 1. 创建会话
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"viewport": {"width": 1920, "height": 1080}}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.sessionId')
echo "会话创建成功: $SESSION_ID"

# 2. 访问页面
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/navigate" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaohongshu.com/login"}'

# 3. 获取截图
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}' \
  --output screenshot.png

# 4. 获取页面内容
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/html" \
  -H "Content-Type: application/json" \
  -d '{"selector": ".qrcode-img"}'

# 5. 清理会话
curl -X DELETE "http://localhost:3000/api/sessions/$SESSION_ID"
```
