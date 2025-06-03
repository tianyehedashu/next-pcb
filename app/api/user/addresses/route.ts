import { NextRequest, NextResponse } from 'next/server';

interface Address {
  id: string;
  label: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  contactName: string;
  phone: string;
  courier: string;
  isDefault: boolean;
}

// 模拟数据库存储
const mockAddresses = new Map<string, Address[]>();

// 初始化测试数据
mockAddresses.set('test-user-123', [
  {
    id: '1',
    label: 'Home',
    country: 'US',
    state: 'CA',
    city: 'San Francisco',
    address: '123 Main St, Apt 4B',
    zipCode: '94102',
    contactName: 'John Doe',
    phone: '+1-555-0123',
    courier: 'dhl',
    isDefault: true
  },
  {
    id: '2',
    label: 'Office',
    country: 'US',
    state: 'NY',
    city: 'New York',
    address: '456 Business Ave, Suite 200',
    zipCode: '10001',
    contactName: 'John Doe',
    phone: '+1-555-0456',
    courier: 'fedex',
    isDefault: false
  }
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const addresses = mockAddresses.get(userId) || [];
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, address } = body;
    
    if (!userId || !address) {
      return NextResponse.json({ error: 'User ID and address are required' }, { status: 400 });
    }

    const userAddresses = mockAddresses.get(userId) || [];
    
    // 如果设置为默认地址，将其他地址的 isDefault 设为 false
    if (address.isDefault) {
      userAddresses.forEach(addr => addr.isDefault = false);
    }
    
    // 添加新地址或更新现有地址
    if (address.id) {
      const index = userAddresses.findIndex(addr => addr.id === address.id);
      if (index !== -1) {
        userAddresses[index] = address;
      }
    } else {
      address.id = Date.now().toString();
      userAddresses.push(address);
    }
    
    mockAddresses.set(userId, userAddresses);
    
    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const addressId = searchParams.get('addressId');
    
    if (!userId || !addressId) {
      return NextResponse.json({ error: 'User ID and address ID are required' }, { status: 400 });
    }

    const userAddresses = mockAddresses.get(userId) || [];
    const filteredAddresses = userAddresses.filter(addr => addr.id !== addressId);
    
    mockAddresses.set(userId, filteredAddresses);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, addressId, action } = body;
    
    if (!userId || !addressId) {
      return NextResponse.json({ error: 'User ID and address ID are required' }, { status: 400 });
    }

    const userAddresses = mockAddresses.get(userId) || [];
    
    if (action === 'setDefault') {
      // 将所有地址的 isDefault 设为 false，然后设置指定地址为默认
      userAddresses.forEach(addr => {
        addr.isDefault = addr.id === addressId;
      });
      
      mockAddresses.set(userId, userAddresses);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 