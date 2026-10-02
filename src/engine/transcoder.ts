import ffmpeg from 'fluent-ffmpeg';
import { FastifyReply } from 'fastify';

export function needsTranscoding(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  // Simplified logic for example; could inspect streams dynamically using ffprobe
  return ['.mkv', '.avi', '.wmv'].includes(ext);
}

export function streamTranscoded(inputStream: NodeJS.ReadableStream, reply: FastifyReply) {
  reply.header('Content-Type', 'video/mp4');
  // Cannot know exact length after transcoding, use chunked transfer encoding
  reply.header('Transfer-Encoding', 'chunked');

  const command = ffmpeg()
    .input(inputStream)
    .videoCodec('copy') // Try to copy video stream
    .audioCodec('aac')
    .audioBitrate('192k')
    .outputFormat('mp4')
    .outputOptions([
      '-movflags frag_keyframe+empty_moov+default_base_moof',
      '-reset_timestamps 1'
    ])
    .on('error', (err, stdout, stderr) => {
      if (err.message && err.message.includes('SIGKILL')) {
        // Stream closed by user
      } else {
        console.error('FFmpeg Error:', err.message);
      }
    });

  const ffStream = command.pipe();

  ffStream.pipe(reply.raw);

  reply.raw.on('close', () => {
    command.kill('SIGKILL');
    inputStream.destroy();
  });
}
