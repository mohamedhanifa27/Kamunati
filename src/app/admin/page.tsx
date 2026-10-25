import React from 'react';
import { PrismaClient } from '@prisma/client';
import { Link } from 'next-view-transitions';
import { Film, Edit3, Plus, Trash2 } from 'lucide-react';
import { getDashboardMetrics } from '@/lib/admin/metrics';
import LiveDashboardCards from '@/components/admin/LiveDashboardCards';
import { AnalyticsChart } from '@/components/ui/analytics-chart';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  const mediaList = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { torrents: true }
  });

  const snapshot = await getDashboardMetrics();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Dashboard Overview</h1>
          <p className="text-white/50 mt-1">Manage movies, TV shows, and torrent associations.</p>
        </div>
        <Link 
          href="/admin/media/new" 
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Add Media</span>
        </Link>
      </div>

      <LiveDashboardCards initialData={snapshot} />

      <div className="my-8 h-96">
        <AnalyticsChart 
          title="Total Views (Last 7 Days)" 
          value="4,250" 
          description="+12% from last week"
          data={[
            { name: 'Mon', value: 400 },
            { name: 'Tue', value: 300 },
            { name: 'Wed', value: 550 },
            { name: 'Thu', value: 200 },
            { name: 'Fri', value: 700 },
            { name: 'Sat', value: 900 },
            { name: 'Sun', value: 850 },
          ]} 
        />
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/5 text-white/50 font-medium border-b border-white/10">
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
                <td colSpan={4} className="px-6 py-12 text-center text-white/30">
                  No media found. Click "Add Media" to get started.
                </td>
              </tr>
            )}
            {mediaList.map((media) => (
              <tr key={media.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {media.posterPath ? (
                      <img src={media.posterPath} alt={media.title} className="w-10 h-14 object-cover rounded shadow" />
                    ) : (
                      <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center">
                        <Film size={16} className="text-white/30" />
                      </div>
                    )}
                    <span className="font-semibold text-white group-hover:text-primary transition-colors">{media.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-white/10 px-2 py-1 rounded text-xs tracking-wide uppercase border border-white/20">{media.type}</span>
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
                    <Link href={`/admin/media/${media.id}`} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                      <Edit3 size={18} />
                    </Link>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors">
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
