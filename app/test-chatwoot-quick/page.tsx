import { ChatwootQuickFix } from '@/components/ChatwootQuickFix';

export default function TestChatwootQuickPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Chatwoot 快速修复</h1>
        <p className="text-gray-600">
          快速诊断和解决 Chatwoot X-Frame-Options 和配置问题
        </p>
      </div>
      
      <ChatwootQuickFix />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          访问 <code>/test-chatwoot-quick</code> 来使用这个工具
        </p>
      </div>
    </div>
  );
} 