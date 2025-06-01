"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

// 自动调整提示接口
export interface AutoAdjustment {
  id: string;
  field: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  detail?: string;
  timestamp: number;
  messageHash: string; // 用于去重的消息哈希
}

// 自动调整提示组件
function AutoAdjustmentToast({ adjustment, onDismiss, onDisableType, onDisableField }: {
  adjustment: AutoAdjustment;
  onDismiss: () => void;
  onDisableType?: (type: string) => void;
  onDisableField?: (field: string) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 设置自动消失定时器
  const setAutoHideTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        onDismiss();
      }
    }, 4000); // 减少到4秒自动消失
  }, [isHovered, onDismiss]);

  // 组件挂载时设置定时器
  useEffect(() => {
    setAutoHideTimer();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setAutoHideTimer]);

  // 鼠标悬停时暂停自动消失
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // 鼠标离开时恢复自动消失
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setAutoHideTimer();
  }, [setAutoHideTimer]);

  const getIcon = () => {
    switch (adjustment.type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyleClass = () => {
    switch (adjustment.type) {
      case 'warning':
        return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-900";
      case 'success':
        return "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900";
      default:
        return "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900";
    }
  };

  const getTypeLabel = () => {
    switch (adjustment.type) {
      case 'warning': return 'Adjustment Warnings';
      case 'success': return 'Success Notifications';
      case 'info': return 'Info Notifications';
      default: return 'Notifications';
    }
  };

  const getFieldLabel = () => {
    const fieldLabels: Record<string, string> = {
      thickness: 'Thickness',
      minTrace: 'Min Trace/Space',
      minHole: 'Min Hole Size',
      silkscreen: 'Silkscreen Color',
      surfaceFinish: 'Surface Finish',
      maskCover: 'Via Treatment',
      testMethod: 'Test Method',
      innerCopperWeight: 'Inner Copper Weight',
      hdi: 'HDI Configuration',
      shipmentType: 'Shipment Type'
    };
    return fieldLabels[adjustment.field] || adjustment.field;
  };

  return (
    <div 
      className={`relative p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm transition-all duration-300 cursor-pointer ${getStyleClass()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 悬停提示指示器 */}
      {isHovered && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-sm">
            {adjustment.title}
          </h4>
          <p className="text-sm opacity-90">
            {adjustment.message}
          </p>
          {adjustment.detail && (
            <p className="text-xs opacity-75 mt-1 bg-white/30 p-2 rounded">
              {adjustment.detail}
            </p>
          )}
          {/* 悬停提示文字 */}
          {isHovered && (
            <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
              <span>🖱️</span>
              Hover to keep visible, move away to auto-dismiss
            </p>
          )}
        </div>
        
        {/* 控制按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-xs"
            title="More Options"
          >
            ⚙️
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 展开选项 */}
      {showOptions && (
        <div className="mt-3 pt-3 border-t border-white/30 space-y-2">
          <p className="text-xs opacity-75 mb-2">Notification Settings:</p>
          <div className="flex flex-wrap gap-2">
            {onDisableField && (
              <button
                onClick={() => {
                  onDisableField(adjustment.field);
                  onDismiss();
                }}
                className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                Disable &ldquo;{getFieldLabel()}&rdquo; notifications
              </button>
            )}
            {onDisableType && (
              <button
                onClick={() => {
                  onDisableType(adjustment.type);
                  onDismiss();
                }}
                className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                Disable &ldquo;{getTypeLabel()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 自动调整提示管理器
export function AutoAdjustmentManager({ adjustments, onDismiss, onDisableType, onDisableField }: {
  adjustments: AutoAdjustment[];
  onDismiss: (id: string) => void;
  onDisableType?: (type: string) => void;
  onDisableField?: (field: string) => void;
}) {
  if (adjustments.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {adjustments.map((adjustment) => (
        <AutoAdjustmentToast
          key={adjustment.id}
          adjustment={adjustment}
          onDismiss={() => onDismiss(adjustment.id)}
          onDisableType={onDisableType}
          onDisableField={onDisableField}
        />
      ))}
    </div>
  );
} 