"use client";

import { useCallback, useEffect } from "react";
import { onFormMount } from "@formily/core";
import type { AutoAdjustment } from "../components/AutoAdjustmentManager";
import type { Form } from '@formily/core';

// 通知类型枚举
export enum NotificationType {
  VALUE_CHANGE = 'value_change',
  OPTION_CHANGE = 'option_change', 
  VISIBILITY_CHANGE = 'visibility_change',
  ENABLE_DISABLE = 'enable_disable'
}

// 通知配置接口
interface NotificationConfig {
  enabled: boolean;
  enabledTypes: NotificationType[];
  disabledFields: Set<string>;
  displayDuration: number;
  debounceDelay: number;
  maxNotifications: number;
  showDetails: boolean;
}

/**
 * Formily 用户通知 Hook - 临时禁用版本
 * 为了避免循环问题，暂时禁用所有通知功能
 */
export function useFormilyNotifications(
  onNotification: (notification: AutoAdjustment) => void,
  config: Partial<NotificationConfig> = {}
) {
  // 避免未使用变量警告
  void onNotification;
  void config;
  
  // 简单的空实现，避免任何可能的循环
  const createEffects = useCallback(() => {
    return () => {
      // 空的 effects 函数，不做任何事情
      onFormMount((form: Form) => {
        // 避免未使用变量警告
        void form;
        // 不监听任何事件，避免循环
        return () => {
          // 空的清理函数
        };
      });
    };
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      // 空的清理函数
    };
  }, []);

  // 返回控制函数和 effects
  return {
    // Effects 函数，供 createForm 使用
    effects: createEffects(),
    
    // 禁用特定字段的提示
    disableFieldNotifications: useCallback(() => {
      // 空实现
    }, []),
    
    // 启用特定字段的提示
    enableFieldNotifications: useCallback(() => {
      // 空实现
    }, []),
    
    // 禁用特定类型的提示
    disableNotificationType: useCallback(() => {
      // 空实现
    }, []),
    
    // 启用特定类型的提示
    enableNotificationType: useCallback(() => {
      // 空实现
    }, []),
    
    // 清理所有缓存
    clearCache: useCallback(() => {
      // 空实现
    }, [])
  };
} 