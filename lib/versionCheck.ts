import { APP_VERSION } from './version';

export const checkVersion = () => {
  const storedVersion = localStorage.getItem('app_version');
  
  if (storedVersion !== APP_VERSION) {
    // 版本不一致，清除缓存
    localStorage.clear();
    sessionStorage.clear();
    
    // 存储新版本号
    localStorage.setItem('app_version', APP_VERSION);
    
    // 刷新页面
    window.location.reload();
  }
}; 