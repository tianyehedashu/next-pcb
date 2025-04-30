import { NextResponse } from 'next/server';
import countries from '@/lib/data/countries.json';

export async function GET() {
  return NextResponse.json(
    countries.map((c: any) => ({ code: c.iso2, name: c.name }))
  );
} 