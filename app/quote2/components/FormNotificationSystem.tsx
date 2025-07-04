"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "@formily/react";
import { Field, GeneralField } from "@formily/core";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, AlertCircle, CheckCircle, Info, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// 提示类型定义
export type NotificationType = 'value-changed' | 'options-changed' | 'visibility-changed' | 'validation-error' | 'info';

// 简化的选项类型
type OptionType = { label: string; value: string | number | boolean };

// 格式化值显示的工具函数
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'empty';
  if (typeof value === 'string' && value === '') return 'empty';
  if (typeof value === 'string' && value.toLowerCase() === 'none') return 'empty';
  if (value === 0 || value === '0') return 'empty';
  return String(value);
};

// 检查是否为重要字段
const isImportantField = (fieldPath: string): boolean => {
  return fieldPath === 'silkscreen' || fieldPath === 'thickness' || fieldPath === 'surfaceFinish';
};

export interface FormNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fieldPath: string;
  fieldTitle?: string;
  timestamp: number;
  autoHide?: boolean;
  duration?: number;
  details?: {
    oldValue?: unknown;
    newValue?: unknown;
    oldOptions?: OptionType[];
    newOptions?: OptionType[];
    wasVisible?: boolean;
    isVisible?: boolean;
  };
}

// 提示管理 Hook
export const useFormNotifications = () => {
  const [notifications, setNotifications] = useState<FormNotification[]>([]);
  const [hoveredNotificationId, setHoveredNotificationId] = useState<string | null>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const form = useForm();

  // 添加通知
  const addNotification = useCallback((notification: Omit<FormNotification, 'id' | 'timestamp'>) => {
    const newNotification: FormNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      autoHide: notification.autoHide !== false,
      duration: notification.duration || 3000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // 设置自动隐藏
    if (newNotification.autoHide) {
      const timeoutId = setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
      timeoutsRef.current.set(newNotification.id, timeoutId);
    }
  }, []);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // 清除对应的定时器
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, [hoveredNotificationId]);

  // 强制移除通知（用于用户手动关闭）
  const forceRemoveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // 清除对应的定时器
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    
    // 如果移除的是悬停的通知，清除悬停状态
    if (hoveredNotificationId === id) {
      setHoveredNotificationId(null);
    }
  }, [hoveredNotificationId]);

  // 清除所有通知
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // 清除所有定时器
    timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
  }, []);

  // 暂停自动隐藏
  const pauseAutoHide = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // 恢复自动隐藏
  const resumeAutoHide = useCallback((id: string, duration: number) => {
    // 先清除可能存在的旧定时器
    const existingTimeoutId = timeoutsRef.current.get(id);
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
    }
    
    // 设置新的定时器
    const timeoutId = setTimeout(() => {
      removeNotification(id);
    }, duration);
    timeoutsRef.current.set(id, timeoutId);
  }, [removeNotification]);

  // 设置悬停通知
  const setHoveredNotification = useCallback((id: string | null) => {
    setHoveredNotificationId(id);
  }, []);

  // 监听表单变化
  useEffect(() => {
    if (!form) return;

    const fieldChangeMap = new Map<string, { value: unknown; options: OptionType[]; visible: boolean }>();
    
    // 初始化字段状态
    const initializeFieldStates = () => {
      form.query('*').forEach((field: GeneralField) => {
        if (field.path && field.displayName !== 'VoidField') {
          const dataField = field as Field;
          const options = Array.isArray(dataField.dataSource) 
            ? dataField.dataSource.map(item => ({
                label: String(item.label || item.title || item.value || ''),
                value: item.value || ''
              }))
            : [];
            
          fieldChangeMap.set(field.path.toString(), {
            value: dataField.value,
            options,
            visible: field.visible
          });
        }
      });
    };

    // 处理值变化的函数
    const handleValueChange = (field: Field, fieldPath: string, previousState: { value: unknown; options: OptionType[]; visible: boolean }) => {
      const currentValue = field.value;
      
      // 检查是否为自动调整
      const isAutoAdjustingFlag = (field as unknown as Record<string, unknown>).isAutoAdjusting === true;
      const isAutoAdjustment = isAutoAdjustingFlag || !field.modified;
      
      if (!isAutoAdjustment) return;
      
      // 先格式化值
      const oldValueStr = formatValue(previousState.value);
      const newValueStr = formatValue(currentValue);
      
      // 过滤掉不需要通知的变化
      if (oldValueStr === 'empty' || newValueStr === 'empty' || oldValueStr === newValueStr) {
        return;
      }
      
      // 构建并发送通知
      const fieldDisplayName = field.title || fieldPath;
      const adjustmentMessage = `Auto-adjusted from "${oldValueStr}" to "${newValueStr}" based on other field changes`;
      const notificationDuration = isImportantField(fieldPath) ? 8000 : 4000;
      
      addNotification({
        type: 'value-changed',
        title: fieldDisplayName,
        message: adjustmentMessage,
        fieldPath,
        fieldTitle: field.title,
        duration: notificationDuration,
        details: {
          oldValue: previousState.value,
          newValue: currentValue
        }
      });
    };

    // 处理验证错误 - 暂时禁用以避免与QuoteForm中的错误处理冲突
    // const handleValidationError = (field: Field) => {
    //   if (field.errors?.length > 0) {
    //     const fieldDisplayName = field.title || field.path?.toString() || '';
    //     const error = field.errors[0];
        
    //     let errorText = 'This field is required';
        
    //     // 正确解析错误对象
    //     if (error && typeof error === 'object') {
    //       const errorObj = error as Record<string, unknown>;
    //       if (typeof errorObj.message === 'string' && errorObj.message) {
    //         errorText = errorObj.message;
    //       } else if (Array.isArray(errorObj.issues) && errorObj.issues.length > 0) {
    //         const issue = errorObj.issues[0] as Record<string, unknown>;
    //         errorText = typeof issue.message === 'string' ? issue.message : 'This field is required';
    //       } else if (Array.isArray(errorObj.messages) && errorObj.messages.length > 0) {
    //         errorText = String(errorObj.messages[0]);
    //       }
    //     } else if (typeof error === 'string' && error) {
    //       errorText = error;
    //     }
        
    //     addNotification({
    //       type: 'validation-error',
    //       title: fieldDisplayName,
    //       message: errorText,
    //       fieldPath: field.path?.toString() || '',
    //       fieldTitle: field.title,
    //       duration: 5000,
    //       autoHide: true
    //     });
    //   }
    // };

    // 延迟初始化，确保表单完全加载
    const timer = setTimeout(initializeFieldStates, 1000);

    const subscriptionId = form.subscribe(({ type, payload }) => {
      if (type === 'onFieldValueChange') {
        const field = payload as Field;
        const fieldPath = field.path?.toString();
        if (!fieldPath) return;

        const previousState = fieldChangeMap.get(fieldPath);
        const currentValue = field.value;
        
        const currentOptions = Array.isArray(field.dataSource) 
          ? field.dataSource.map(item => ({
              label: String(item.label || item.title || item.value || ''),
              value: item.value || ''
            }))
          : [];
          
        const currentVisible = field.visible;

        // 处理值变化
        if (previousState && previousState.value !== currentValue) {
          handleValueChange(field, fieldPath, previousState);
        }

        // 注释掉验证错误处理，避免与QuoteForm中的错误处理冲突
        // handleValidationError(field);

        // 更新状态
        fieldChangeMap.set(fieldPath, {
          value: currentValue,
          options: currentOptions,
          visible: currentVisible
        });
      } else if (type === 'onFieldValidateStart') {
        // 注释掉验证错误处理，避免与QuoteForm中的错误处理冲突
        // const field = payload as Field;
        // handleValidationError(field);
      }
    });

    return () => {
      clearTimeout(timer);
      form.unsubscribe(subscriptionId);
    };
  }, [form, addNotification]);

  // 清理定时器
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    forceRemoveNotification,
    clearNotifications,
    pauseAutoHide,
    resumeAutoHide,
    setHoveredNotification,
    hoveredNotificationId
  };
};

