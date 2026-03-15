import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function BriefOGImage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const syneFont = await readFile(
    path.join(process.cwd(), 'app/fonts/Syne-Bold.woff')
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('daily_briefs')
    .select('title, date')
    .eq('date', date)
    .maybeSingle();

  const title = data?.title ?? 'Today\'s Tech News';
  const dateStr = data?.date ?? date;

  const d = new Date(dateStr + 'T00:00:00Z');
  const formattedDate = d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).toUpperCase();

  return new ImageResponse(
    (
      <div style={{ background: '#0a0a0f', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', position: 'relative' }}>
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none" style={{ marginBottom: '32px' }}>
          <path d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z" fill="#00d4aa"/>
          <path d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
          <path d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26" stroke="#00d4aa" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25"/>
        </svg>
        <div style={{ fontFamily: 'Syne', fontSize: '48px', fontWeight: 700, color: '#ffffff', textAlign: 'center', marginBottom: '16px', lineHeight: 1.2, maxWidth: '100%' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 400, color: '#71717a', marginBottom: '24px' }}>
          {formattedDate}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'Syne', fontSize: '28px', fontWeight: 700, letterSpacing: '-1px' }}>
          <span style={{ color: '#ffffff' }}>noisebrief</span>
          <span style={{ color: '#00d4aa' }}>.</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Syne', data: syneFont, style: 'normal', weight: 700 }],
    }
  );
}
