"use client";

import { useState, useCallback, useRef } from "react";
import { ShipmentType } from "../schema/shared-types";
import * as FormilyHelpers from "../schema/formilyHelpers";
import type { AutoAdjustment } from "../components/AutoAdjustmentManager";

// 用户提示偏好设置
interface NotificationPreferences {
  disabledTypes: Set<string>; // 禁用的提示类型
  disabledFields: Set<string>; // 禁用的字段提示
  sessionDisabled: Set<string>; // 本次会话禁用的消息哈希
}

export function useAutoAdjustments(form: any) {
  const [autoAdjustments, setAutoAdjustments] = useState<AutoAdjustment[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    disabledTypes: new Set(),
    disabledFields: new Set(),
    sessionDisabled: new Set()
  });
  
  // 添加字段值历史记录和调整结果缓存
  const fieldValueHistory = useRef<Map<string, unknown>>(new Map());
  const adjustmentResultCache = useRef<Map<string, { result: string; timestamp: number }>>(new Map());
  const lastAdjustmentTime = useRef<Map<string, number>>(new Map());

  // 生成消息哈希用于去重
  const generateMessageHash = useCallback((field: string, message: string) => {
    return `${field}:${message}`.replace(/\s+/g, '').toLowerCase();
  }, []);

  // 生成字段状态签名，用于检测实际变化
  const generateFieldSignature = useCallback((field: string, values: Record<string, unknown>) => {
    switch (field) {
      case 'thickness':
        return `${values.layers}:${values.outerCopperWeight}:${values.innerCopperWeight}:${values.thickness}`;
      case 'minTrace':
        return `${values.layers}:${values.outerCopperWeight}:${values.innerCopperWeight}:${values.minTrace}`;
      case 'minHole':
        return `${values.layers}:${values.thickness}:${values.minHole}`;
      case 'silkscreen':
        return `${values.solderMask}:${values.silkscreen}`;
      case 'surfaceFinish':
        return `${values.layers}:${values.thickness}:${values.surfaceFinish}`;
      case 'maskCover':
        return `${values.layers}:${values.maskCover}`;
      default:
        return `${field}:${values[field]}`;
    }
  }, []);

  // 检查是否应该显示调整提示
  const shouldShowAdjustment = useCallback((field: string, adjustmentResult: { value: unknown; changed: boolean; message?: string | null }, currentValues: Record<string, unknown>) => {
    const now = Date.now();
    const fieldSignature = generateFieldSignature(field, currentValues);
    const lastValue = fieldValueHistory.current.get(field);
    const lastTime = lastAdjustmentTime.current.get(field) || 0;
    
    // 1. 如果调整没有实际发生变化，不显示
    if (!adjustmentResult.changed) {
      return false;
    }

    // 2. 如果字段值没有实际改变，不显示
    if (lastValue === currentValues[field]) {
      return false;
    }

    // 3. 检查调整结果缓存，避免相同结果的重复提示
    const cacheKey = `${field}:${fieldSignature}`;
    const cachedResult = adjustmentResultCache.current.get(cacheKey);
    if (cachedResult && now - cachedResult.timestamp < 30000) { // 30秒内相同结果不重复
      if (cachedResult.result === String(adjustmentResult.value)) {
        return false;
      }
    }

    // 4. 同一字段在5秒内不重复提示（无论内容）
    if (now - lastTime < 5000) {
      return false;
    }

    // 更新记录
    fieldValueHistory.current.set(field, currentValues[field]);
    lastAdjustmentTime.current.set(field, now);
    adjustmentResultCache.current.set(cacheKey, {
      result: String(adjustmentResult.value),
      timestamp: now
    });

    return true;
  }, [generateFieldSignature]);

  // 添加自动调整提示 - 优化去重逻辑
  const addAutoAdjustment = useCallback((adjustment: Omit<AutoAdjustment, 'id' | 'timestamp' | 'messageHash'>) => {
    const messageHash = generateMessageHash(adjustment.field, adjustment.message);
    
    // 检查用户偏好设置
    if (notificationPreferences.disabledTypes.has(adjustment.type) ||
        notificationPreferences.disabledFields.has(adjustment.field) ||
        notificationPreferences.sessionDisabled.has(messageHash)) {
      return;
    }

    const newAdjustment: AutoAdjustment = {
      ...adjustment,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      messageHash
    };
    
    setAutoAdjustments(prev => {
      // 更严格的去重逻辑
      const filtered = prev.filter(adj => {
        const now = Date.now();
        
        // 1. 完全相同的消息在1分钟内不重复显示
        if (adj.messageHash === messageHash && now - adj.timestamp < 60000) {
          return false;
        }
        
        // 2. 相同字段的任何消息在3秒内只保留最新的
        if (adj.field === newAdjustment.field && now - adj.timestamp < 3000) {
          return false;
        }
        
        // 3. 清理超过2分钟的旧提示，避免内存泄漏
        if (now - adj.timestamp > 120000) {
          return false;
        }
        
        return true;
      });
      
      // 限制同时显示的提示数量，避免界面混乱
      const limitedFiltered = filtered.slice(-5); // 最多保留5个最新的提示
      
      return [...limitedFiltered, newAdjustment];
    });
  }, [generateMessageHash, notificationPreferences]);

  // 检查字段值变化并添加提示 - 使用新的智能去重
  const checkForAutoAdjustments = useCallback((newValues: Record<string, unknown>, oldValues: Record<string, unknown>) => {
    // 定义触发检查的关键字段组合
    const triggerFields = {
      thickness: ['layers', 'outerCopperWeight', 'innerCopperWeight'],
      minTrace: ['layers', 'outerCopperWeight', 'innerCopperWeight'],
      minHole: ['layers', 'thickness'],
      silkscreen: ['solderMask'],
      surfaceFinish: ['layers', 'thickness'],
      maskCover: ['layers'],
      testMethod: ['layers', 'singleDimensions', 'singleCount', 'shipmentType', 'panelDimensions', 'panelSet']
    };

    // 检查是否有相关依赖项变化
    const hasRelevantChange = (targetField: string) => {
      const dependencies = triggerFields[targetField as keyof typeof triggerFields] || [];
      return dependencies.some(dep => newValues[dep] !== oldValues[dep]);
    };

    // 只在相关依赖项变化时检查厚度调整
    if (hasRelevantChange('thickness') && 
        newValues.layers && newValues.outerCopperWeight && newValues.innerCopperWeight) {
      
      const currentThickness = newValues.thickness as number || 1.6;
      const adjustment = FormilyHelpers.adjustThicknessForLayers([
        currentThickness,
        newValues.layers as number,
        newValues.outerCopperWeight as string,
        newValues.innerCopperWeight as string
      ]);
      
      // 转换为shouldShowAdjustment期望的格式
      const adjustmentForCheck = {
        value: adjustment.recommendedValue || currentThickness,
        changed: adjustment.shouldAdjust,
        message: adjustment.message
      };
      
      if (shouldShowAdjustment('thickness', adjustmentForCheck, newValues)) {
        addAutoAdjustment({
          field: 'thickness',
          type: 'warning',
          title: 'Thickness Adjustment',
          message: adjustment.message || '',
          detail: adjustment.availableOptions ? `Available Thicknesses: ${adjustment.availableOptions}` : undefined
        });
      }
    }

    // 检查最小线宽自动调整
    if (hasRelevantChange('minTrace') && 
        newValues.layers && newValues.outerCopperWeight && newValues.innerCopperWeight) {
      const currentTrace = newValues.minTrace as string || '6/6';
      const adjustment = FormilyHelpers.adjustMinTraceForSpecs([
        currentTrace,
        newValues.layers as number,
        newValues.outerCopperWeight as string,
        newValues.innerCopperWeight as string
      ]);
      
      // 转换为shouldShowAdjustment期望的格式
      const adjustmentForCheck = {
        value: adjustment.recommendedValue || currentTrace,
        changed: adjustment.shouldAdjust,
        message: adjustment.message
      };
      
      if (shouldShowAdjustment('minTrace', adjustmentForCheck, newValues)) {
        addAutoAdjustment({
          field: 'minTrace',
          type: 'warning',
          title: 'Min Trace Adjustment',
          message: adjustment.message || '',
          detail: adjustment.availableOptions ? `Available Trace: ${adjustment.availableOptions}` : undefined
        });
      }
    }

    // 检查最小孔径自动调整
    if (hasRelevantChange('minHole') && newValues.layers && newValues.thickness) {
      const currentHole = newValues.minHole as string || '0.2';
      const adjustment = FormilyHelpers.adjustMinHoleForSpecs([
        currentHole,
        newValues.layers as number,
        newValues.thickness as number
      ]);
      
      // 转换为shouldShowAdjustment期望的格式
      const adjustmentForCheck = {
        value: adjustment.recommendedValue || currentHole,
        changed: adjustment.shouldAdjust,
        message: adjustment.message
      };
      
      if (shouldShowAdjustment('minHole', adjustmentForCheck, newValues)) {
        addAutoAdjustment({
          field: 'minHole',
          type: 'warning',
          title: 'Min Hole Adjustment',
          message: adjustment.message || '',
          detail: adjustment.availableOptions ? `Available Hole: ${adjustment.availableOptions}` : undefined
        });
      }
    }

    // 检查丝印颜色自动调整
    if (hasRelevantChange('silkscreen') && newValues.solderMask) {
      const currentSilk = newValues.silkscreen as string || 'White';
      const adjustment = FormilyHelpers.adjustSilkscreenForMask([
        currentSilk,
        newValues.solderMask as string
      ]);
      
      // 转换为shouldShowAdjustment期望的格式
      const adjustmentForCheck = {
        value: adjustment.recommendedValue || currentSilk,
        changed: adjustment.shouldAdjust,
        message: adjustment.message
      };
      
      if (shouldShowAdjustment('silkscreen', adjustmentForCheck, newValues)) {
        addAutoAdjustment({
          field: 'silkscreen',
          type: 'info',
          title: 'Silkscreen Color Adjustment',
          message: adjustment.message || '',
          detail: adjustment.availableOptions ? `Available Colors: ${adjustment.availableOptions}` : undefined
        });
      }
    }

    // 检查层数变化引起的界面提示 - 只在首次变化时提示
    if (newValues.layers !== oldValues.layers) {
      const newLayers = newValues.layers as number;
      const oldLayers = oldValues.layers as number;
      
      // 使用特殊的字段名来避免与其他调整冲突，且只在特定变化时提示一次
      const layerChangeKey = `layers_${oldLayers}_to_${newLayers}`;
      const lastLayerChange = lastAdjustmentTime.current.get(layerChangeKey) || 0;
      const now = Date.now();
      
      // 5分钟内相同的层数变化不重复提示
      if (now - lastLayerChange > 300000) {
        lastAdjustmentTime.current.set(layerChangeKey, now);
        
        // 内层铜厚可见性变化提示
        if (newLayers >= 4 && oldLayers < 4) {
          addAutoAdjustment({
            field: 'innerCopperWeight',
            type: 'success',
            title: 'Inner Copper Weight Configuration Enabled',
            message: 'Detected Multi-Layer PCB Design, Inner Copper Weight Configuration Enabled',
            detail: '4 Layer PCBs Require Inner Copper Weight Parameter Configuration'
          });
        } else if (newLayers < 4 && oldLayers >= 4) {
          addAutoAdjustment({
            field: 'innerCopperWeight',
            type: 'info',
            title: 'Inner Copper Weight Configuration Hidden',
            message: 'Single/Double Layer PCBs Do Not Require Inner Copper Weight Configuration',
            detail: 'Inner Copper Weight Configuration Hidden'
          });
        }

        // HDI可见性变化提示
        if (newLayers >= 4 && oldLayers < 4) {
          addAutoAdjustment({
            field: 'hdi',
            type: 'info',
            title: 'HDI Configuration Enabled',
            message: 'Multi-Layer PCBs Can Choose HDI Process to Enhance Density',
            detail: 'High Density Interconnect (HDI) Applies to Designs Above 4 Layers'
          });
        } else if (newLayers < 4 && oldLayers >= 4) {
          addAutoAdjustment({
            field: 'hdi',
            type: 'info',
            title: 'HDI Configuration Hidden',
            message: 'Single/Double Layer PCBs Do Not Support HDI Process',
            detail: 'HDI Configuration Hidden'
          });
        }
      }
    }

    // 检查出货方式变化（只在真正改变时提示一次）
    if (newValues.shipmentType !== oldValues.shipmentType) {
      const shipmentType = newValues.shipmentType as ShipmentType;
      const shipmentChangeKey = `shipment_${oldValues.shipmentType}_to_${shipmentType}`;
      const lastShipmentChange = lastAdjustmentTime.current.get(shipmentChangeKey) || 0;
      const now = Date.now();
      
      // 1分钟内相同的出货方式变化不重复提示
      if (now - lastShipmentChange > 60000) {
        lastAdjustmentTime.current.set(shipmentChangeKey, now);
        
        if (shipmentType === ShipmentType.Single) {
          addAutoAdjustment({
            field: 'shipmentType',
            type: 'info',
            title: 'Switch to Single Sheet Shipment',
            message: 'Switched to Single Sheet Shipment Mode, Please Configure Single Sheet Quantity',
            detail: 'Single Sheet Shipment Suitable for Small Batch or Sample Production'
          });
        } else if (shipmentType === ShipmentType.PanelByCustom || shipmentType === ShipmentType.PanelBySpeedx) {
          addAutoAdjustment({
            field: 'shipmentType',
            type: 'info',
            title: 'Switch to Panel Shipment',
            message: 'Switched to Panel Shipment Mode, Please Configure Panel Parameters',
            detail: 'Panel Shipment Can Reduce Single Sheet Cost and Suitable for Batch Production'
          });
        }
      }
    }
  }, [addAutoAdjustment, shouldShowAdjustment]);

  // 移除自动调整提示
  const dismissAutoAdjustment = useCallback((id: string) => {
    setAutoAdjustments(prev => prev.filter(adj => adj.id !== id));
  }, []);

  // 禁用某种类型的提示
  const disableNotificationType = useCallback((type: string) => {
    setNotificationPreferences(prev => ({
      ...prev,
      disabledTypes: new Set([...prev.disabledTypes, type])
    }));
    // 清除当前显示的该类型提示
    setAutoAdjustments(prev => prev.filter(adj => adj.type !== type));
  }, []);

  // 禁用某个字段的提示
  const disableNotificationField = useCallback((field: string) => {
    setNotificationPreferences(prev => ({
      ...prev,
      disabledFields: new Set([...prev.disabledFields, field])
    }));
    // 清除当前显示的该字段提示
    setAutoAdjustments(prev => prev.filter(adj => adj.field !== field));
  }, []);

  // 重置通知偏好
  const resetNotificationPreferences = useCallback(() => {
    setNotificationPreferences({
      disabledTypes: new Set(),
      disabledFields: new Set(),
      sessionDisabled: new Set()
    });
  }, []);

  return {
    autoAdjustments,
    dismissAutoAdjustment,
    disableNotificationType,
    disableNotificationField,
    resetNotificationPreferences,
    checkForAutoAdjustments
  };
} 