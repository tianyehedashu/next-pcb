import { ChatwootIframeCleaner } from '@/components/ChatwootIframeCleaner';
import { QuickIframeCleanup } from '@/components/QuickIframeCleanup';

export default function CleanChatwootIframePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Chatwoot IFrame 清理工具</h1>
        <p className="text-gray-600">
          扫描并清理导致 X-Frame-Options 错误的问题 iframe
        </p>
      </div>
      
      <div className="space-y-8">
        <QuickIframeCleanup />
        <ChatwootIframeCleaner />
      </div>
      
      <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-800 mb-2">使用说明:</h3>
        <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
          <li>点击&ldquo;重新扫描&rdquo;查找所有 iframe</li>
          <li>查看哪些 iframe 被标记为&ldquo;有问题&rdquo;</li>
          <li>点击&ldquo;清理问题 IFrame&rdquo;删除有问题的 iframe</li>
          <li>如果问题持续，使用&ldquo;完全清理 Chatwoot&rdquo;</li>
          <li>最后使用&ldquo;清理并重新加载页面&rdquo;应用修复</li>
        </ol>
      </div>
    </div>
  );
} 