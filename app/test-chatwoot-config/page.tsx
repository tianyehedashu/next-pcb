import { ChatwootConfigFix } from '@/components/ChatwootConfigFix';

export default function TestChatwootConfigPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Chatwoot 配置诊断</h1>
        <p className="text-gray-600">
          诊断和修复 Chatwoot 配置问题，解决 X-Frame-Options 和脚本加载错误
        </p>
      </div>
      
      <ChatwootConfigFix />
    </div>
  );
} 