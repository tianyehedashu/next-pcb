import { NextRequest, NextResponse } from 'next/server';
import cities from '@/lib/data/cities.json';

export interface City {
  id: number;
  name: string;
  code: string;
  country_code: string;
  state_code: string;
  type: string;
  latitude: string;
  longitude: string;
  population: number;
}

interface CityResponse {
  data: Partial<City>[];
  total: number;
  page: number;
  limit: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country')?.toUpperCase();
    const stateCode = searchParams.get('state')?.toUpperCase();
    const query = searchParams.get('q')?.toLowerCase() || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!countryCode || !stateCode) {
      return NextResponse.json(
        { error: 'Both country code and state code are required' },
        { status: 400 }
      );
    }

    let filteredCities = (cities as City[]).filter(
      city => 
        city.country_code === countryCode &&
        city.state_code === stateCode
    );

    // 应用搜索过滤
    if (query) {
      filteredCities = filteredCities.filter(city => 
        city.name.toLowerCase().includes(query) ||
        city.code.toLowerCase().includes(query)
      );
    }

    // 按人口排序（可选）
    filteredCities.sort((a, b) => (b.population || 0) - (a.population || 0));

    // 计算分页
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCities = filteredCities.slice(start, end);

    const response: CityResponse = {
      data: paginatedCities.map(city => ({
        id: city.id,
        name: city.name,
        code: city.code,
        country_code: city.country_code,
        state_code: city.state_code,
        type: city.type,
        latitude: city.latitude,
        longitude: city.longitude,
        population: city.population
      })),
      total: filteredCities.length,
      page,
      limit
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in cities API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
} 