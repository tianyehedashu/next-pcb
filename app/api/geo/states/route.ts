import { NextResponse } from 'next/server';
import states from '@/lib/data/states.json';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const filtered = states.filter((s: any) => s.country_code === country);
  return NextResponse.json(filtered.map((s: any) => ({ code: s.iso2, name: s.name, id: s.id })));
} 