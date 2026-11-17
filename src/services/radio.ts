import { ICECAST_MOUNT, METADATA_URL } from '../config/radio';
import { NowPlaying } from '../types';

const REQUEST_TIMEOUT_MS = 8_000;

/** Делит строку «Исполнитель - Трек» на части. */
function splitTitle(raw: string): NowPlaying | null {
  const text = raw.trim();
  if (!text) return null;
  const separatorIndex = text.indexOf(' - ');
  if (separatorIndex === -1) return { artist: '', track: text };
  return {
    artist: text.slice(0, separatorIndex).trim(),
    track: text.slice(separatorIndex + 3).trim(),
  };
}

interface IcecastSource {
  listenurl?: string;
  title?: string;
  artist?: string;
}

/**
 * Поддерживает два формата:
 *  • Radio.co:  { current_track: { title: "Artist - Track" } }
 *  • Icecast:   { icestats: { source: {...} | [...] } }  (status-json.xsl)
 */
export function parseMetadata(json: unknown): NowPlaying | null {
  const data = json as Record<string, any> | null;
  if (!data || typeof data !== 'object') return null;

  // Radio.co
  const radioCoTitle = data.current_track?.title;
  if (typeof radioCoTitle === 'string') return splitTitle(radioCoTitle);

  // Icecast
  const rawSource = data.icestats?.source;
  if (rawSource) {
    const sources: IcecastSource[] = Array.isArray(rawSource) ? rawSource : [rawSource];
    const source =
      (ICECAST_MOUNT && sources.find((s) => s.listenurl?.endsWith(ICECAST_MOUNT))) ||
      sources.find((s) => s.title) ||
      sources[0];
    if (!source) return null;
    if (source.artist && source.title) {
      return { artist: String(source.artist), track: String(source.title) };
    }
    return source.title ? splitTitle(String(source.title)) : null;
  }

  return null;
}

export async function fetchNowPlaying(): Promise<NowPlaying | null> {
  if (!METADATA_URL) {
    throw new Error('METADATA_URL is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const separator = METADATA_URL.includes('?') ? '&' : '?';
    // cache-bust: некоторые CDN отдают устаревший JSON
    const response = await fetch(`${METADATA_URL}${separator}_=${Date.now()}`, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseMetadata(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
