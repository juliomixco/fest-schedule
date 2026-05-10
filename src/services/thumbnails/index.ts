import { getCachedThumbnail, cacheThumbnail } from '../../db';

const LASTFM_KEY = import.meta.env.VITE_LASTFM_API_KEY;

const FALLBACK_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="12" fill="%23555"/><ellipse cx="32" cy="50" rx="20" ry="14" fill="%23555"/></svg>';

async function fetchMusicBrainzThumbnail(artistName: string): Promise<string | null> {
  try {
    const searchUrl = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(artistName)}&fmt=json&limit=1`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'FestSchedule/1.0 (https://github.com/festschedule)' } });
    if (!res.ok) return null;
    const data = await res.json();
    const mbid = data.artists?.[0]?.id;
    if (!mbid) return null;

    // Try to get artist image from the CAA (no images for artists, skip)
    // MusicBrainz doesn't serve artist photos — skip to Last.fm
    return null;
  } catch {
    return null;
  }
}

async function fetchLastFmThumbnail(artistName: string): Promise<string | null> {
  if (!LASTFM_KEY) return null;
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const images: { '#text': string; size: string }[] = data.artist?.image ?? [];
    const large = images.find((img) => img.size === 'large' || img.size === 'extralarge');
    const src = large?.['#text'] ?? images[images.length - 1]?.['#text'];
    return src && !src.includes('2a96cbd8b46e442fc41c2b86b821562f') ? src : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a thumbnail URL for an act.
 * Priority: cached → scraped → Last.fm → fallback SVG
 */
export async function resolveThumbnail(actId: string, artistName: string, scrapedUrl?: string): Promise<string> {
  // 1. Cache hit
  const cached = await getCachedThumbnail(actId);
  if (cached) return cached;

  // 2. Scraped from festival page
  if (scrapedUrl) {
    await cacheThumbnail(actId, scrapedUrl);
    return scrapedUrl;
  }

  // 3. Last.fm
  const lastfm = await fetchLastFmThumbnail(artistName);
  if (lastfm) {
    await cacheThumbnail(actId, lastfm);
    return lastfm;
  }

  // 4. MusicBrainz (currently returns null for artist photos, left for future extension)
  const mb = await fetchMusicBrainzThumbnail(artistName);
  if (mb) {
    await cacheThumbnail(actId, mb);
    return mb;
  }

  return FALLBACK_SVG;
}
