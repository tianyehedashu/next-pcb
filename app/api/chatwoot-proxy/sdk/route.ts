import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Chatwoot base URL not configured' },
      { status: 500 }
    );
  }

  try {
    // 代理请求到 Chatwoot 服务器
    const chatwootResponse = await fetch(`${baseUrl}/packs/js/sdk.js`, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Next.js Proxy',
      },
    });

    if (!chatwootResponse.ok) {
      return NextResponse.json(
        { error: `Chatwoot server responded with ${chatwootResponse.status}` },
        { status: chatwootResponse.status }
      );
    }

    const sdkContent = await chatwootResponse.text();

    // 返回 JavaScript 内容并设置正确的 CORS 头
    return new NextResponse(sdkContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    });
  } catch (error) {
    console.error('Chatwoot proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy Chatwoot SDK' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 