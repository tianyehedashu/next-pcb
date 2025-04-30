import { NextRequest, NextResponse } from 'next/server';
import states from '@/lib/data/states.json';

export interface State {
  id: number;
  name: string;
  state_code: string;
  country_code: string;
  country_id: number;
  country_name: string;
  type: string;
  latitude: string | null;
  longitude: string | null;
}

interface StateResponse {
  data: Partial<State>[];
  total: number;
  page: number;
  limit: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country')?.toUpperCase();
    const query = searchParams.get('q')?.toLowerCase() || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    let filteredStates = (states as unknown as State[]).filter(
      state => state.country_code === countryCode
    );

    // 应用搜索过滤
    if (query) {
      filteredStates = filteredStates.filter(state => 
        state.name.toLowerCase().includes(query) ||
        state.state_code.toLowerCase().includes(query)
      );
    }

    // 计算分页
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedStates = filteredStates.slice(start, end);

    const response: StateResponse = {
      data: paginatedStates.map(state => ({
        id: state.id,
        name: state.name,
        state_code: state.state_code,
        country_code: state.country_code,
        country_id: state.country_id,
        country_name: state.country_name,
        type: state.type,
        latitude: state.latitude,
        longitude: state.longitude
      })),
      total: filteredStates.length,
      page,
      limit
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in states API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
} 