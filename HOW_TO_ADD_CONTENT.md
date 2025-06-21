# 如何添加内容到PCB知识中心

## 问题说明

我们成功创建了10篇高质量的PCB技术文章，但由于API需要管理员认证，内容没有成功上传到数据库。

## 解决方案

### 方法1：通过管理员界面手动添加（推荐）

1. **访问管理员登录页面**
   ```
   http://localhost:3000/auth
   ```

2. **登录管理员账户**
   - 如果没有管理员账户，需要先创建一个
   - 确保账户的role设置为'admin'

3. **访问内容创建页面**
   ```
   http://localhost:3000/admin/content/new
   ```

4. **手动添加以下内容**

#### 第一篇：PCB设计最佳实践指南
- **标题**: Complete Guide to PCB Design Best Practices
- **Slug**: pcb-design-best-practices-guide
- **类型**: help
- **状态**: published
- **是否推荐**: 是
- **内容**: [见下方完整内容]

#### 第二篇：PCB制造FAQ
- **标题**: Frequently Asked Questions - PCB Manufacturing
- **Slug**: pcb-manufacturing-faq
- **类型**: help
- **状态**: published
- **是否推荐**: 是
- **内容**: [见下方完整内容]

### 方法2：直接数据库插入

如果你有Supabase的服务角色密钥，可以直接插入数据库：

1. **访问Supabase Dashboard**
2. **进入Table Editor**
3. **选择content_pages表**
4. **手动插入记录**

### 方法3：修复API认证

1. **创建管理员用户**
2. **获取认证token**
3. **在API请求中包含Authorization header**

## 完整内容列表

我已经准备了以下10篇文章的完整内容：

1. **Complete Guide to PCB Design Best Practices** (help)
2. **Understanding PCB Manufacturing Process: From Design to Delivery** (guide)
3. **High-Speed PCB Design: Signal Integrity and EMI Control** (technical)
4. **PCB Materials Guide: Choosing the Right Substrate for Your Design** (guide)
5. **SMT Assembly Process: Surface Mount Technology Best Practices** (guide)
6. **How to Submit Your PCB Order: Complete Step-by-Step Guide** (help)
7. **PCB Design File Requirements and Formats** (help)
8. **Frequently Asked Questions - PCB Manufacturing** (help)
9. **5G Technology Impact on PCB Design and Manufacturing** (news)
10. **Automotive Electronics PCB Requirements and Standards** (technical)

## 示例内容

### 文章1：PCB设计最佳实践指南

```markdown
# Complete Guide to PCB Design Best Practices

Designing a printed circuit board (PCB) requires careful consideration of multiple factors to ensure optimal performance, manufacturability, and reliability. This comprehensive guide covers essential best practices for both novice and experienced designers.

## 1. Component Placement Strategy

### Power Components First
- Place power management components (regulators, capacitors) close to power entry points
- Keep switching regulators away from sensitive analog circuits
- Use proper thermal management for high-power components

### Signal Flow Consideration
- Arrange components to follow natural signal flow
- Minimize signal path lengths for high-frequency circuits
- Group related functional blocks together

### Accessibility for Testing
- Ensure test points are accessible
- Leave space for probe connections
- Consider manufacturing and assembly constraints

## 2. Routing Techniques

### Layer Stack-up Planning
```
Layer 1: Component placement and routing
Layer 2: Ground plane
Layer 3: Power plane
Layer 4: Signal routing
```

### Signal Integrity
- **Differential Pairs**: Maintain consistent spacing and length matching
- **Clock Signals**: Use dedicated layers and proper termination
- **High-Speed Signals**: Implement controlled impedance design

### EMI/EMC Considerations
- Use ground planes to reduce electromagnetic interference
- Implement proper shielding techniques
- Follow 3W rule for trace spacing

## 3. Power Distribution Network (PDN)

### Decoupling Strategy
- Place decoupling capacitors as close as possible to IC power pins
- Use multiple capacitor values for different frequency ranges:
  - 0.1µF for general purpose
  - 1µF for low frequency
  - 10µF+ for bulk storage

### Power Plane Design
- Minimize power plane splits
- Use adequate copper width for current carrying capacity
- Consider voltage drop calculations

## Ready to Implement These Practices?

Our expert team at SpeedXPCB can help you apply these best practices to your next project. Contact us for professional PCB design review and manufacturing services.
```

**Meta信息：**
- **Excerpt**: Master the art of PCB design with our comprehensive guide covering component placement, routing techniques, power distribution, thermal management, and manufacturing considerations.
- **Meta Title**: PCB Design Best Practices Guide - Professional Tips & Techniques
- **Meta Description**: Learn essential PCB design best practices including component placement, routing strategies, signal integrity, and manufacturing considerations for professional results.

## 下一步

1. 选择上述方法之一来添加内容
2. 确保所有内容都设置为"published"状态
3. 将重要文章标记为"featured"
4. 验证内容在前端页面正确显示

完成后，你的PCB知识中心将拥有丰富的专业内容，大大提升网站的价值和用户体验！ 