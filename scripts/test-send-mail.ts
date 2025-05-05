import fetch from 'node-fetch';

async function testSendMail() {
  const res = await fetch('http://localhost:3000/api/notify-customer-service', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: '592395647@qq.com',
      subject: '测试邮件',
      html: '<p>这是一封测试邮件，来自本地API Route。</p>'
    })
  });
  const data = await res.json();
  console.log('接口响应:', data);
}

testSendMail().catch(console.error); 