'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Terminal, Zap } from 'lucide-react';

export const QuickIframeCleanup = () => {
  const cleanupScript = `// 🧹 Chatwoot IFrame 快速清理脚本
console.log('🔍 开始清理 Chatwoot iframe...');

// 1. 查找所有可能有问题的 iframe
const problematicSelectors = [
  'iframe[src*="app.chatwoot.com"]:not([src*="/packs/js/sdk.js"])',
  'iframe[src*="chatwoot"]:not([src*="sdk.js"])',
  'iframe[class*="chatwoot"]',
  'iframe[id*="chatwoot"]',
  '.woot-widget-holder iframe',
  '.woot-widget-bubble iframe'
];

let cleanedCount = 0;
problematicSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(\`找到 \${elements.length} 个匹配 "\${selector}" 的元素\`);
    elements.forEach((el, index) => {
      const src = el.getAttribute('src') || '';
      console.log(\`  - 删除 iframe \${index + 1}: \${src}\`);
      el.remove();
      cleanedCount++;
    });
  }
});

// 2. 额外清理其他 Chatwoot 元素
const additionalSelectors = [
  'script[src*="chatwoot"]',
  '[class*="chatwoot"]',
  '[id*="chatwoot"]',
  '.woot-widget-holder',
  '.woot-widget-bubble',
  '.woot-widget-wrapper'
];

additionalSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(\`清理 \${elements.length} 个 "\${selector}" 元素\`);
    elements.forEach(el => el.remove());
    cleanedCount += elements.length;
  }
});

// 3. 清理全局对象
const globalObjects = ['$chatwoot', 'chatwootSDK', 'chatwootSettings'];
globalObjects.forEach(obj => {
  if (window[obj]) {
    delete window[obj];
    console.log(\`清理全局对象: \${obj}\`);
  }
});

console.log(\`✅ 清理完成！总共清理了 \${cleanedCount} 个元素\`);
console.log('💡 建议刷新页面以重新加载正确的 Chatwoot 配置');`;

  const copyScript = () => {
    navigator.clipboard.writeText(cleanupScript);
    alert('清理脚本已复制到剪贴板！\n\n请在浏览器控制台中粘贴并执行。');
  };

  const executeScript = () => {
    try {
      // 执行清理脚本
      eval(cleanupScript);
      alert('清理脚本已执行！请查看控制台输出。');
    } catch (error) {
      console.error('执行清理脚本时出错:', error);
      alert('执行出错，请手动在控制台中运行脚本。');
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          快速 IFrame 清理
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">立即清理方法:</h3>
          <p className="text-sm text-blue-700 mb-3">
            如果你需要立即清理问题 iframe，可以使用以下两种方法之一：
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={executeScript} variant="default">
              <Zap className="h-4 w-4 mr-2" />
              立即执行清理
            </Button>
            
            <Button onClick={copyScript} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              复制脚本到控制台
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
          <div className="text-white mb-2">清理脚本预览:</div>
          <pre className="whitespace-pre-wrap">{cleanupScript}</pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">使用说明:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li><strong>方法一:</strong> 点击&ldquo;立即执行清理&rdquo;按钮</li>
            <li><strong>方法二:</strong> 点击&ldquo;复制脚本到控制台&rdquo;，然后在浏览器控制台中粘贴执行</li>
            <li>执行后查看控制台输出，了解清理了哪些元素</li>
            <li>建议清理后刷新页面以重新加载正确的配置</li>
          </ol>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">清理目标:</h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>所有指向 app.chatwoot.com 主页面的 iframe</li>
            <li>包含 &ldquo;chatwoot&rdquo; 但不是 SDK 的 iframe</li>
            <li>具有 chatwoot 相关 class 或 id 的 iframe</li>
            <li>其他可能导致 X-Frame-Options 错误的元素</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 