# 📸 页面截图功能使用指南

## 🎯 为什么需要截图功能？

在爬虫开发中，仅仅获取HTML代码是不够的，因为：
- **动态内容**: JavaScript渲染的内容可能在HTML中不存在
- **视觉验证**: 确认页面实际显示的内容是否正确
- **调试辅助**: 快速查看页面加载状态和布局
- **反爬检测**: 验证是否触发了验证码或反爬措施

## 🚀 快速开始

### 1. 创建浏览器会话并导航到页面
```bash
# 创建会话
curl -X POST http://localhost:3000/api/browser/create \
  -H "Content-Type: application/json" \
  -d '{}'

# 导航到目标页面
curl -X POST http://localhost:3000/api/browser/abc-123-def/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaohongshu.com"}'
```

### 2. 截取页面截图
```bash
# 全页截图
curl -X POST http://localhost:3000/api/browser/abc-123-def/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true, "type": "png"}'
```

## 📖 API详细说明

### 接口地址
```
POST /api/browser/{sessionId}/screenshot
```

### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fullPage` | boolean | `true` | 是否截取全页（true）还是可见区域（false） |
| `type` | string | `"png"` | 图片格式：`"png"` 或 `"jpeg"` |
| `quality` | number | `80` | JPEG质量（1-100），仅在type为jpeg时有效 |
| `selector` | string | - | CSS选择器，指定要截取的元素，不传则截取整个页面 |

### 响应格式
```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64编码的图片数据
  "size": 12345  // 图片文件大小（字节）
}
```

## 💡 使用示例

### 1. 全页截图（推荐用于页面诊断）
```bash
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "fullPage": true,
    "type": "png"
  }'
```

### 2. 可见区域截图（适合快速预览）
```bash
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "fullPage": false,
    "type": "png"
  }'
```

### 3. 高质量JPEG截图
```bash
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "fullPage": true,
    "type": "jpeg",
    "quality": 95
  }'
```

### 4. 指定元素截图（精确截取）
```bash
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "selector": "#content",
    "type": "png"
  }'
```

### 5. 小红书内容区域截图
```bash
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "selector": ".content-container",
    "type": "png"
  }'
```

## 🔧 实际应用场景

### 场景1：验证页面加载状态
```bash
# 1. 导航到页面
curl -X POST http://localhost:3000/api/browser/{sessionId}/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaohongshu.com"}'

# 2. 等待关键元素加载
curl -X POST http://localhost:3000/api/browser/{sessionId}/wait \
  -H "Content-Type: application/json" \
  -d '{"selector": ".main-content"}'

# 3. 截图确认页面状态
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}'
```

### 场景2：检测反爬虫措施
```bash
# 设置复杂的headers和cookies后
# 截图查看是否出现验证码或其他反爬措施
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": false}'
```

### 场景3：前后对比截图
```bash
# 操作前截图
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}' > before.json

# 执行某些操作（点击、滚动等）
curl -X POST http://localhost:3000/api/browser/{sessionId}/click \
  -H "Content-Type: application/json" \
  -d '{"selector": "#load-more"}'

# 操作后截图
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}' > after.json
```

## 💻 如何查看截图

### 方法1：浏览器直接查看
将返回的`screenshot`字段值复制到浏览器地址栏：
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### 方法2：保存为文件
```bash
# 保存截图到文件
curl -X POST http://localhost:3000/api/browser/{sessionId}/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}' \
  | jq -r '.screenshot' \
  | base64 -d > screenshot.png
```

### 方法3：Python处理
```python
import requests
import base64

response = requests.post('http://localhost:3000/api/browser/{sessionId}/screenshot',
                        json={'fullPage': True})
data = response.json()

# 保存图片
with open('screenshot.png', 'wb') as f:
    f.write(base64.b64decode(data['screenshot']))
```

## ⚡ 性能优化建议

1. **选择合适的分辨率**: 全页截图可能很大，考虑只截取需要的区域
2. **使用合适质量**: PNG无损但大，JPEG有损但小
3. **缓存截图**: 避免频繁截图，影响性能
4. **异步处理**: 截图是同步操作，考虑在需要时才调用

## 🔍 故障排除

### 截图失败
- 检查页面是否已正确加载
- 确认sessionId是否有效
- 查看服务器日志中的错误信息

### 截图为空或不完整
- 页面可能还在加载中，尝试添加等待时间
- 检查CSS选择器是否正确
- 确认元素是否在可视区域内

### 图片质量问题
- 调整quality参数（仅JPEG）
- 检查是否设置了正确的viewport

## 📊 技术规格

- **最大截图大小**: 无限制（取决于内存）
- **支持格式**: PNG, JPEG
- **返回格式**: Base64编码
- **并发限制**: 受浏览器池大小限制
- **超时时间**: 30秒（可配置）

---

**🎯 记住：截图是验证爬虫效果的最佳工具！** 在开发过程中多使用截图功能，可以快速发现和解决问题。
