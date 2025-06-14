import { ChatwootEnvValidator } from '@/app/components/ChatwootEnvValidator';

export default function UltimateChatwootDebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Chatwoot 终极诊断</h1>
        <p className="text-gray-600">
          测试环境变量加载与网络穿透，找到问题的最终根源。
        </p>
      </div>
      
      <ChatwootEnvValidator />

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">如何解读诊断结果:</h3>
        <ul className="text-sm text-yellow-700 space-y-2 list-disc list-inside">
          <li>
            <strong>环境变量检查:</strong> 如果这里显示"未设置"，说明你的 <code>.env.local</code> 文件有问题或者需要重启开发服务器。
          </li>
          <li>
            <strong>最终脚本 URL:</strong> 这是根据你的环境变量构建的最终脚本地址。检查它是否看起来正确。
          </li>
          <li>
            <strong>网络穿透测试:</strong> 这是最关键的一步。
            <ul className="list-disc list-inside pl-4 mt-1">
              <li>如果状态是 <strong>failed</strong> 且 HTTP 状态码是 <strong>404</strong>，说明 URL 地址错误或 Chatwoot 实例有问题。</li>
              <li>如果状态是 <strong>failed</strong> 且**没有** HTTP 状态码，说明你的网络（防火墙/DNS）阻止了这次连接。</li>
              <li>如果状态是 <strong>success</strong>，说明网络和环境都正常，问题可能异常复杂。</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
} 