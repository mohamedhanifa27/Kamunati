import React from 'react';
import ReviewModerationTable from '../../../components/admin/ReviewModerationTable';

export default function GlobalReviewsModerationPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-heading">Reviews Moderation</h1>
        <p className="text-white/40 text-sm mt-1">Global queue of all reviews across the platform. Manage visibility, resolve reports, and moderate content.</p>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <ReviewModerationTable />
      </div>
    </div>
  );
}
