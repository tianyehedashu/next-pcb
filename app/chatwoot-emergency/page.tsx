import { ChatwootEmergencyFix } from '@/components/ChatwootEmergencyFix';

export default function ChatwootEmergencyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            🚨 Chatwoot 紧急修复
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            检测到 Chatwoot 加载错误（404）和无法关闭的问题。使用下面的工具进行紧急修复。
          </p>
        </div>

        <ChatwootEmergencyFix />

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">立即解决方案</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-red-600">🔥 紧急关闭聊天窗口</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="space-y-1">
                    <div>// 在浏览器控制台运行:</div>
                    <div>document.querySelectorAll('[class*="chatwoot"], [id*="chatwoot"], .woot-widget-holder, .woot-widget-bubble').forEach(el =&gt; el.remove());</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-blue-600">🔧 检查配置</h3>
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <div className="space-y-2">
                    <p><strong>1. 检查环境变量:</strong></p>
                    <p>NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN</p>
                    <p>NEXT_PUBLIC_CHATWOOT_BASE_URL</p>
                    <p><strong>2. 确认服务器可访问</strong></p>
                    <p><strong>3. 验证 Website Token 有效性</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 重要提示</h4>
              <p className="text-sm text-yellow-700">
                404 错误通常表示 Chatwoot 脚本无法加载。这可能是由于网络问题、配置错误或 Chatwoot 服务器不可访问导致的。
                X-Frame-Options 错误是正常的安全限制，不会影响聊天功能。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 