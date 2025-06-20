import https from 'https';
import fs from 'fs';

// Supabase配置
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ';

console.log('🚀 直接通过Supabase API创建CMS表...');

// 读取SQL内容
const sqlContent = fs.readFileSync('lib/data/migrations/20241201_add_content_management.sql', 'utf8');

console.log('📖 SQL文件长度:', sqlContent.length, '字符');

// 准备API请求
const postData = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'vwhrmcwmmaslyieqgiav.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'apikey': ACCESS_TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Prefer': 'return=minimal'
  }
};

console.log('📡 发送API请求...');

const req = https.request(options, (res) => {
  console.log('📊 状态码:', res.statusCode);
  console.log('📋 响应头:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📄 响应内容:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ CMS表创建成功!');
    } else {
      console.log('❌ 创建失败，状态码:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求错误:', e.message);
  
  // 如果RPC失败，尝试其他方法
  console.log('🔄 尝试备用方案...');
  console.log('请手动在Supabase控制台执行以下SQL:');
  console.log('=' * 50);
  console.log(sqlContent);
  console.log('=' * 50);
});

req.write(postData);
req.end(); 