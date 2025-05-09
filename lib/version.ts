// 使用 Git 提交哈希作为版本号
export const APP_VERSION = process.env.NEXT_PUBLIC_GIT_SHA || '1.0.0'; 