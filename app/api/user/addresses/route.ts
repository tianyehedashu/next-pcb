import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkUserAuth } from '@/lib/auth-utils';

export async function GET() {
  // Check user authentication using official docs pattern
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const supabase = await createClient();

    // RLS会自动过滤，只返回当前用户的地址
    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }

    // 转换字段名以保持前端兼容性
    const formattedAddresses = addresses.map(addr => ({
      id: addr.id.toString(),
      label: addr.label || '',
      country: addr.country,
      countryName: addr.country_name || '',
      state: addr.state || '',
      stateName: addr.state_name || '',
      city: addr.city || '',
      cityName: addr.city_name || '',
      address: addr.address,
      zipCode: addr.zip_code || '',
      contactName: addr.contact_name,
      phone: addr.phone,
      courier: addr.courier || '',
      courierName: addr.courier_name || '',
      isDefault: addr.is_default
    }));

    return NextResponse.json({ addresses: formattedAddresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check user authentication using official docs pattern
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const supabase = await createClient();

    const body = await request.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address data is required' }, { status: 400 });
    }

    // 如果设置为默认地址，先将其他地址的 is_default 设为 false
    if (address.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }
    
    // 转换字段名适配数据库结构
    const dbAddress = {
      user_id: user.id,
      label: address.label || null,
      contact_name: address.contactName,
      phone: address.phone,
      country: address.country,
      country_name: address.countryName || null,
      state: address.state || null,
      state_name: address.stateName || null,
      city: address.city || null,
      city_name: address.cityName || null,
      address: address.address,
      zip_code: address.zipCode || null,
      courier: address.courier || null,
      courier_name: address.courierName || null,
      is_default: address.isDefault || false
    };
    
    let result;
    
    // 更新现有地址或创建新地址
    if (address.id) {
      const { data, error } = await supabase
        .from('user_addresses')
        .update(dbAddress)
        .eq('id', address.id)
        .eq('user_id', user.id) // RLS会处理，但显式检查更安全
        .select()
        .single();
      
      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from('user_addresses')
        .insert([dbAddress])
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
      }
      result = data;
    }
    
    // 转换字段名返回给前端
    const savedAddress = {
      id: result.id.toString(),
      label: result.label || '',
      country: result.country,
      countryName: result.country_name || '',
      state: result.state || '',
      stateName: result.state_name || '',
      city: result.city || '',
      cityName: result.city_name || '',
      address: result.address,
      zipCode: result.zip_code || '',
      contactName: result.contact_name,
      phone: result.phone,
      courier: result.courier || '',
      courierName: result.courier_name || '',
      isDefault: result.is_default
    };
    
    return NextResponse.json({ address: savedAddress });
  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Check user authentication using official docs pattern
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id); // RLS会处理，但显式检查更安全
    
    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Check user authentication using official docs pattern
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const supabase = await createClient();

    const body = await request.json();
    const { addressId, action } = body;
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    if (action === 'setDefault') {
      // 先将所有地址设为非默认
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      // 设置指定地址为默认
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to set default address' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 