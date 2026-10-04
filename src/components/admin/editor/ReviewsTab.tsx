'use client';

import React from 'react';
import ReviewModerationTable from '../ReviewModerationTable';

export default function ReviewsTab({ mediaId }: { mediaId: string }) {
  if (!mediaId) {
    return <div className="text-white/50 text-sm">Save the title first before managing reviews.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-heading mb-2">Title Reviews</h2>
        <p className="text-white/40 text-sm">Moderate user reviews and manage pinned editorial reviews specifically for this title.</p>
      </div>
      
      <div className="bg-black/20 border border-white/5 rounded-xl p-2 md:p-6">
        <ReviewModerationTable mediaId={mediaId} />
      </div>
    </div>
  );
}
