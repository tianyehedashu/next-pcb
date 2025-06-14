import { NextResponse } from 'next/server';

// Chatwoot SDK 的真实源地址
const CHATWOOT_SDK_URL = 'https://app.chatwoot.com/packs/js/sdk.js';

export async function GET() {
  try {
    // 在服务器端 fetch 真实的 SDK 文件
    console.log(`🔵 [Proxy] Fetching Chatwoot SDK from: ${CHATWOOT_SDK_URL}`);
    const response = await fetch(CHATWOOT_SDK_URL, {
      cache: 'force-cache', // 可以在这里设置缓存策略以提高性能
    });

    // 检查响应是否成功
    if (!response.ok) {
      console.error(`🔴 [Proxy] Failed to fetch SDK. Status: ${response.status}`);
      return new NextResponse('Failed to fetch Chatwoot SDK', { status: response.status });
    }

    // 获取脚本内容
    const scriptContent = await response.text();
    console.log(`🟢 [Proxy] Successfully fetched SDK. Size: ${scriptContent.length} bytes.`);

    // 创建一个新的响应，将脚本内容返回给客户端
    // 确保设置正确的 Content-Type，这样浏览器才能把它当作 JavaScript 执行
    const headers = new Headers({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, immutable', // 让浏览器缓存一小时
    });

    return new NextResponse(scriptContent, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('🔴 [Proxy] Internal server error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Next.js App Router 的配置
export const dynamic = 'force-dynamic'; 