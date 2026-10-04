const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Append to User
code = code.replace('updatedAt           DateTime            @updatedAt', 'updatedAt           DateTime            @updatedAt\n\n  // Admin Overhaul Additions\n  createdByAdminId    String?\n  firstLoginAt        DateTime?\n  passwordLoginAllowed Boolean            @default(true)\n  emailLoginAllowed   Boolean            @default(true)\n\n  authMethods         UserAuthMethod[]\n  notifications       NotificationRecipient[]\n  presence            UserPresence?');

// Append to Media
code = code.replace('updatedAt               DateTime      @updatedAt', 'updatedAt               DateTime      @updatedAt\n\n  // Admin Overhaul Additions\n  liveAt                  DateTime?\n  unliveAt                DateTime?\n  deletedAt               DateTime?\n  sourceKind              String?     // TELEGRAM, UPLOAD, MAGNET\n  sourceRef               String?     // JSON\n  removedAt               DateTime?\n  removedById             String?');

// Change UserRestriction type comment
code = code.replace('type         String    // WATCH_BLOCK | REVIEW_BLOCK', 'type         String    // WATCH_BLOCK | REVIEW_BLOCK | LOGIN | WATCH | REVIEW');

// Append new models at the end
const newModels = `

// ─── ADMIN OVERHAUL MODELS ────────────────────────────────────────

model MediaActivity {
  id              String   @id @default(uuid())
  titleId         String?  // survives hard delete
  titleSnapshot   String   // JSON
  action          String   // CREATED, MODIFIED, REMOVED, RESTORED, WENT_LIVE, WENT_UNLIVE, SOURCE_CHANGED
  changes         String   // JSON array
  actorId         String
  requestId       String?
  createdAt       DateTime @default(now())

  @@index([titleId, createdAt(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([action, createdAt(sort: Desc)])
}

model AdminAlert {
  id              String   @id @default(uuid())
  category        String   // MEDIA, TORRENT, USER, ACCESS, NOTIFICATION, SETTINGS, SYSTEM
  severity        String   // INFO, SUCCESS, WARNING, CRITICAL
  title           String
  body            String
  entityType      String
  entityId        String
  actorId         String?
  dedupeKey       String?
  count           Int      @default(1)
  meta            String?  // JSON
  createdAt       DateTime @default(now())
  lastOccurredAt  DateTime @default(now())

  @@index([createdAt(sort: Desc)])
  @@index([dedupeKey, lastOccurredAt(sort: Desc)])
}

model AdminAlertRead {
  alertId         String
  adminId         String
  readAt          DateTime @default(now())

  @@unique([alertId, adminId])
}

model AdminAlertPref {
  id              String   @id @default(uuid())
  adminId         String
  category        String
  inApp           Boolean  @default(true)
  desktop         Boolean  @default(false)
  sound           Boolean  @default(false)

  @@unique([adminId, category])
}

model Notification {
  id              String   @id @default(uuid())
  kind            String   // BROADCAST, SYSTEM, FIRST_LOGIN_NOTICE, RESTRICTION, MEDIA
  title           String   // max 80
  body            String   // max 500
  linkUrl         String?
  audience        String   // ALL, USER, USERS
  createdById     String?
  scheduledFor    DateTime?
  expiresAt       DateTime?
  recalledAt      DateTime?
  createdAt       DateTime @default(now())

  recipients      NotificationRecipient[]
}

model NotificationRecipient {
  id              String   @id @default(uuid())
  notificationId  String
  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveredAt     DateTime?
  readAt          DateTime?
  dismissedAt     DateTime?

  @@unique([notificationId, userId])
  @@index([userId, readAt, createdAt(sort: Desc)])
}

model UserPresence {
  userId               String   @id
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  state                String   // ONLINE, AWAY, OFFLINE
  lastHeartbeatAt      DateTime
  lastSeenAt           DateTime
  currentMediaAssetId  String?
  currentTitleId       String?
  currentEpisodeId     String?
  currentPositionSec   Int?
  currentSource        String?  // HEARTBEAT, PLAYBACK
  deviceLabel          String?
  updatedAt            DateTime @updatedAt
}

model TorrentHealthSample {
  id              String   @id @default(uuid())
  torrentId       String
  ts              DateTime @default(now())
  resolution      String   // FINE_30S, COARSE_5M
  seeders         Int
  leechers        Int
  peersTotal      Int
  downloadBps     BigInt
  uploadBps       BigInt
  availability    Float
  progress        Float
  viewers         Int
  healthScore     Int

  @@index([torrentId, resolution, ts(sort: Desc)])
}

model TelegramPost {
  id              String   @id @default(uuid())
  chatId          String
  messageId       Int
  postedAt        DateTime
  kind            String   // TORRENT_FILE, MAGNET, VIDEO, OTHER
  text            String?
  caption         String?
  fileId          String?
  fileUniqueId    String?
  fileName        String?
  mimeType        String?
  sizeBytes       BigInt?
  magnets         String?  // JSON array
  hashtags        String?  // JSON array
  editedAt        DateTime?
  removedAt       DateTime?
  indexedAt       DateTime @default(now())

  @@unique([chatId, messageId])
  @@index([chatId, messageId(sort: Desc)])
  @@index([kind, postedAt(sort: Desc)])
}

model UserAuthMethod {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String   // OAUTH_EMAIL, OWN_PASSWORD
  provider          String?
  providerAccountId String?
  email             String?
  passwordHash      String?
  linkedAt          DateTime @default(now())
  lastUsedAt        DateTime?
  disabledAt        DateTime?

  @@unique([provider, providerAccountId])
}

model AdminEventLog {
  id        BigInt   @id @default(autoincrement())
  type      String
  payload   String   // JSON
  createdAt DateTime @default(now())
}

model DashboardMetricSample {
  id        String   @id @default(uuid())
  key       String
  ts        DateTime @default(now())
  value     Int

  @@index([key, ts(sort: Desc)])
}
`;

fs.writeFileSync('prisma/schema.prisma', code + newModels);
