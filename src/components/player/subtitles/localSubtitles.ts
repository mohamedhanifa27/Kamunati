"use client";

export interface SubtitleCue {
  id?: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const secParts = parts[2].replace(',', '.');
    const seconds = parseFloat(secParts);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const secParts = parts[1].replace(',', '.');
    const seconds = parseFloat(secParts);
    return minutes * 60 + seconds;
  }
  return 0;
}

export function parseSubtitleTextToCues(rawText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if ASS/SSA
  if (normalized.includes('[Events]') || normalized.includes('Dialogue:')) {
    return parseAssToCues(normalized);
  }

  // Split into blocks by double newlines
  const blocks = normalized.split(/\n\s*\n/);
  const timeRegex = /((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{2,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{2,3})/;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (timeRegex.test(lines[i])) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx !== -1) {
      const match = lines[timeLineIdx].match(timeRegex);
      if (match) {
        const start = parseTimestampToSeconds(match[1]);
        const end = parseTimestampToSeconds(match[2]);
        const text = lines.slice(timeLineIdx + 1).join('\n').trim();
        if (text && end > start) {
          cues.push({ start, end, text });
        }
      }
    }
  }

  return cues;
}

function parseAssToCues(assText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = assText.split('\n');
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
          const startIndex = formatFields.indexOf('start') !== -1 ? formatFields.indexOf('start') : 1;
          const endIndex = formatFields.indexOf('end') !== -1 ? formatFields.indexOf('end') : 2;
          const textIndex = formatFields.indexOf('text') !== -1 ? formatFields.indexOf('text') : 9;

          const rawStart = parts[startIndex]?.trim() || '';
          const rawEnd = parts[endIndex]?.trim() || '';
          const textPart = parts.slice(textIndex).join(',').trim();

          const cleanText = textPart
            .replace(/\{[^}]+\}/g, '')
            .replace(/\\N/g, '\n')
            .replace(/\\n/g, '\n')
            .trim();

          if (cleanText) {
            const start = parseAssTimestampToSeconds(rawStart);
            const end = parseAssTimestampToSeconds(rawEnd);
            if (end > start) {
              cues.push({ start, end, text: cleanText });
            }
          }
        }
      }
    }
  }

  return cues;
}

function parseAssTimestampToSeconds(ts: string): number {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export function readLocalSubtitleFile(file: File): Promise<{ cues: SubtitleCue[]; label: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuf = e.target?.result as ArrayBuffer;
        if (!arrayBuf) {
          return resolve({ cues: [], label: file.name });
        }
        const bytes = new Uint8Array(arrayBuf);
        let text = '';

        if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          text = new TextDecoder('utf-8').decode(bytes.subarray(3));
        } else if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          text = new TextDecoder('utf-16le').decode(bytes.subarray(2));
        } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
          text = new TextDecoder('utf-16be').decode(bytes.subarray(2));
        } else {
          try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          } catch {
            text = new TextDecoder('windows-1252').decode(bytes);
          }
        }

        const cues = parseSubtitleTextToCues(text);
        resolve({ cues, label: file.name });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
