'use client';

import React, { useState, useEffect } from 'react';
import { Shield, EyeOff, Eye, Trash2, Edit3, Pin, AlertCircle, MessageSquare, X, CheckCircle } from 'lucide-react';

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}

interface Review {
  id: string;
  body: string;
  rating: number;
  displayName: string;
  status: 'VISIBLE' | 'HIDDEN' | 'REMOVED';
  isPinned: boolean;
  isEditorial: boolean;
  authorLabel?: string;
  createdAt: string;
  editedAt?: string;
  media: { title: string; id: string };
  _count: { reports: number };
}

export default function ReviewModerationTable({ mediaId }: { mediaId?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const [viewingReportsId, setViewingReportsId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async (reviewId: string) => {
    setViewingReportsId(reviewId);
    setReports([]);
    try {
      const res = await fetch(`/api/admin/review-reports?reviewId=${reviewId}`);
      if (res.ok) setReports(await res.json());
    } catch (e) {}
  };

  const resolveReport = async (reportId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/review-reports/${reportId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (e) {}
  };

  const fetchReviews = async () => {
    setLoading(true);
    let url = `/api/admin/reviews?status=${filter}`;
    if (mediaId) url += `&mediaId=${mediaId}`;
    try {
      const res = await fetch(url);
      if (res.ok) setReviews(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [mediaId, filter]);

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      }
    } catch (e) {
      alert('Failed to update review');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Permanently hard-delete this review? (Super Admin only)')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete review');
      }
    } catch (e) {
      alert('Failed to delete review');
    }
  };

  const handleEditSave = (id: string) => {
    updateReview(id, { body: editBody });
    setEditingId(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="bg-black/60 border border-white/20 rounded-lg py-2 px-4 text-sm text-white focus:outline-none focus:border-primary"
        >
          <option value="ALL">All Statuses</option>
          <option value="VISIBLE">Visible</option>
          <option value="HIDDEN">Hidden</option>
          <option value="REMOVED">Removed (Violations)</option>
        </select>
        <span className="text-white/40 text-sm">{reviews.length} reviews found</span>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="text-center py-12 text-white/40 border border-white/10 border-dashed rounded-xl">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
            No reviews match the current filter.
          </div>
        )}

        {reviews.map(review => (
          <div key={review.id} className={`p-4 md:p-6 bg-black/40 border ${review._count.reports > 0 ? 'border-red-500/50' : 'border-white/10'} rounded-xl transition-all`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center flex-wrap gap-3">
                  <span className="font-semibold text-white">{review.displayName}</span>
                  <div className="flex text-yellow-500 text-sm">
                    {Array.from({length: 5}).map((_, i) => (
                      <span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                    ))}
                  </div>
                  {review.isEditorial && (
                    <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded border border-primary/30">
                      {review.authorLabel || 'Editorial'}
                    </span>
                  )}
                  {review.isPinned && (
                    <span className="text-xs flex items-center gap-1 bg-white/10 text-white px-2 py-0.5 rounded">
                      <Pin size={12} /> Pinned
                    </span>
                  )}
                  <span className="text-xs text-white/40">{timeAgo(review.createdAt)}</span>
                  {!mediaId && (
                    <span className="text-xs text-white/40 ml-2">on <strong>{review.media?.title}</strong></span>
                  )}
                </div>

                {editingId === review.id ? (
                  <div className="space-y-3">
                    <textarea 
                      value={editBody} 
                      onChange={e => setEditBody(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSave(review.id)} className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm leading-relaxed">
                    {review.body}
                    {review.editedAt && <span className="text-xs text-white/30 italic ml-2">(Edited by admin)</span>}
                  </p>
                )}

                {review._count.reports > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 inline-flex px-2 py-1 rounded border border-red-500/20">
                      <AlertCircle size={14} /> {review._count.reports} Flag Reports
                    </div>
                    <button onClick={() => fetchReports(review.id)} className="text-xs text-white/50 hover:text-white underline block mt-2">View Reports</button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4">
                {review.status === 'VISIBLE' ? (
                  <>
                    <button onClick={() => updateReview(review.id, { status: 'HIDDEN' })} className="flex items-center gap-2 text-xs font-medium text-white/70 hover:text-white transition-colors p-2 rounded hover:bg-white/5">
                      <EyeOff size={16} /> Hide
                    </button>
                    <button onClick={() => updateReview(review.id, { status: 'REMOVED' })} className="flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors p-2 rounded hover:bg-red-500/10">
                      <Shield size={16} /> Remove (Violation)
                    </button>
                  </>
                ) : (
                  <button onClick={() => updateReview(review.id, { status: 'VISIBLE' })} className="flex items-center gap-2 text-xs font-medium text-green-400 hover:text-green-300 transition-colors p-2 rounded hover:bg-green-500/10">
                    <Eye size={16} /> Restore to Visible
                  </button>
                )}
                
                <button 
                  onClick={() => { setEditBody(review.body); setEditingId(review.id); }}
                  className="flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors p-2 rounded hover:bg-blue-500/10"
                >
                  <Edit3 size={16} /> Edit Text
                </button>
                
                <button 
                  onClick={() => updateReview(review.id, { isPinned: !review.isPinned })}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors p-2 rounded hover:bg-white/5 ${review.isPinned ? 'text-primary' : 'text-white/70 hover:text-white'}`}
                >
                  <Pin size={16} /> {review.isPinned ? 'Unpin' : 'Pin to Top'}
                </button>
                
                <button onClick={() => deleteReview(review.id)} className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-red-400 transition-colors p-2 rounded hover:bg-red-500/10 mt-auto">
                  <Trash2 size={16} /> Hard Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Modal */}
      {viewingReportsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white">Review Reports</h3>
              <button onClick={() => setViewingReportsId(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {reports.length === 0 ? (
                <div className="text-center text-white/50 py-8">Loading reports...</div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-black/40 border border-white/10 rounded-lg p-4 flex justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{report.reporterName}</span>
                        <span className="text-xs text-white/40">{timeAgo(report.createdAt)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${report.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70"><strong className="text-white">Reason:</strong> {report.reason}</p>
                      {report.details && <p className="text-sm text-white/50 mt-1">{report.details}</p>}
                    </div>
                    {report.status === 'OPEN' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => resolveReport(report.id, 'RESOLVED')} className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded flex items-center justify-center gap-1">
                          <CheckCircle size={14}/> Resolve
                        </button>
                        <button onClick={() => resolveReport(report.id, 'REJECTED')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded flex items-center justify-center gap-1">
                          <X size={14}/> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
