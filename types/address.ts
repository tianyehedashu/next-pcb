export interface Address {
  name: string;         // 收件人姓名
  phone: string;        // 联系电话
  country: string;      // 国家
  province: string;     // 省/州
  city: string;         // 市
  district?: string;    // 区/县（可选）
  address: string;      // 详细地址
  zipCode?: string;     // 邮编（可选）
} 