import * as path from 'path';

export interface ExternalSubtitleFile {
  fileIndex: number;
  name: string;
  path: string;
  length: number;
  language: string;
  format: string; // 'srt' | 'vtt' | 'ass' | 'ssa' | 'sub'
  title: string;
}

const SUBTITLE_EXTS = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];

const LANG_CODE_MAP: Record<string, string> = {
  en: 'English',
  eng: 'English',
  ta: 'Tamil',
  tam: 'Tamil',
  te: 'Telugu',
  tel: 'Telugu',
  hi: 'Hindi',
  hin: 'Hindi',
  ml: 'Malayalam',
  mal: 'Malayalam',
  kn: 'Kannada',
  kan: 'Kannada',
  fr: 'French',
  fre: 'French',
  fra: 'French',
  es: 'Spanish',
  spa: 'Spanish',
  de: 'German',
  ger: 'German',
  deu: 'German',
  it: 'Italian',
  ita: 'Italian',
  ja: 'Japanese',
  jpn: 'Japanese',
  ko: 'Korean',
  kor: 'Korean',
  zh: 'Chinese',
  chi: 'Chinese',
  zho: 'Chinese',
  pt: 'Portuguese',
  por: 'Portuguese',
  ru: 'Russian',
  rus: 'Russian',
  ar: 'Arabic',
  ara: 'Arabic',
  nl: 'Dutch',
  dut: 'Dutch',
  sv: 'Swedish',
  swe: 'Swedish',
  pl: 'Polish',
  pol: 'Polish',
  tr: 'Turkish',
  tur: 'Turkish'
};

export function inferSubtitleLanguage(fileName: string): { language: string; title: string } {
  const base = path.basename(fileName, path.extname(fileName));
  const lower = base.toLowerCase();
  
  const isSDH = lower.includes('sdh') || lower.includes('hearing') || lower.includes('.hi.');
  const isForced = lower.includes('forced');

  // Check known words first
  let detectedLang = '';
  for (const [code, name] of Object.entries(LANG_CODE_MAP)) {
    // Match word boundaries or dot-separated tokens e.g. .eng. or Canadian.fre
    const regex = new RegExp(`(^|[._\\-\\s])${code}([._\\-\\s]|$)`, 'i');
    if (regex.test(base)) {
      detectedLang = name;
      break;
    }
  }

  // Check direct English names in string
  if (!detectedLang) {
    const commonNames = ['english', 'tamil', 'telugu', 'hindi', 'french', 'spanish', 'german', 'japanese', 'korean', 'chinese', 'canadian', 'italian', 'russian'];
    for (const c of commonNames) {
      if (lower.includes(c)) {
        detectedLang = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }
  }

  if (!detectedLang) {
    detectedLang = base.replace(/[._\\-]/g, ' ').trim();
  }

  let title = detectedLang;
  if (isSDH && !title.toLowerCase().includes('sdh')) {
    title += ' (SDH)';
  } else if (isForced && !title.toLowerCase().includes('forced')) {
    title += ' (Forced)';
  }

  return { language: detectedLang, title };
}

export function findTorrentExternalSubtitles(files: any[]): ExternalSubtitleFile[] {
  if (!files || !Array.isArray(files)) return [];

  const results: ExternalSubtitleFile[] = [];

  files.forEach((f, idx) => {
    const ext = path.extname(f.name || '').toLowerCase();
    if (SUBTITLE_EXTS.includes(ext)) {
      const { language, title } = inferSubtitleLanguage(f.name || '');
      results.push({
        fileIndex: idx,
        name: f.name,
        path: f.path || f.name,
        length: f.length || 0,
        language,
        format: ext.replace('.', ''),
        title
      });
    }
  });

  return results;
}

export function convertSubtitleToWebVTT(buffer: Buffer, format: string = 'srt'): string {
  let text = '';

  // 1. Detect UTF BOM
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    text = buffer.subarray(3).toString('utf8');
  } else if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    text = new TextDecoder('utf-16le').decode(buffer.subarray(2));
  } else if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    text = new TextDecoder('utf-16be').decode(buffer.subarray(2));
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      // Fallback to windows-1252 / latin1
      text = new TextDecoder('windows-1252').decode(buffer);
    }
  }

  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (text.startsWith('WEBVTT')) {
    return text;
  }

  // If ASS/SSA subtitle format
  if (format === 'ass' || format === 'ssa' || text.includes('[Events]') || text.includes('Dialogue:')) {
    return convertAssToWebVtt(text);
  }

  // Convert standard SRT timestamps: 00:00:00,000 --> 00:00:00,000 to .000
  const converted = text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return `WEBVTT\n\n${converted}`;
}

function convertAssToWebVtt(assText: string): string {
  const lines = assText.split('\n');
  const cues: string[] = [];
  let inEvents = false;
  let formatFields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '[Events]') {
      inEvents = true;
      continue;
    }
    if (inEvents) {
      if (trimmed.startsWith('Format:')) {
        formatFields = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
      } else if (trimmed.startsWith('Dialogue:')) {
        const parts = trimmed.substring(9).split(',');
        if (parts.length >= 9) {
          // Format is typically: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
          const startIndex = formatFields.indexOf('start') !== -1 ? formatFields.indexOf('start') : 1;
          const endIndex = formatFields.indexOf('end') !== -1 ? formatFields.indexOf('end') : 2;
          const textIndex = formatFields.indexOf('text') !== -1 ? formatFields.indexOf('text') : 9;

          const rawStart = parts[startIndex]?.trim() || '';
          const rawEnd = parts[endIndex]?.trim() || '';
          // Parts after textIndex may contain commas
          const textPart = parts.slice(textIndex).join(',').trim();

          const cleanText = textPart
            .replace(/\{[^}]+\}/g, '') // remove ASS style tags like {\b1}
            .replace(/\\N/g, '\n')     // replace ASS newlines
            .replace(/\\n/g, '\n')
            .trim();

          if (cleanText) {
            const vttStart = formatAssTimestamp(rawStart);
            const vttEnd = formatAssTimestamp(rawEnd);
            cues.push(`${vttStart} --> ${vttEnd}\n${cleanText}`);
          }
        }
      }
    }
  }

  if (cues.length === 0) {
    return `WEBVTT\n\n`;
  }

  return `WEBVTT\n\n${cues.join('\n\n')}`;
}

function formatAssTimestamp(ts: string): string {
  // ASS timestamp is H:MM:SS.CC (centiseconds)
  const match = ts.match(/^(\d+):(\d{2}):(\d{2})\.(\d{2})$/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    const s = match[3];
    const ms = (parseInt(match[4], 10) * 10).toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }
  return ts;
}
