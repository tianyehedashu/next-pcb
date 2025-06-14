import { ChatwootDebugTool } from '@/components/ChatwootDebugTool';

export default function DebugChatwootPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Chatwoot X-Frame-Options 错误调试</h1>
        <p className="text-gray-600">
          深度分析 X-Frame-Options 错误的具体原因和解决方案
        </p>
      </div>
      
      <ChatwootDebugTool />
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">快速理解 X-Frame-Options 错误:</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>错误含义:</strong> 浏览器拒绝在 iframe 中显示 https://app.chatwoot.com/ 主页面</p>
          <p><strong>常见原因:</strong> 代码错误地尝试加载 Chatwoot 管理界面而不是 SDK</p>
          <p><strong>正确做法:</strong> 只加载 /packs/js/sdk.js 脚本，不要创建 iframe</p>
          <p><strong>判断标准:</strong> 如果聊天功能正常工作，这个错误可以忽略</p>
        </div>
      </div>
    </div>
  );
} 