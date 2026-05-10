import { getCachedThumbnail, cacheThumbnail } from "../../db";

const FALLBACK_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="12" fill="%23555"/><ellipse cx="32" cy="50" rx="20" ry="14" fill="%23555"/></svg>';

async function fetchWikipediaThumbnail(
  artistName: string,
): Promise<string | null> {
  try {
    // Wikipedia page titles use underscores; try the artist name directly
    const title = artistName.trim().replace(/ /g, "_");
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.thumbnail?.source as string) ?? null;
  } catch {
    return null;
  }
}

async function fetchItunesThumbnail(
  artistName: string,
): Promise<string | null> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const album = data.results?.[0];
    // artworkUrl100 → bump to 400x400
    const src: string | undefined = album?.artworkUrl100;
    return src ? src.replace("100x100bb", "400x400bb") : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a thumbnail URL for an act.
 * Priority: cached → scraped → Last.fm → fallback SVG
 */
export async function resolveThumbnail(
  actId: string,
  artistName: string,
  scrapedUrl?: string,
): Promise<string> {
  // 1. Cache hit
  const cached = await getCachedThumbnail(actId);
  if (cached) return cached;

  // 2. Scraped from festival page
  if (scrapedUrl) {
    await cacheThumbnail(actId, scrapedUrl);
    return scrapedUrl;
  }

  // 3. Wikipedia (free, no auth, artist photo when available)
  const wiki = await fetchWikipediaThumbnail(artistName);
  if (wiki) {
    await cacheThumbnail(actId, wiki);
    return wiki;
  }

  // 4. iTunes album art fallback
  const itunes = await fetchItunesThumbnail(artistName);
  if (itunes) {
    await cacheThumbnail(actId, itunes);
    return itunes;
  }

  return FALLBACK_SVG;
}
