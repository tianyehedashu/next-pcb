# Zustand Persist 中间件使用指南

## 推荐版本

为了获得最佳的 persist 中间件支持，推荐使用以下版本：

```json
{
  "zustand": "^4.3.9"
}
```

## 安装命令

```bash
pnpm add zustand@4.3.9
```

## 使用示例

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MyStore {
  formData: any;
  updateFormData: (data: any) => void;
}

const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      formData: {},
      updateFormData: (data) => set({ formData: data }),
    }),
    {
      name: 'my-storage',
      partialize: (state) => ({ formData: state.formData }),
    }
  )
);
```

## 当前项目状态

当前项目使用的是不带 persist 的简单 store，避免了类型兼容性问题。如果需要数据持久化，可以：

1. 降级到推荐版本 `zustand@4.3.9`
2. 或者使用其他持久化方案（如 localStorage 手动管理）
3. 或者等待 Zustand 5.x 版本的类型问题修复

## 类型问题说明

Zustand 5.x 版本在中间件类型推断方面有一些变化，可能导致 TypeScript 编译错误。4.3.9 版本是最后一个稳定支持 persist 中间件的版本。 