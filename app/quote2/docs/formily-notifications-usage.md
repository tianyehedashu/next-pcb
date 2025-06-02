# Formily 用户通知系统使用指南

## 概述

`useFormilyNotifications` Hook 为 Formily 表单提供了智能的用户通知功能，当字段发生变化时会自动显示友好的提示信息。

## 功能特性

### 🎯 智能通知类型

1. **值变化通知** (`VALUE_CHANGE`)
   - 当字段值被自动调整时提示用户
   - 显示从旧值到新值的变化

2. **选项变化通知** (`OPTION_CHANGE`)
   - 当字段的可选项发生变化时提示
   - 显示选项数量的变化

3. **可见性变化通知** (`VISIBILITY_CHANGE`)
   - 当字段显示/隐藏状态改变时提示
   - 帮助用户了解字段的可用性

4. **启用/禁用通知** (`ENABLE_DISABLE`)
   - 当字段被启用或禁用时提示
   - 说明字段状态的变化原因

### 🛡️ 用户体验优化

- **防抖处理**: 避免频繁的重复通知
- **去重机制**: 相同内容的通知不会重复显示
- **用户控制**: 用户可以禁用特定字段或类型的通知
- **智能分组**: 相关通知会被合理分组显示

## 基本使用

### 1. 在组件中集成

```tsx
import { useFormilyNotifications, NotificationType } from '../hooks/useFormilyNotifications';
import { AutoAdjustmentManager } from '../components/AutoAdjustmentManager';

function MyFormComponent() {
  const [notifications, setNotifications] = useState<AutoAdjustment[]>([]);
  
  // 初始化通知系统
  const {
    disableFieldNotifications,
    disableNotificationType,
    clearCache
  } = useFormilyNotifications(
    form, // Formily form 实例
    (notification) => {
      // 处理新通知
      setNotifications(prev => [notification, ...prev].slice(0, 5));
    },
    {
      enabled: true,
      debounceDelay: 300,
      showDetails: true
    }
  );

  return (
    <div>
      {/* 你的表单内容 */}
      <FormProvider form={form}>
        <SchemaField schema={schema} />
      </FormProvider>
      
      {/* 通知管理器 */}
      <AutoAdjustmentManager
        adjustments={notifications}
        onDismiss={(id) => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }}
        onDisableField={disableFieldNotifications}
        onDisableType={(type) => {
          // 映射到 NotificationType
          const mapping = {
            'warning': NotificationType.VALUE_CHANGE,
            'info': NotificationType.OPTION_CHANGE,
            'success': NotificationType.VISIBILITY_CHANGE
          };
          const notificationType = mapping[type];
          if (notificationType) {
            disableNotificationType(notificationType);
          }
        }}
      />
    </div>
  );
}
```

### 2. 配置选项

```tsx
const config = {
  enabled: true,                    // 是否启用通知
  enabledTypes: [                   // 启用的通知类型
    NotificationType.VALUE_CHANGE,
    NotificationType.OPTION_CHANGE,
    NotificationType.VISIBILITY_CHANGE,
    NotificationType.ENABLE_DISABLE
  ],
  disabledFields: new Set(['id']),  // 禁用通知的字段
  debounceDelay: 300,               // 防抖延迟（毫秒）
  showDetails: true                 // 是否显示详细信息
};
```

## 高级用法

### 1. 自定义通知处理

```tsx
const handleNotification = useCallback((notification: AutoAdjustment) => {
  // 根据通知类型进行不同处理
  switch (notification.type) {
    case 'warning':
      // 值变化通知 - 可能需要用户确认
      console.log('Value changed:', notification.message);
      break;
    case 'info':
      // 信息通知 - 仅显示
      console.log('Info:', notification.message);
      break;
    case 'success':
      // 成功通知 - 积极反馈
      console.log('Success:', notification.message);
      break;
  }
  
  // 添加到通知列表
  setNotifications(prev => [notification, ...prev]);
}, []);
```

