import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Normalisasi nomor lagu agar sufiks huruf (A-C) konsisten uppercase
function normalizeSongId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/^(\d+)([A-Ca-c])?$/);
  if (!match) return raw;
  const [, digits, suffix] = match;
  return suffix ? `${digits}${suffix.toUpperCase()}` : digits;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 1) Normalisasi case untuk /songs/<book> dan /songs/<book>/<num>
  const mSongs = pathname.match(/^\/songs\/(BE|BN|KJ|be|bn|kj)(?:\/(\d+[A-Ca-c]?))?\/?$/);
  if (mSongs) {
    const book = mSongs[1].toLowerCase();
    const num = normalizeSongId(mSongs[2]);
    const canonical = num ? `/songs/${book}/${num}` : `/songs/${book}`;
    if (pathname !== canonical) {
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // 2) Short alias: /<book> dan /<book>/<num> -> redirect ke /songs/<book>[>/<num>]
  const mShort = pathname.match(/^\/(BE|BN|KJ|be|bn|kj)(?:\/(\d+[A-Ca-c]?))?\/?$/);
  if (mShort) {
    const book = mShort[1].toLowerCase();
    const num = normalizeSongId(mShort[2]);
    url.pathname = num ? `/songs/${book}/${num}` : `/songs/${book}`;
    return NextResponse.redirect(url, 308);
  }

  // 3) Compact alias: /be57, /BN288A -> redirect ke /songs/<book>/<num>
  const mCompact = pathname.match(/^\/(BE|BN|KJ|be|bn|kj)(\d+[A-Ca-c]?)\/?$/);
  if (mCompact) {
    const book = mCompact[1].toLowerCase();
    const num = normalizeSongId(mCompact[2]);
    if (!num) return NextResponse.next();
    url.pathname = `/songs/${book}/${num}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Batasi matcher utk pola yang relevan
  matcher: [
    '/songs/:path*',
    '/(be|BE)', '/(bn|BN)', '/(kj|KJ)',
    '/(be|BE)/:path*', '/(bn|BN)/:path*', '/(kj|KJ)/:path*',
    '/((?:be|BE|bn|BN|kj|KJ)\\d+(?:[A-Ca-c])?)',
  ],
};
