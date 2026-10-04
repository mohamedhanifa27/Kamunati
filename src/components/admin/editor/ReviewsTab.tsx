'use client';

import React from 'react';

export default function ReviewsTab({ mediaId }: { mediaId: string }) {
  // This will be replaced by the full ReviewModerationTable in H.2
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-heading mb-2">Title Reviews</h2>
        <p className="text-white/40 text-sm">Moderate reviews specifically for this title.</p>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/50">
        Review moderation tools will be implemented in Workstream H.2.
      </div>
    </div>
  );
}
