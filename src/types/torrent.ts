export interface SwarmStats {
  peers: number;
  activeSeeders: number;
  activeLeechers: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  percentVerified: number;
}

export interface MediaFile {
  name: string;
  path: string;
  length: number;
  offset: number;
  createReadStream(opts?: { start: number; end: number }): NodeJS.ReadableStream;
}

export interface TorrentOptions {
  connections?: number;
  uploads?: number;
  tmp?: string;
  path?: string;
  verify?: boolean;
  dht?: boolean;
  tracker?: boolean;
  trackers?: string[];
}

export interface FileTreeNode {
  name: string;
  length: number;
  path: string;
}

export interface TorrentMetadata {
  name: string;
  files: FileTreeNode[];
  infoHash: string;
}

export interface EngineInstance {
  infoHash: string;
  files: MediaFile[];
  stats: SwarmStats;
  torrent?: any;
  bitfield?: any;
  destroy(callback: () => void): void;
  setStreamPosition(byteOffset: number, file: MediaFile): void;
  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  prioritizeFile?(file: MediaFile): void;
  isFileComplete?(file: MediaFile): boolean;
  getPrimaryFile(): MediaFile | null;
  resetIdleTimer(): void;
}
