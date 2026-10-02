import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { Film, Edit3, Plus, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  const mediaList = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { torrents: true }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text">Dashboard Overview</h1>
          <p className="text-text-muted mt-1">Manage movies, TV shows, and torrent associations.</p>
        </div>
        <Link 
          href="/admin/media/new" 
          className="bg-primary hover:bg-primary-hover text-bg px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Add Media</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Titles', value: mediaList.length, color: 'text-primary' },
          { label: 'Published', value: mediaList.filter(m => m.isPublished).length, color: 'text-success' },
          { label: 'Pending Torrents', value: mediaList.filter(m => !m.torrents || m.torrents.length === 0).length, color: 'text-warning' },
          { label: 'Active Users', value: 24, color: 'text-info' } // Dummy for now
        ].map(kpi => (
          <div key={kpi.label} className="bg-surface border border-border rounded-xl p-6 shadow-md flex flex-col justify-center">
            <h3 className="text-text-muted font-medium text-sm mb-2">{kpi.label}</h3>
            <span className={`text-4xl font-heading font-bold ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-text">
          <thead className="bg-surface-raised text-text-muted font-medium">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Torrent Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mediaList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                  No media found. Click "Add Media" to get started.
                </td>
              </tr>
            )}
            {mediaList.map((media) => (
              <tr key={media.id} className="hover:bg-surface transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {media.posterPath ? (
                      <img src={media.posterPath} alt={media.title} className="w-10 h-14 object-cover rounded shadow" />
                    ) : (
                      <div className="w-10 h-14 bg-surface-raised rounded flex items-center justify-center">
                        <Film size={16} className="text-text-muted" />
                      </div>
                    )}
                    <span className="font-semibold text-text group-hover:text-primary transition-colors">{media.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-surface-raised px-2 py-1 rounded text-xs tracking-wide uppercase">{media.type}</span>
                </td>
                <td className="px-6 py-4">
                  {media.torrents && media.torrents.length > 0 ? (
                    <span className="text-green-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400" /> Linked</span>
                  ) : (
                    <span className="text-yellow-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Pending Torrent</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/media/${media.id}`} className="p-2 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text transition-colors">
                      <Edit3 size={18} />
                    </Link>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
