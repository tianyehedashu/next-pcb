import { ChatwootProvider } from '@/app/components/ChatwootProvider';

function TestLocalChatwootContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          本地 Chatwoot SDK 测试
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ✅ 使用本地 SDK 的优势
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>完全避免 CORS 问题</strong> - SDK 文件从同域加载</li>
            <li><strong>更快的加载速度</strong> - 无需跨域网络请求</li>
            <li><strong>离线可用</strong> - 即使 Chatwoot 服务器暂时不可用，SDK 也能加载</li>
            <li><strong>更好的缓存控制</strong> - 可以控制 SDK 文件的缓存策略</li>
            <li><strong>减少外部依赖</strong> - 降低对外部服务的依赖</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 测试说明
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>SDK 文件已下载到 <code className="bg-gray-100 px-2 py-1 rounded">/public/chatwoot/sdk.js</code></li>
            <li>使用本地加载器 <code className="bg-gray-100 px-2 py-1 rounded">loadChatwootSdkLocal</code></li>
                         <li>查看浏览器控制台，应该看到 &ldquo;[Chatwoot Local]&rdquo; 前缀的日志</li>
            <li>右下角应该出现聊天按钮（如果配置正确）</li>
            <li>点击聊天按钮测试功能</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🔧 当前配置
          </h2>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono space-y-1">
            <div><strong>Base URL:</strong> {process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '未设置'}</div>
            <div><strong>Website Token:</strong> {process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN ? `${process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN.substring(0, 8)}...` : '未设置'}</div>
            <div><strong>SDK 路径:</strong> /chatwoot/sdk.js (本地文件)</div>
            <div><strong>加载方式:</strong> 本地加载器 (无 CORS 问题)</div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            🎉 解决方案总结
          </h2>
          <div className="space-y-3 text-green-700">
            <p>
              <strong>问题:</strong> 跨域请求 <code>http://www.leodennis.top:3000/packs/js/sdk.js</code> 被浏览器阻止
            </p>
            <p>
              <strong>解决:</strong> 将 SDK 文件下载到本地，从同域加载，完全避免 CORS 问题
            </p>
            <p>
              <strong>优势:</strong> 简单、可靠、无需服务器配置、性能更好
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">💡 维护建议</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
            <li>定期更新本地 SDK 文件以获取最新功能和修复</li>
            <li>可以创建自动化脚本定期从 Chatwoot 服务器下载最新 SDK</li>
            <li>在 CI/CD 流程中包含 SDK 更新检查</li>
            <li>监控 Chatwoot 版本更新，及时同步 SDK 文件</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TestLocalChatwootPage() {
  return (
    <ChatwootProvider>
      <TestLocalChatwootContent />
    </ChatwootProvider>
  );
} 