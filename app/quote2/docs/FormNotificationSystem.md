# Formily 表单通知系统

这是一个基于 Formily 的友好用户提示系统，当表单字段的值被动改变、可选项变化或可见性变化时提供实时用户提示。

## 功能特性

### 🔄 值变化提示
- 当字段值被联动逻辑自动调整时显示提示
- 区分用户主动修改和系统自动调整
- 显示变化前后的值对比

### 📋 选项变化提示
- 当字段的可选项根据其他字段变化时显示提示
- 显示新的可选项数量
- 帮助用户理解选项变化的原因

### 👁️ 可见性变化提示
- 当字段根据条件显示或隐藏时提供提示
- 清晰说明字段状态变化的原因
- 帮助用户理解表单的动态行为

### ✨ 视觉增强
- 平滑的动画过渡效果
- 直观的图标和颜色编码
- 非侵入式的提示设计

## 使用方法

### 1. 基础集成

```tsx
import { FormNotificationContainer } from "./FormNotificationSystem";

export function YourForm() {
  return (
    <FormProvider form={form}>
      {/* 添加通知容器 */}
      <FormNotificationContainer />
      
      {/* 你的表单内容 */}
      <div className="form-content">
        {/* ... */}
      </div>
    </FormProvider>
  );
}
```

### 2. 增强字段包装器

```tsx
import { EnhancedFieldWrapper } from "./EnhancedFormilyField";

// 使用增强的字段包装器
<Field
  name="fieldName"
  component={[YourComponent]}
  decorator={[EnhancedFieldWrapper]}
  title="Field Title"
  description="Field description"
/>
```

### 3. 手动添加通知

```tsx
import { useFormNotifications } from "./FormNotificationSystem";

export function CustomComponent() {
  const { addNotification } = useFormNotifications();
  
  const handleCustomAction = () => {
    addNotification({
      type: 'info',
      title: 'Custom Action',
      message: 'This is a custom notification',
      fieldPath: 'customField',
      autoHide: true,
      duration: 3000
    });
  };
  
  return (
    <button onClick={handleCustomAction}>
      Trigger Custom Notification
    </button>
  );
}
```

## 通知类型

### `value-changed` - 值变化
- **颜色**: 蓝色
- **图标**: Settings
- **触发**: 字段值被联动逻辑自动调整
- **显示**: 旧值 → 新值

### `options-changed` - 选项变化
- **颜色**: 琥珀色
- **图标**: Info
- **触发**: 字段可选项根据依赖变化
- **显示**: 新的选项数量

### `visibility-changed` - 可见性变化
- **颜色**: 紫色
- **图标**: Eye/EyeOff
- **触发**: 字段显示/隐藏状态变化
- **显示**: 当前可见性状态

### `validation-error` - 验证错误
- **颜色**: 红色
- **图标**: AlertCircle
- **触发**: 字段验证失败
- **显示**: 错误信息

### `info` - 信息提示
- **颜色**: 绿色
- **图标**: CheckCircle
- **触发**: 手动触发
- **显示**: 自定义信息

## 配置选项

### 通知配置

```tsx
interface FormNotification {
  id: string;                    // 自动生成
  type: NotificationType;        // 通知类型
  title: string;                 // 标题
  message: string;               // 消息内容
  fieldPath: string;             // 字段路径
  fieldTitle?: string;           // 字段标题
  timestamp: number;             // 时间戳
  autoHide?: boolean;            // 是否自动隐藏 (默认: true)
  duration?: number;             // 显示时长 (默认: 4000ms)
  details?: {                    // 详细信息
    oldValue?: unknown;
    newValue?: unknown;
    oldOptions?: OptionType[];
    newOptions?: OptionType[];
    wasVisible?: boolean;
    isVisible?: boolean;
  };
}
```

### 自定义样式

通知系统使用 Tailwind CSS 类，你可以通过修改组件来自定义样式：

```tsx
// 自定义通知样式
const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'value-changed':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'options-changed':
      return 'bg-amber-50 border-amber-200 text-amber-800';
    // ... 其他类型
  }
};
```

## 最佳实践

### 1. 合理使用通知
- 只在重要的变化时显示通知
- 避免过于频繁的通知干扰用户
- 为通知提供清晰的上下文信息

### 2. 性能优化
- 通知系统使用防抖机制避免过度触发
- 自动清理过期的通知
- 使用 React.memo 优化组件渲染

### 3. 用户体验
- 提供清晰的视觉反馈
- 使用适当的动画过渡
- 允许用户手动关闭通知

### 4. 可访问性
- 使用语义化的 HTML 结构
- 提供适当的 ARIA 标签
- 确保键盘导航支持

## 示例场景

### 联动字段
当用户选择 PCB 类型时，厚度选项会自动更新：

```tsx
thickness: {
  type: "string",
  title: "Board Thickness",
  "x-component": "TabSelect",
  "x-reactions": [
    {
      dependencies: ["layers", "outerCopperWeight"],
      fulfill: {
        state: {
          componentProps: "{{getThicknessOptions($deps)}}"
        }
      }
    }
  ]
}
```

### 条件显示
HDI 字段只在层数 >= 4 时显示：

```tsx
hdi: {
  type: "string",
  title: "HDI",
  "x-component": "TabSelect",
  "x-reactions": {
    dependencies: ["layers"],
    fulfill: {
      state: {
        visible: "{{$deps[0] >= 4}}"
      }
    }
  }
}
```

### 智能调整
当数量超过阈值时自动调整优先级：

```tsx
priority: {
  type: "string",
  title: "Priority",
  "x-reactions": {
    dependencies: ["quantity"],
    fulfill: {
      state: {
        value: "{{$deps[0] > 100 ? 'high' : 'normal'}}"
      }
    }
  }
}
```

## 故障排除

### 通知不显示
1. 确保 `FormNotificationContainer` 已添加到表单中
2. 检查 z-index 是否被其他元素覆盖
3. 验证 Formily 表单是否正确初始化

### 性能问题
1. 检查是否有过多的字段监听
2. 考虑使用 React.memo 优化组件
3. 调整防抖延迟时间

### 样式问题
1. 确保 Tailwind CSS 正确配置
2. 检查 framer-motion 依赖是否安装
3. 验证 CSS 类名是否正确

## 技术实现

### 核心原理
- 使用 Formily 的 `subscribe` API 监听表单变化
- 通过 `field.modified` 区分用户操作和系统调整
- 使用 Map 存储字段状态快照进行对比
- 利用 framer-motion 提供流畅的动画效果

### 依赖项
- `@formily/core` - Formily 核心库
- `@formily/react` - Formily React 绑定
- `framer-motion` - 动画库
- `lucide-react` - 图标库
- `tailwindcss` - 样式框架

这个通知系统为 Formily 表单提供了强大的用户体验增强，帮助用户更好地理解表单的动态行为和自动调整逻辑。 