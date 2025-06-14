import { ChatwootFixButton } from '@/components/ChatwootFixButton';

export default function TestChatwootClosePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chatwoot 关闭问题修复
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            如果 Chatwoot 聊天窗口无法正常关闭，请使用右上角的"强制关闭聊天"按钮。
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">问题诊断</h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">常见原因：</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Chatwoot SDK 未完全加载</li>
                  <li>• 关闭方法不存在或被覆盖</li>
                  <li>• DOM 元素被其他脚本锁定</li>
                  <li>• 事件监听器冲突</li>
                  <li>• CSS 样式覆盖了关闭按钮</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">手动检查步骤：</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>打开浏览器开发者工具 (F12)</li>
                  <li>在 Console 中输入: <code className="bg-white px-1 rounded">console.log(window.$chatwoot)</code></li>
                  <li>检查是否显示 Chatwoot 对象</li>
                  <li>尝试运行: <code className="bg-white px-1 rounded">window.$chatwoot.toggle('close')</code></li>
                  <li>如果不行，点击右上角的"强制关闭聊天"按钮</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">解决方案：</h3>
                <div className="text-sm text-green-700 space-y-2">
                  <p><strong>方法1:</strong> 点击右上角的红色"强制关闭聊天"按钮</p>
                  <p><strong>方法2:</strong> 刷新页面重新加载 Chatwoot</p>
                  <p><strong>方法3:</strong> 在控制台运行强制关闭代码</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">控制台命令</h2>
            <p className="text-gray-600 mb-4">
              如果按钮不起作用，请在浏览器控制台中运行以下代码：
            </p>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="space-y-2">
                <div>// 检查 Chatwoot 状态</div>
                <div>console.log('Chatwoot loaded:', !!window.$chatwoot);</div>
                <div>console.log('Available methods:', window.$chatwoot ? Object.keys(window.$chatwoot) : 'Not loaded');</div>
                <div></div>
                <div>// 尝试关闭</div>
                <div>if (window.$chatwoot) window.$chatwoot.toggle('close');</div>
                <div></div>
                <div>// 强制隐藏所有 Chatwoot 元素</div>
                                 <div>document.querySelectorAll('[class*="chatwoot"], [id*="chatwoot"], .woot-widget-holder, .woot-widget-bubble').forEach(el =&gt; el.style.display = 'none');</div>
                 <div></div>
                 <div>// 完全移除 Chatwoot 元素</div>
                 <div>document.querySelectorAll('[class*="chatwoot"], [id*="chatwoot"], .woot-widget-holder, .woot-widget-bubble').forEach(el =&gt; el.remove());</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 修复按钮 */}
      <ChatwootFixButton />
    </div>
  );
} 