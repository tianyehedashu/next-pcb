import { ChatwootProvider } from '@/app/components/ChatwootProvider';
import { ChatwootUserSyncer } from '@/app/components/ChatwootUserSyncer';
import { ChatwootDebugInfo } from '@/app/components/ChatwootDebugInfo';

function TestConversationHistoryContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          对话历史功能测试
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 测试步骤
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-600">
            <li>
              <strong>第一步：</strong> 确保您已登录系统（如果未登录，请先登录）
            </li>
            <li>
              <strong>第二步：</strong> 点击右下角的聊天按钮，发送一条测试消息
              <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                💡 建议发送：&ldquo;这是我的第一条测试消息，用于验证对话历史功能&rdquo;
              </div>
            </li>
            <li>
              <strong>第三步：</strong> 关闭聊天窗口，然后重新打开
            </li>
            <li>
              <strong>第四步：</strong> 检查之前的消息是否还在
            </li>
            <li>
              <strong>第五步：</strong> 发送第二条消息，验证对话连续性
            </li>
            <li>
              <strong>第六步：</strong> 刷新页面，再次打开聊天窗口，确认所有消息都保留
            </li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🔍 技术原理
          </h2>
          <div className="space-y-4 text-gray-600">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">对话历史连续性实现</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>用户标识：</strong> 使用 <code className="bg-gray-200 px-1 rounded">user.id</code> 作为唯一标识符</li>
                <li><strong>自动关联：</strong> Chatwoot 自动将相同 identifier 的对话关联</li>
                <li><strong>跨设备同步：</strong> 同一用户在不同设备上登录，对话历史保持一致</li>
                <li><strong>匿名转换：</strong> 匿名对话在用户登录后自动合并</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✅ 预期行为</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li>登录用户的所有对话历史都会保留</li>
                <li>刷新页面后对话历史依然存在</li>
                <li>客服可以看到用户的完整对话记录</li>
                <li>用户信息（姓名、邮箱等）正确显示</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🛠️ 调试信息
          </h2>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono space-y-1">
            <div><strong>SDK 加载方式:</strong> 本地文件 (/chatwoot/sdk.js)</div>
            <div><strong>用户同步组件:</strong> ChatwootUserSyncer</div>
            <div><strong>标识符来源:</strong> 用户数据库 ID</div>
            <div><strong>对话存储:</strong> Chatwoot 服务器</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            ⚠️ 故障排查
          </h2>
          <div className="space-y-3 text-yellow-700">
            <div>
              <strong>如果对话历史丢失：</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>检查浏览器控制台是否有 &ldquo;[ChatwootUserSyncer]&rdquo; 相关日志</li>
                <li>确认用户已正确登录且 user.id 存在</li>
                <li>验证 Chatwoot 服务器连接正常</li>
                <li>检查是否有 JavaScript 错误阻止了用户同步</li>
              </ul>
            </div>
            
            <div>
              <strong>如果聊天按钮不出现：</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>检查环境变量配置是否正确</li>
                <li>确认本地 SDK 文件是否存在</li>
                <li>查看网络请求是否有错误</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 调试信息组件 */}
        <div className="mb-6">
          <ChatwootDebugInfo />
        </div>

        {/* 隐藏的用户同步组件 */}
        <ChatwootUserSyncer />
      </div>
    </div>
  );
}

export default function TestConversationHistoryPage() {
  return (
    <ChatwootProvider>
      <TestConversationHistoryContent />
    </ChatwootProvider>
  );
} 