// 提示图标组件
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'value-changed':
      return <Settings className="h-4 w-4 text-blue-500" />;
    case 'options-changed':
      return <Info className="h-4 w-4 text-amber-500" />;
    case 'visibility-changed':
      return <Eye className="h-4 w-4 text-purple-500" />;
    case 'validation-error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
};

// 通知项组件
const NotificationItem = ({ 
  notification, 
  onForceRemove,
  onPauseAutoHide,
  onResumeAutoHide,
  onHoverChange,
  isHovered
}: { 
  notification: FormNotification; 
  onForceRemove: (id: string) => void;
  onPauseAutoHide: (id: string) => void;
  onResumeAutoHide: (id: string, duration: number) => void;
  onHoverChange: (id: string | null) => void;
  isHovered: boolean;
}) => {
  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'value-changed':
        return 'bg-blue-50 border-blue-200 text-blue-800 shadow-lg border-2';
      case 'options-changed':
        return 'bg-amber-50 border-amber-200 text-amber-800 shadow-lg border-2';
      case 'visibility-changed':
        return 'bg-purple-50 border-purple-200 text-purple-800 shadow-lg border-2';
      case 'validation-error':
        return 'bg-red-50 border-red-200 text-red-800 shadow-lg border-2';
      default:
        return 'bg-green-50 border-green-200 text-green-800 shadow-lg border-2';
    }
  };

  const handleMouseEnter = () => {
    onHoverChange(notification.id);
    onPauseAutoHide(notification.id);
  };

  const handleMouseLeave = () => {
    onHoverChange(null);
    if (notification.autoHide) {
      onResumeAutoHide(notification.id, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout={!isHovered}
      className={cn(
        "relative rounded-lg border shadow-sm cursor-default backdrop-blur-sm",
        getNotificationStyles(notification.type),
        isHovered && "z-10 shadow-xl scale-105"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={isHovered ? { position: 'relative', zIndex: 10 } : undefined}
    >
      {/* 主通知内容 */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          <NotificationIcon type={notification.type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-bold text-base text-current">{notification.title}</div>
              <span className="text-xs px-2 py-0.5 bg-current/10 rounded-full font-medium opacity-75">
                Auto-adjusted
              </span>
            </div>
            <div className="text-sm mt-1 opacity-90 font-medium">{notification.message}</div>
            
            {/* 时间戳 */}
            <div className="text-xs mt-2 opacity-60">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
            
            {/* 通知的详细信息 */}
            {notification.details && (
              <div className="text-xs mt-3 opacity-75">
                {notification.type === 'value-changed' && (
                  <div className="bg-white/70 rounded-md px-3 py-2 border border-current/30">
                    <div className="font-semibold mb-2 text-xs">Value Change:</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium opacity-70">From</span>
                        <span className={cn(
                          "font-mono px-2 py-1 rounded-md text-sm font-bold shadow-sm",
                          (notification.details.oldValue === null || 
                           notification.details.oldValue === undefined || 
                           notification.details.oldValue === '' ||
                           String(notification.details.oldValue).toLowerCase() === 'none')
                            ? "bg-gray-500 text-white border-2 border-dashed border-gray-300"
                            : "bg-red-500 text-white"
                        )}>
                          {(notification.details.oldValue === null || 
                            notification.details.oldValue === undefined || 
                            notification.details.oldValue === '' ||
                            String(notification.details.oldValue).toLowerCase() === 'none')
                            ? "EMPTY" 
                            : String(notification.details.oldValue)}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-lg font-bold text-gray-600">→</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium opacity-70">To</span>
                        <span className={cn(
                          "font-mono px-2 py-1 rounded-md text-sm font-bold shadow-sm",
                          (notification.details.newValue === null || 
                           notification.details.newValue === undefined || 
                           notification.details.newValue === '' ||
                           String(notification.details.newValue).toLowerCase() === 'none')
                            ? "bg-gray-500 text-white border-2 border-dashed border-gray-300"
                            : "bg-green-600 text-white"
                        )}>
                          {(notification.details.newValue === null || 
                            notification.details.newValue === undefined || 
                            notification.details.newValue === '' ||
                            String(notification.details.newValue).toLowerCase() === 'none')
                            ? "EMPTY" 
                            : String(notification.details.newValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {notification.type === 'options-changed' && (
                  <div>
                    Options updated: {notification.details.newOptions?.length || 0} available
                  </div>
                )}
                {notification.type === 'visibility-changed' && (
                  <div className="flex items-center gap-1">
                    {notification.details.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {notification.details.isVisible ? 'Now visible' : 'Now hidden'}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onForceRemove(notification.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 主提示容器组件
export const FormNotificationContainer = () => {
  const { 
    notifications,
    forceRemoveNotification, 
    clearNotifications, 
    pauseAutoHide, 
    resumeAutoHide,
    setHoveredNotification,
    hoveredNotificationId
  } = useFormNotifications();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const notificationContent = (
    <>
      {/* 通知容器 - 固定在视窗右上角 */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[10000] w-80 max-w-sm space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onForceRemove={forceRemoveNotification}
                  onPauseAutoHide={pauseAutoHide}
                  onResumeAutoHide={resumeAutoHide}
                  onHoverChange={setHoveredNotification}
                  isHovered={hoveredNotificationId === notification.id}
                />
              </div>
            ))}
          </AnimatePresence>
          
          {notifications.length > 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearNotifications}
              className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 text-center border-t border-gray-200 bg-white/80 backdrop-blur-sm rounded-b-lg"
            >
              Clear all notifications
            </motion.button>
          )}
        </div>
      )}
    </>
  );

  // 使用 Portal 将通知渲染到 body 中
  return createPortal(notificationContent, document.body);
}; 