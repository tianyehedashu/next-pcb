const fs = require('fs');
const path = require('path');

// 要优化的SVG文件列表
const svgFiles = [
  'public/logos/speedxpcb-modern-logo.svg',
  'public/logos/speedxpcb-icon-modern.svg',
  'public/logos/speedxpcb-navbar-with-slogan.svg',
  'public/logos/speedxpcb-logo-compact.svg'
];

// SVG优化函数
function optimizeSVG(content) {
  return content
    // 移除注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除多余的空白
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    // 优化数值精度
    .replace(/(\d+\.\d{2,})/g, (match) => parseFloat(match).toFixed(1))
    // 移除不必要的属性
    .replace(/\s+xmlns:xlink="[^"]*"/g, '')
    .replace(/\s+xml:space="[^"]*"/g, '')
    // 简化路径
    .replace(/([MLHVCSQTAZ])\s+/gi, '$1')
    .replace(/\s+([MLHVCSQTAZ])/gi, '$1')
    .replace(/,\s+/g, ',')
    .trim();
}

// 处理每个文件
svgFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const optimizedContent = optimizeSVG(originalContent);
      
      const originalSize = Buffer.byteLength(originalContent, 'utf8');
      const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      
      // 写回优化后的内容
      fs.writeFileSync(filePath, optimizedContent);
      
      console.log(`✅ ${path.basename(filePath)}:`);
      console.log(`   原始大小: ${originalSize} bytes`);
      console.log(`   优化后: ${optimizedSize} bytes`);
      console.log(`   压缩率: ${reduction}%\n`);
    } catch (error) {
      console.error(`❌ 优化 ${filePath} 失败:`, error.message);
    }
  } else {
    console.log(`⚠️  文件不存在: ${filePath}`);
  }
});

console.log('🎉 SVG优化完成！'); 