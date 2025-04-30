import { NextResponse } from 'next/server';
import cities from '@/lib/data/cities.json';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const state = searchParams.get('state');
  const filtered = cities.filter((c: any) => c.country_code === country && c.state_code === state);
  return NextResponse.json(filtered.map((c: any) => c.name));
} 