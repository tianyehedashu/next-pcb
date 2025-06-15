'use client';

import { useEffect, useState } from 'react';
import { useChatwoot } from '@/app/components/ChatwootProvider';
import { useUserStore } from '@/lib/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageCircle, User, Settings } from 'lucide-react';
import { ReactNode } from 'react';

interface ChatwootDebugState {
  sdkLoaded: boolean;
  userSynced: boolean;
  conversationExists: boolean;
  lastSyncTime: string | null;
}

export function ChatwootDebugInfo() {
  const { sdk, isLoading, error } = useChatwoot();
  const { user } = useUserStore();
  const [debugState, setDebugState] = useState<ChatwootDebugState>({
    sdkLoaded: false,
    userSynced: false,
    conversationExists: false,
    lastSyncTime: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkStatus = () => {
      setDebugState({
        sdkLoaded: !!sdk && !isLoading,
        userSynced: !!user && !!sdk,
        conversationExists: !!window.$chatwoot,
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [sdk, isLoading, user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
    }
  };

  const handleTestUserSync = () => {
    if (sdk && user) {
      try {
        sdk.setUser(user.id, {
          name: String(user.display_name ?? 'Test User'),
          email: String(user.email ?? 'test@example.com'),
        });
        
        sdk.setCustomAttributes({
          'test_sync': new Date().toISOString(),
          'user_id': user.id,
          'page': window.location.pathname,
        });
        
        console.log('[ChatwootDebugInfo] Manual user sync completed');
      } catch (error) {
        console.error('[ChatwootDebugInfo] Manual sync failed:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Chatwoot 状态调试
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* SDK 状态 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">SDK 加载状态:</span>
            <Badge variant={debugState.sdkLoaded ? "default" : "secondary"}>
              {debugState.sdkLoaded ? "✅ 已加载" : "⏳ 加载中"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">用户同步状态:</span>
            <Badge variant={debugState.userSynced ? "default" : "secondary"}>
              {debugState.userSynced ? "✅ 已同步" : "❌ 未同步"}
            </Badge>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>错误:</strong> {error.message}
            </p>
          </div>
        )}

        {/* 用户信息 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            当前用户信息
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
            {user ? (
              <>
                <div><strong>用户 ID:</strong> {user.id}</div>
                <div><strong>显示名称:</strong> {user.display_name || '未设置'}</div>
                <div><strong>邮箱:</strong> {user.email || '未设置'}</div>
                <div><strong>公司:</strong> {user.company_name || '未设置'}</div>
                             </>
             ) : (
               <div className="text-gray-500">用户未登录</div>
             )}
          </div>
        </div>

        {/* 技术信息 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            技术信息
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
            <div><strong>SDK 类型:</strong> 本地加载</div>
            <div><strong>最后检查:</strong> {debugState.lastSyncTime}</div>
            <div><strong>window.$chatwoot:</strong> {window.$chatwoot ? '✅ 存在' : '❌ 不存在'}</div>
            <div><strong>对话历史:</strong> {user ? '基于用户 ID 自动关联' : '匿名模式'}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleOpenChat}
            disabled={!debugState.sdkLoaded}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            打开聊天窗口
          </Button>
          
          <Button
            onClick={handleTestUserSync}
            disabled={!debugState.sdkLoaded || !user}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            手动同步用户
          </Button>
        </div>

        {/* 对话历史说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            💡 对话历史功能说明
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 登录用户的对话历史会自动保存和恢复</li>
            <li>• 使用用户 ID 作为唯一标识符确保连续性</li>
            <li>• 刷新页面或重新登录后历史记录依然存在</li>
            <li>• 匿名对话在登录后会自动合并到用户账户</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 