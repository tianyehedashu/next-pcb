import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // 使用用户token创建客户端（启用RLS）
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

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
      state: addr.state || '',
      city: addr.city || '',
      address: addr.address,
      zipCode: addr.zip_code || '',
      contactName: addr.contact_name,
      phone: addr.phone,
      courier: addr.courier || '',
      isDefault: addr.is_default
    }));

    return NextResponse.json({ addresses: formattedAddresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

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
      state: address.state || null,
      city: address.city || null,
      address: address.address,
      zip_code: address.zipCode || null,
      courier: address.courier || null,
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
      state: result.state || '',
      city: result.city || '',
      address: result.address,
      zipCode: result.zip_code || '',
      contactName: result.contact_name,
      phone: result.phone,
      courier: result.courier || '',
      isDefault: result.is_default
    };
    
    return NextResponse.json({ address: savedAddress });
  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

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
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

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