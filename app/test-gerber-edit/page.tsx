"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestGerberEditPage() {
  const [result, setResult] = useState<string>('');

  const testEditWithExistingGerber = () => {
    // 测试有现有Gerber文件的订单编辑
    const quoteId = 'aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0';
    window.open(`/quote2?edit=${quoteId}`, '_blank');
    setResult('✅ 已打开编辑页面，测试有现有Gerber文件的订单编辑功能');
  };

  const testEditWithoutGerber = () => {
    // 测试没有Gerber文件的订单编辑
    const quoteId = '93b99dec-b9a1-40bc-af82-8a82b3337f47';
    window.open(`/quote2?edit=${quoteId}`, '_blank');
    setResult('✅ 已打开编辑页面，测试没有Gerber文件的订单编辑功能');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Gerber File Edit Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>测试场景</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ 修复内容</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 编辑模式下，如果数据库中已有Gerber文件，不强制要求重新上传</li>
              <li>• 提交时优先使用现有的Gerber文件URL</li>
              <li>• 只有在新建订单或没有现有文件时才要求上传</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testEditWithExistingGerber}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-semibold">测试场景 1</span>
              <span className="text-sm">有现有Gerber文件的订单</span>
            </Button>
            
            <Button
              onClick={testEditWithoutGerber}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-semibold">测试场景 2</span>
              <span className="text-sm">没有Gerber文件的订单</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{result}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
                     <div className="p-3 bg-blue-50 rounded-lg">
             <h4 className="font-semibold text-blue-800 mb-2">场景 1：有现有Gerber文件 ✅</h4>
             <p className="text-sm text-blue-700">
               订单ID: aba642d6... (已设置测试Gerber文件URL) 应该能够正常编辑和提交，不会要求重新上传Gerber文件
             </p>
           </div>
           
           <div className="p-3 bg-yellow-50 rounded-lg">
             <h4 className="font-semibold text-yellow-800 mb-2">场景 2：没有Gerber文件 ⚠️</h4>
             <p className="text-sm text-yellow-700">
               订单ID: 93b99dec... (无Gerber文件) 编辑时仍然需要上传Gerber文件（如果是登录用户）
             </p>
           </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">预期行为</h4>
            <ul className="text-sm text-gray-700 space-y-1">
                             <li>• 场景1：可以直接提交，不会出现&quot;Gerber file is required&quot;错误</li>
              <li>• 场景2：登录用户仍需上传Gerber文件才能提交</li>
              <li>• 两种场景都应该能正常加载编辑页面</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 