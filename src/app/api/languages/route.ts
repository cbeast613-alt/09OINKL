// app/api/languages/route.ts
import { NextResponse } from 'next/server';
import { LANG_NAMES } from '@/app/api/translate/route';

export async function GET() {
  // Return the full language map; frontend will use it directly
  return NextResponse.json(LANG_NAMES);
}
