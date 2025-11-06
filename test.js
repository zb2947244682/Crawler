// test.js - 简单的API测试脚本
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 开始测试爬虫API...\n');

  try {
    // 测试1: 健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ 健康检查:', health.status);

    // 测试2: 创建浏览器会话
    console.log('\n2️⃣ 创建浏览器会话...');
    const createRes = await fetch(`${BASE_URL}/api/browser/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const createData = await createRes.json();
    console.log('✅ 会话创建:', createData);

    if (!createData.success) {
      throw new Error('创建会话失败');
    }

    const sessionId = createData.sessionId;

    // 测试3: 导航到页面
    console.log('\n3️⃣ 导航到测试页面...');
    const navigateRes = await fetch(`${BASE_URL}/api/browser/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://httpbin.org/html',
        waitUntil: 'domcontentloaded'
      })
    });
    const navigateData = await navigateRes.json();
    console.log('✅ 页面导航:', navigateData.url);

    // 测试4: 获取HTML内容
    console.log('\n4️⃣ 获取HTML内容...');
    const htmlRes = await fetch(`${BASE_URL}/api/browser/${sessionId}/html`);
    const htmlData = await htmlRes.json();
    console.log('✅ HTML长度:', htmlData.html.length, '字符');

    // 测试5: 截取页面截图
    console.log('\n5️⃣ 截取页面截图...');
    const screenshotRes = await fetch(`${BASE_URL}/api/browser/${sessionId}/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullPage: true, type: 'png' })
    });
    const screenshotData = await screenshotRes.json();
    console.log('✅ 截图大小:', screenshotData.size, 'bytes');

    // 测试6: 获取会话状态
    console.log('\n6️⃣ 获取会话状态...');
    const statusRes = await fetch(`${BASE_URL}/api/browser/${sessionId}/status`);
    const statusData = await statusRes.json();
    console.log('✅ 会话状态:', statusData.session.id);

    // 测试7: 关闭会话
    console.log('\n7️⃣ 关闭浏览器会话...');
    const closeRes = await fetch(`${BASE_URL}/api/browser/${sessionId}/close`, {
      method: 'POST'
    });
    const closeData = await closeRes.json();
    console.log('✅ 会话关闭:', closeData.message);

    console.log('\n🎉 所有测试通过！API工作正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 只有当直接运行此文件时才执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}

export { testAPI };
