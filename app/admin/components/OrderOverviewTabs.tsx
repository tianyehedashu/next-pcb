import React from "react";

interface PCBFieldConfig {
  key: string;
  shouldShow: (data: Record<string, unknown>) => boolean;
}
interface PCBFieldGroup {
  title: string;
  fields: PCBFieldConfig[];
}

interface OrderOverviewTabsProps {
  order: Record<string, unknown>;
  pcbFieldGroups: PCBFieldGroup[];
  pcbFieldLabelMap: Record<string, string>;
  pcbFieldValueMap: Record<string, (value: unknown) => string>;
  hidePriceDetailsTab?: boolean;
}

export function OrderOverviewTabs({ order, pcbFieldGroups, pcbFieldLabelMap, pcbFieldValueMap }: OrderOverviewTabsProps) {
  const userOrder = order as {
    email?: string;
    user_id?: string;
    user_name?: string;
    id: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    pcb_spec?: Record<string, unknown>;
    shipping_address?: {
      id?: string;
      city?: string;
      label?: string;
      phone?: string;
      state?: string;
      address?: string;
      country?: string;
      courier?: string;
      zipCode?: string;
      isDefault?: boolean;
      contactName?: string;
    };
  };
  const pcbSpec = userOrder.pcb_spec;
  
  const [activeTab, setActiveTab] = React.useState<'overview' | 'pcb'>('overview');
  const [showShippingAddress, setShowShippingAddress] = React.useState(false);

  // 国家代码映射
  const countryMap: Record<string, string> = {
    'CN': '中国',
    'US': '美国',
    'UK': '英国',
    'DE': '德国',
    'FR': '法国',
    'JP': '日本',
    'KR': '韩国',
    'AU': '澳大利亚',
    'CA': '加拿大',
    'SG': '新加坡',
  };

  // 快递公司映射
  const courierMap: Record<string, string> = {
    'dhl': 'DHL',
    'fedex': 'FedEx',
    'ups': 'UPS',
    'tnt': 'TNT',
    'ems': 'EMS',
    'sf': '顺丰',
  };

  return (
    <>
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📋 订单信息
        </h3>
      </div>

      {/* 标签切换 */}
      <div className="border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 基本信息
          </button>
          <button
            onClick={() => setActiveTab('pcb')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pcb'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔧 PCB规格
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 用户信息卡片 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                👤 用户信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📧</span>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">邮箱</div>
                    <div className="text-blue-900 font-medium">{userOrder.email || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👨</span>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">用户姓名</div>
                    <div className="text-blue-900 font-medium">{userOrder.user_name || '-'}</div>
                  </div>
                </div>
              </div>
              
              {/* 收货地址可折叠区域 */}
              {userOrder.shipping_address && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <button
                    onClick={() => setShowShippingAddress(!showShippingAddress)}
                    className="flex items-center justify-between w-full text-left p-3 bg-blue-100/50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-sm">📍</span>
                      <span className="text-blue-800 font-medium">收货地址</span>
                      {userOrder.shipping_address.isDefault && (
                        <span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs rounded-full font-medium">
                          默认
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-blue-600 transition-transform ${
                        showShippingAddress ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showShippingAddress && (
                    <div className="mt-3 p-4 bg-white/60 rounded-lg border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs">👤</span>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">联系人</div>
                            <div className="text-blue-900 text-sm">{userOrder.shipping_address.contactName || '-'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs">📱</span>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">联系电话</div>
                            <div className="text-blue-900 text-sm">{userOrder.shipping_address.phone || '-'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs">🌍</span>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">国家</div>
                            <div className="text-blue-900 text-sm">
                              {countryMap[userOrder.shipping_address.country || ''] || userOrder.shipping_address.country || '-'}
                            </div>
                          </div>
                        </div>
                        
                        {(userOrder.shipping_address.state || userOrder.shipping_address.city) && (
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                              <span className="text-blue-600 text-xs">🏙️</span>
                            </div>
                            <div>
                              <div className="text-xs text-blue-600 font-medium">地区</div>
                              <div className="text-blue-900 text-sm">
                                {[userOrder.shipping_address.state, userOrder.shipping_address.city].filter(Boolean).join(' / ') || '-'}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs">📮</span>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">邮编</div>
                            <div className="text-blue-900 text-sm">{userOrder.shipping_address.zipCode || '-'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 md:col-span-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs">🏠</span>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">详细地址</div>
                            <div className="text-blue-900 text-sm">{userOrder.shipping_address.address || '-'}</div>
                          </div>
                        </div>
                        
                        {userOrder.shipping_address.courier && (
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                              <span className="text-blue-600 text-xs">🚚</span>
                            </div>
                            <div>
                              <div className="text-xs text-blue-600 font-medium">快递方式</div>
                              <div className="text-blue-900 text-sm">
                                {courierMap[userOrder.shipping_address.courier] || userOrder.shipping_address.courier.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userOrder.shipping_address.label && (
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mt-0.5">
                              <span className="text-blue-600 text-xs">🏷️</span>
                            </div>
                            <div>
                              <div className="text-xs text-blue-600 font-medium">地址标签</div>
                              <div className="text-blue-900 text-sm">{userOrder.shipping_address.label}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 订单信息卡片 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                📋 订单信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-sm">#</span>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600 font-medium">订单编号</div>
                    <div className="text-emerald-900 font-medium">{userOrder.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-sm">📊</span>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600 font-medium">订单状态</div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      userOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      userOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      userOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userOrder.status || '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-sm">📅</span>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600 font-medium">创建时间</div>
                    <div className="text-emerald-900 font-medium">
                      {userOrder.created_at ? new Date(userOrder.created_at as string).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-sm">🔄</span>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600 font-medium">更新时间</div>
                    <div className="text-emerald-900 font-medium">
                      {userOrder.updated_at ? new Date(userOrder.updated_at as string).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pcb' && (
          <div className="space-y-6">
            {pcbSpec && typeof pcbSpec === "object" ? (
              pcbFieldGroups.map((group, groupIndex) => {
                const visibleFields = group.fields.filter(field => {
                  if (!field.shouldShow(pcbSpec)) return false;
                  const value = pcbSpec[field.key];
                  return value !== undefined && value !== null && value !== "";
                });
                
                if (visibleFields.length === 0) return null;
                
                const gradientColors = [
                  'from-rose-50 to-pink-50 border-rose-100',
                  'from-orange-50 to-amber-50 border-orange-100',
                  'from-yellow-50 to-lime-50 border-yellow-100',
                  'from-green-50 to-emerald-50 border-green-100',
                  'from-cyan-50 to-blue-50 border-cyan-100',
                  'from-indigo-50 to-purple-50 border-indigo-100'
                ];
                
                const headerColors = [
                  'text-rose-800',
                  'text-orange-800',
                  'text-yellow-800',
                  'text-green-800',
                  'text-cyan-800',
                  'text-indigo-800'
                ];
                
                const textColors = [
                  'text-rose-600',
                  'text-orange-600',
                  'text-yellow-600',
                  'text-green-600',
                  'text-cyan-600',
                  'text-indigo-600'
                ];
                
                const valueColors = [
                  'text-rose-900',
                  'text-orange-900',
                  'text-yellow-900',
                  'text-green-900',
                  'text-cyan-900',
                  'text-indigo-900'
                ];
                
                const colorIndex = groupIndex % gradientColors.length;
                
                return (
                  <div key={group.title} className={`bg-gradient-to-br ${gradientColors[colorIndex]} rounded-xl p-4 border`}>
                    <h4 className={`text-lg font-semibold ${headerColors[colorIndex]} mb-4 flex items-center gap-2`}>
                      🔧 {group.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleFields.map((field) => {
                        const value = pcbSpec[field.key];
                        return (
                          <div key={field.key} className="flex flex-col gap-1">
                            <div className={`text-xs ${textColors[colorIndex]} font-medium`}>
                              {pcbFieldLabelMap[field.key] || field.key}
                            </div>
                            <div className={`${valueColors[colorIndex]} font-semibold text-sm`}>
                              {pcbFieldValueMap[field.key] ? pcbFieldValueMap[field.key](value) : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-lg font-medium">暂无PCB规格信息</p>
                <p className="text-sm">请检查订单是否包含PCB规格数据</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
} 