// Converts timestamp formats like 00:00:00,000 (SRT) to 00:00:00.000 (VTT)
export function parseSrtTimestamp(timestamp: string): string {
  return timestamp.replace(',', '.');
}

export function srtToVtt(srtContent: string): string {
  if (!srtContent) return '';

  let vtt = 'WEBVTT\n\n';
  const lines = srtContent.replace(/\r\n/g, '\n').split('\n');

  let isTimestampLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a sequence number (digits only) and skip it for VTT
    if (/^\d+$/.test(line) && lines[i + 1] && lines[i + 1].includes('-->')) {
      continue;
    }

    if (line.includes('-->')) {
      const parts = line.split(' --> ');
      if (parts.length === 2) {
        vtt += `${parseSrtTimestamp(parts[0])} --> ${parseSrtTimestamp(parts[1])}\n`;
        isTimestampLine = true;
        continue;
      }
    }

    vtt += line + '\n';
  }

  return vtt;
}

export function timeShiftVtt(vttContent: string, offsetSeconds: number): string {
  if (offsetSeconds === 0) return vttContent;

  const timeToMs = (time: string) => {
    const parts = time.split(':');
    const secParts = parts[2].split('.');
    return (
      parseInt(parts[0]) * 3600000 +
      parseInt(parts[1]) * 60000 +
      parseInt(secParts[0]) * 1000 +
      parseInt(secParts[1])
    );
  };

  const msToTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
    const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const mil = (ms % 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s}.${mil}`;
  };

  const lines = vttContent.split('\n');
  const offsetMs = Math.round(offsetSeconds * 1000);

  return lines.map(line => {
    if (line.includes('-->')) {
      const parts = line.split(' --> ');
      if (parts.length === 2) {
        const startMs = timeToMs(parts[0]);
        const endMs = timeToMs(parts[1]);
        return `${msToTime(startMs + offsetMs)} --> ${msToTime(endMs + offsetMs)}`;
      }
    }
    return line;
  }).join('\n');
}
