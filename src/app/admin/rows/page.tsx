'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  SlidersHorizontal,
  Film,
  Sparkles,
  TrendingUp,
  Star,
  Tag,
  Tv,
  Check,
  X,
  Search
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface LandingRowData {
  id: string;
  title: string;
  type: 'RECENT' | 'TRENDING' | 'TOP_RATED' | 'GENRE' | 'CATEGORY' | 'CUSTOM';
  genre?: string | null;
  category?: string | null;
  customMediaIds?: string | null;
  limit: number;
  sortOrder: number;
  isEnabled: boolean;
  itemCount?: number;
}

interface MediaOption {
  id: string;
  title: string;
  posterPath?: string | null;
  releaseYear?: number | null;
  category?: string | null;
}

const PRESET_TITLES = [
  'Trending Now',
  'Action & Adventure',
  'Sci-Fi Masterpieces',
  'Top Rated Movies',
  'Crime & Mystery',
  'Binge-Worthy TV Shows',
  'Anime Highlights',
  'Family Favorites',
  'Editor\'s Picks',
  'Cult Classics'
];

export default function AdminLandingRowsPage() {
  const { data, error, isLoading } = useSWR('/api/admin/landing-rows', fetcher);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LandingRowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<LandingRowData['type']>('TRENDING');
  const [formGenre, setFormGenre] = useState('');
  const [formCategory, setFormCategory] = useState('ALL');
  const [formLimit, setFormLimit] = useState(20);
  const [formEnabled, setFormEnabled] = useState(true);
  const [formCustomIds, setFormCustomIds] = useState<string[]>([]);

  const rows: LandingRowData[] = data?.rows || [];
  const availableGenres: string[] = data?.availableGenres || [];
  const publishedMedia: MediaOption[] = data?.publishedMedia || [];

  const openCreateModal = () => {
    setEditingRow(null);
    setFormTitle('');
    setFormType('TRENDING');
    setFormGenre(availableGenres[0] || 'Action');
    setFormCategory('ALL');
    setFormLimit(20);
    setFormEnabled(true);
    setFormCustomIds([]);
    setMediaSearchQuery('');
    setModalOpen(true);
  };

  const openEditModal = (row: LandingRowData) => {
    setEditingRow(row);
    setFormTitle(row.title);
    setFormType(row.type);
    setFormGenre(row.genre || availableGenres[0] || 'Action');
    setFormCategory(row.category || 'ALL');
    setFormLimit(row.limit || 20);
    setFormEnabled(row.isEnabled);
    try {
      setFormCustomIds(row.customMediaIds ? JSON.parse(row.customMediaIds) : []);
    } catch {
      setFormCustomIds([]);
    }
    setMediaSearchQuery('');
    setModalOpen(true);
  };

  const handleToggleEnabled = async (row: LandingRowData) => {
    try {
      await fetch(`/api/admin/landing-rows/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !row.isEnabled })
      });
      mutate('/api/admin/landing-rows');
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const newRows = [...rows];
    const [moved] = newRows.splice(index, 1);
    newRows.splice(targetIndex, 0, moved);

    const reorderedPayload = newRows.map((r, i) => ({
      id: r.id,
      sortOrder: i,
      isEnabled: r.isEnabled
    }));

    try {
      await fetch('/api/admin/landing-rows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: reorderedPayload })
      });
      mutate('/api/admin/landing-rows');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (row: LandingRowData) => {
    if (!confirm(`Are you sure you want to delete the row "${row.title}"?`)) return;

    try {
      await fetch(`/api/admin/landing-rows/${row.id}`, {
        method: 'DELETE'
      });
      mutate('/api/admin/landing-rows');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all landing page rows to default curated categories? This will overwrite existing custom rows.')) return;

    try {
      await fetch('/api/admin/landing-rows/reset', {
        method: 'POST'
      });
      mutate('/api/admin/landing-rows');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        type: formType,
        genre: formType === 'GENRE' ? formGenre : null,
        category: formCategory !== 'ALL' ? formCategory : null,
        limit: formLimit,
        isEnabled: formEnabled,
        customMediaIds: formType === 'CUSTOM' ? formCustomIds : null
      };

      if (editingRow) {
        await fetch(`/api/admin/landing-rows/${editingRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/admin/landing-rows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setModalOpen(false);
      mutate('/api/admin/landing-rows');
    } catch (err) {
      console.error('Failed to save row:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCustomMediaId = (id: string) => {
    setFormCustomIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredMediaForCustom = publishedMedia.filter(m => 
    m.title.toLowerCase().includes(mediaSearchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-white">Landing Page Rows</h1>
            <span className="bg-primary/20 text-primary border border-primary/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Live Customizer
            </span>
          </div>
          <p className="text-white/60 text-sm mt-1">
            Reorder, configure, and curate rows shown on the user homepage and category browse pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-sm border border-white/10 transition-colors"
            title="Restore default trending, genre, and top rated rows"
          >
            <RotateCcw size={16} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-[0_0_20px_rgba(80,26,150,0.4)] transition-all"
          >
            <Plus size={18} />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Rows List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 bg-white/5 animate-pulse rounded-xl border border-white/10" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/40">
            <SlidersHorizontal size={32} />
          </div>
          <h3 className="text-lg font-semibold text-white">No rows configured</h3>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Click "Add Row" or "Reset Defaults" to populate your homepage with custom trending and genre rows.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
          >
            Load Default Rows
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => {
            return (
              <div
                key={row.id}
                className={`flex items-center justify-between p-4 bg-black/40 border rounded-xl transition-all ${
                  row.isEnabled 
                    ? 'border-white/10 hover:border-white/20' 
                    : 'border-white/5 opacity-60 bg-black/20'
                }`}
              >
                {/* Left: Reorder & Number */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 disabled:opacity-20 rounded text-white/70 hover:text-white transition-colors"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === rows.length - 1}
                      className="p-1 hover:bg-white/10 disabled:opacity-20 rounded text-white/70 hover:text-white transition-colors"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold text-white/30 w-6 text-center">
                    #{index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-base font-semibold text-white">{row.title}</h4>
                      
                      {/* Type Badge */}
                      <span className="text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-medium bg-white/5 border-white/10 text-white/80">
                        {row.type === 'TRENDING' && <TrendingUp size={12} className="text-primary" />}
                        {row.type === 'RECENT' && <Sparkles size={12} className="text-cyan-400" />}
                        {row.type === 'TOP_RATED' && <Star size={12} className="text-amber-400" />}
                        {row.type === 'GENRE' && <Tag size={12} className="text-purple-400" />}
                        {row.type === 'CATEGORY' && <Tv size={12} className="text-blue-400" />}
                        {row.type === 'CUSTOM' && <Film size={12} className="text-emerald-400" />}
                        
                        {row.type === 'GENRE' ? `Genre: ${row.genre || 'All'}` :
                         row.type === 'CATEGORY' ? `Category: ${row.category}` :
                         row.type === 'TOP_RATED' ? 'Top Rated' :
                         row.type === 'CUSTOM' ? 'Hand-Picked' : 'Trending Now'}
                      </span>

                      {row.category && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded">
                          {row.category}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-white/40 mt-1 flex items-center gap-3">
                      <span>Limit: {row.limit} items</span>
                      <span>•</span>
                      <span>Matching Titles: {row.itemCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(row)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      row.isEnabled
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {row.isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{row.isEnabled ? 'Visible' : 'Hidden'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(row)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-colors"
                    title="Edit row configuration"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(row)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                    title="Delete row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Row */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121218] border border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingRow ? 'Edit Landing Row' : 'Add New Landing Row'}
                </h3>
                <p className="text-white/50 text-xs mt-0.5">
                  Configure how this row selects and orders media for users.
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Row Title */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                  Row Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trending Now, Mind-Bending Sci-Fi..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_TITLES.map(title => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setFormTitle(title)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-colors"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                  Row Content Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'TRENDING', label: 'Trending / Recent', icon: TrendingUp },
                    { type: 'GENRE', label: 'By Genre', icon: Tag },
                    { type: 'TOP_RATED', label: 'Top Rated', icon: Star },
                    { type: 'CATEGORY', label: 'By Category', icon: Tv },
                    { type: 'CUSTOM', label: 'Hand-Picked', icon: Film },
                  ].map(option => {
                    const Icon = option.icon;
                    const isSelected = formType === option.type;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => setFormType(option.type as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(80,26,150,0.3)]'
                            : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-primary' : 'text-white/40'} />
                        <span className="text-xs font-medium mt-1.5">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre Dropdown if type == GENRE */}
              {formType === 'GENRE' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                    Select Genre
                  </label>
                  <select
                    value={formGenre}
                    onChange={e => setFormGenre(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre} className="bg-bg text-white">
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Scope */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                    Page Scope
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="ALL" className="bg-bg text-white">All Pages (Universal)</option>
                    <option value="MOVIE" className="bg-bg text-white">Movies Only</option>
                    <option value="TV_SERIES" className="bg-bg text-white">TV Series Only</option>
                    <option value="ANIME" className="bg-bg text-white">Anime Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                    Max Titles (Limit)
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={formLimit}
                    onChange={e => setFormLimit(parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Custom Titles Picker if type == CUSTOM */}
              {formType === 'CUSTOM' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                      Select Titles ({formCustomIds.length} chosen)
                    </label>
                    {formCustomIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormCustomIds([])}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search published media titles..."
                      value={mediaSearchQuery}
                      onChange={e => setMediaSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/10 rounded-xl p-2 bg-black/30">
                    {filteredMediaForCustom.length === 0 ? (
                      <p className="text-xs text-white/40 text-center py-4">No matching published titles found.</p>
                    ) : (
                      filteredMediaForCustom.map(media => {
                        const isChosen = formCustomIds.includes(media.id);
                        return (
                          <div
                            key={media.id}
                            onClick={() => toggleCustomMediaId(media.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              isChosen 
                                ? 'bg-primary/20 border border-primary/40 text-white' 
                                : 'hover:bg-white/5 text-white/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {media.posterPath ? (
                                <img src={media.posterPath} alt={media.title} className="w-6 h-8 object-cover rounded" />
                              ) : (
                                <div className="w-6 h-8 bg-white/10 rounded flex items-center justify-center">
                                  <Film size={12} className="text-white/40" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold block text-white">{media.title}</span>
                                <span className="text-[10px] text-white/40">{media.releaseYear || ''} • {media.category}</span>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                              isChosen ? 'bg-primary border-primary text-white' : 'border-white/20'
                            }`}>
                              {isChosen && <Check size={12} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-white/70">Row Visibility State</span>
                <button
                  type="button"
                  onClick={() => setFormEnabled(!formEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    formEnabled 
                      ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {formEnabled ? 'Enabled (Visible on Browse)' : 'Disabled (Hidden)'}
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(80,26,150,0.4)] disabled:opacity-50 transition-all"
                >
                  {isSaving ? 'Saving...' : editingRow ? 'Update Row' : 'Create Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