### 2. 条件性启用通知

```tsx
const [userPreferences, setUserPreferences] = useState({
  showValueChanges: true,
  showOptionChanges: false,
  showVisibilityChanges: true
});

const enabledTypes = useMemo(() => {
  const types = [];
  if (userPreferences.showValueChanges) {
    types.push(NotificationType.VALUE_CHANGE);
  }
  if (userPreferences.showOptionChanges) {
    types.push(NotificationType.OPTION_CHANGE);
  }
  if (userPreferences.showVisibilityChanges) {
    types.push(NotificationType.VISIBILITY_CHANGE);
  }
  return types;
}, [userPreferences]);

useFormilyNotifications(form, handleNotification, {
  enabledTypes,
  enabled: true
});
```

### 3. 批量操作

```tsx
const {
  disableFieldNotifications,
  enableFieldNotifications,
  disableNotificationType,
  enableNotificationType,
  clearCache
} = useFormilyNotifications(form, handleNotification);

// 批量禁用多个字段
const disableMultipleFields = useCallback((fields: string[]) => {
  fields.forEach(field => disableFieldNotifications(field));
}, [disableFieldNotifications]);

// 重置所有设置
const resetNotificationSettings = useCallback(() => {
  clearCache();
  // 重新启用所有类型
  Object.values(NotificationType).forEach(type => {
    enableNotificationType(type);
  });
}, [clearCache, enableNotificationType]);
```

## 最佳实践

### 1. 性能优化

```tsx
// 使用 useMemo 优化配置对象
const notificationConfig = useMemo(() => ({
  enabled: true,
  debounceDelay: 500, // 增加防抖延迟以减少噪音
  showDetails: false  // 在移动端可以关闭详细信息
}), []);

// 使用 useCallback 优化处理函数
const handleNotification = useCallback((notification: AutoAdjustment) => {
  // 处理逻辑
}, []);
```

### 2. 用户体验

```tsx
// 提供用户设置界面
function NotificationSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    showValueChanges: true,
    showOptionChanges: false,
    showVisibilityChanges: true,
    debounceDelay: 300
  });

  return (
    <div className="notification-settings">
      <h3>Notification Preferences</h3>
      
      <label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            enabled: e.target.checked
          }))}
        />
        Enable notifications
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={settings.showValueChanges}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            showValueChanges: e.target.checked
          }))}
        />
        Show value change notifications
      </label>
      
      {/* 更多设置选项... */}
    </div>
  );
}
```

### 3. 错误处理

```tsx
const handleNotification = useCallback((notification: AutoAdjustment) => {
  try {
    // 验证通知数据
    if (!notification.id || !notification.message) {
      console.warn('Invalid notification data:', notification);
      return;
    }
    
    // 处理通知
    setNotifications(prev => [notification, ...prev]);
    
  } catch (error) {
    console.error('Error handling notification:', error);
  }
}, []);
```

## 故障排除

### 常见问题

1. **通知不显示**
   - 检查 `enabled` 配置是否为 `true`
   - 确认 `enabledTypes` 包含相应的通知类型
   - 验证字段名是否在 `disabledFields` 中

2. **通知过于频繁**
   - 增加 `debounceDelay` 值
   - 检查是否有重复的事件监听器

3. **性能问题**
   - 使用 `useCallback` 和 `useMemo` 优化
   - 限制同时显示的通知数量
   - 考虑禁用不必要的通知类型

### 调试技巧

```tsx
// 启用调试模式
const debugConfig = {
  ...normalConfig,
  onDebug: (event: string, data: any) => {
    console.log(`[Formily Notifications] ${event}:`, data);
  }
};
```

## 总结

Formily 通知系统提供了一个强大而灵活的方式来增强表单的用户体验。通过合理的配置和使用，可以让用户更好地理解表单的动态行为，提高整体的交互质量。

记住始终考虑用户的需求和偏好，提供适当的控制选项，避免过度通知造成的干扰。 