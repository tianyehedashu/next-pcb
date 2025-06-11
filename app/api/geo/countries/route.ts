import { NextRequest, NextResponse } from 'next/server';
// import countries from '@/lib/data/countries.json';

export interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  capital: string;
  currency: string;
  region: string;
  subregion: string;
  emoji: string;
}

interface CountryResponse {
  data: Partial<Country>[];
  total: number;
  page: number;
  limit: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const region = searchParams.get('region')?.toLowerCase();
    
    let filteredCountries = countries as Country[];

    // Apply search filter
    if (query) {
      filteredCountries = filteredCountries.filter(country => 
        country.name.toLowerCase().includes(query) ||
        country.iso2.toLowerCase().includes(query) ||
        country.iso3.toLowerCase().includes(query)
      );
    }

    // Apply region filter
    if (region) {
      filteredCountries = filteredCountries.filter(country =>
        country.region.toLowerCase() === region
      );
    }

    // Calculate pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCountries = filteredCountries.slice(start, end);

    const response: CountryResponse = {
      data: paginatedCountries.map(country => ({
        id: country.id,
        name: country.name,
        iso2: country.iso2,
        iso3: country.iso3,
        phonecode: country.phonecode,
        capital: country.capital,
        currency: country.currency,
        region: country.region,
        subregion: country.subregion,
        emoji: country.emoji
      })),
      total: filteredCountries.length,
      page,
      limit
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in countries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
} 