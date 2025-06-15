import { ChatwootCORSFix } from '@/components/ChatwootCORSFix';

export default function ChatwootCORSFixPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Chatwoot CORS 问题修复
        </h1>
        
        <div className="mb-6">
          <ChatwootCORSFix />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            问题说明
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              您遇到的错误 <code className="bg-gray-100 px-2 py-1 rounded">http://www.leodennis.top:3000/packs/js/sdk.js</code> 
              是一个典型的跨域资源共享（CORS）问题。
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">错误原因:</h3>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                <li>浏览器的同源策略阻止了跨域请求</li>
                <li>Chatwoot 服务器未配置正确的 CORS 头</li>
                <li>引荐来源网址政策 (Referrer Policy) 限制</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">解决方案:</h3>
              <ol className="list-decimal list-inside space-y-2 text-green-700">
                <li><strong>服务器端配置:</strong> 在 Chatwoot 服务器添加 CORS 头</li>
                <li><strong>使用 HTTPS:</strong> 部署到 HTTPS 域名以避免混合内容问题</li>
                <li><strong>代理方式:</strong> 通过您的后端代理 Chatwoot 请求</li>
                <li><strong>Nginx 配置:</strong> 在反向代理中添加 CORS 支持</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 