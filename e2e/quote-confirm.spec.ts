import { test, expect } from '@playwright/test';

test.describe('Quote Confirm Page', () => {
  test('用户可以完整下单流程', async ({ page }) => {
    // 1. 打开确认页（请根据实际路由调整）
    await page.goto('http://localhost:3000/quote/confirm');

    // 2. 上传 PCB 文件（假设有 data-testid="file-upload"）
    const fileInput = await page.getByTestId('file-upload');
    await fileInput.setInputFiles('e2e/testfile.zip');

    // 3. 选择国家（如用 react-select 需调整选择方式）
    // await page.getByLabel('Country').click();
    // await page.getByText('United States').click();

    // 4. 填写省/州、城市、邮编、电话、邮箱、详细地址
    await page.getByPlaceholder('Enter zip/postal code').fill('94105');
    await page.getByPlaceholder('Enter phone number').fill('123456789');
    await page.getByPlaceholder('Enter email address').fill('test@example.com');
    await page.getByPlaceholder('Enter your detailed address').fill('123 Main St');

    // 5. 选择快递
    await page.selectOption('select', { label: 'DHL Express' });

    // 6. 选择报关方式
    // await page.getByLabel('Declaration Method').click();
    // await page.getByText('Self-declare').click();

    // 7. 填写申报金额
    await page.getByPlaceholder('Enter declared value').fill('100');

    // 8. 点击下单
    await page.getByText('Place Order').click();

    // 9. 检查跳转到订单详情页（假设跳转到 /quote/orders/:id）
    await expect(page).toHaveURL(/\/quote\/orders\//);
    // 可根据实际页面内容断言
    // await expect(page.getByText('Order Details')).toBeVisible();
  });
}); 