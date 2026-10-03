'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, LayoutGrid, List as ListIcon, MoreVertical, X, CheckSquare, Square } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function SortableItem({ item, view, selectionMode, selected, onToggleSelect, onRemove, onMoveToTop }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const isUnavailable = item.media?.status === 'UNPUBLISHED';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-colors ${
        isDragging ? 'bg-white/10 border-white/20 shadow-2xl' : 'bg-white/5 border-white/5 hover:bg-white/10'
      } ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
    >
      {selectionMode ? (
        <button onClick={() => onToggleSelect(item.id)} className="p-2 -ml-2 text-neutral-400 hover:text-white">
          {selected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
        </button>
      ) : (
        <button {...attributes} {...listeners} className="p-2 -ml-2 cursor-grab active:cursor-grabbing text-neutral-500 hover:text-white transition-colors touch-none">
          <GripVertical size={20} />
        </button>
      )}
      
      <div className="w-16 h-24 md:w-20 md:h-30 shrink-0 bg-neutral-800 rounded-lg overflow-hidden relative">
        <img src={item.media?.posterPath || '/logo_vector.svg'} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-lg truncate">{item.media?.title || 'Unknown Title'}</h4>
        <p className="text-sm text-neutral-400 mt-1">
          {isUnavailable ? 'No longer available' : `Added ${new Date(item.addedAt).toLocaleDateString()}`}
        </p>
      </div>

      {!selectionMode && (
        <div className="flex items-center gap-2">
          {isUnavailable ? (
            <button onClick={() => onRemove(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors" title="Remove">
              <Trash2 size={18} />
            </button>
          ) : (
            <div className="relative group/menu">
              <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <MoreVertical size={18} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                <button onClick={() => onMoveToTop(item.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors">Move to top</button>
                <button onClick={() => onRemove(item.id)} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Remove</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomizeMyList() {
  const { data: profile } = useSWR('/api/me/profile', fetcher);
  
  // Default to manual, grid view based on preferences if available
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState('manual');
  
  const { data: watchlist, mutate } = useSWR(`/api/user/watchlist?sort=${sort}`, fetcher);
  
  const [items, setItems] = useState<any[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (watchlist) setItems(watchlist);
  }, [watchlist]);

  useEffect(() => {
    if (profile?.preferences) {
      if (profile.preferences.myList?.view) setView(profile.preferences.myList.view);
      if (profile.preferences.myList?.sort) setSort(profile.preferences.myList.sort);
    }
  }, [profile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrder = async (newOrder: string[]) => {
    try {
      await fetch('/api/watchlist/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
      // Optionally update preference: save 'manual' as sort 
    } catch (e) {
      console.error('Failed to save order');
      mutate(); // rollback
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveOrder(newItems.map(i => i.id));
        return newItems;
      });
    }
  };

  const handleMoveToTop = (id: string) => {
    setItems((items) => {
      const idx = items.findIndex(i => i.id === id);
      if (idx <= 0) return items;
      const newItems = [items[idx], ...items.slice(0, idx), ...items.slice(idx + 1)];
      saveOrder(newItems.map(i => i.id));
      return newItems;
    });
  };

  const handleRemove = async (id: string) => {
    // In a real app we'd DELETE to /api/user/watchlist with mediaId
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    setItems(items.filter(i => i.id !== id));
    try {
      await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.mediaId })
      });
      mutate();
    } catch(e) {}
  };

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} titles?`)) return;

    // Fast optimistic UI
    const remaining = items.filter(i => !selectedIds.has(i.id));
    setItems(remaining);
    
    // Process sequentially (or ideally a new bulk DELETE endpoint)
    for (const id of selectedIds) {
      const item = items.find(i => i.id === id);
      if (item) {
        await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId: item.mediaId })
        });
      }
    }
    setSelectionMode(false);
    setSelectedIds(new Set());
    mutate();
  };

  const handleClearAll = async () => {
    if (!watchlist || watchlist.length === 0) return;
    try {
      await fetch('/api/watchlist', { method: 'DELETE' });
      setShowClearConfirm(false);
      mutate();
    } catch(e) {}
  };

  return (
    <div className="max-w-4xl mx-auto md:mx-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Customize My List</h2>
          <p className="text-neutral-400 text-sm mt-1">{items.length} titles</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectionMode ? (
            <>
              <button 
                onClick={() => setSelectedIds(new Set(items.map(i => i.id)))}
                className="text-sm font-medium hover:text-white transition-colors text-neutral-400"
              >
                Select all
              </button>
              <button 
                onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                className="text-sm font-medium hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5"
              >
                Cancel
              </button>
              <button 
                disabled={selectedIds.size === 0}
                onClick={handleBulkRemove}
                className="text-sm font-medium px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
              >
                Remove selected ({selectedIds.size})
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => setView('list')} 
                  className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white/10 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                >
                  <ListIcon size={16} />
                </button>
                <button 
                  onClick={() => setView('grid')} 
                  className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white/10 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              <select 
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg text-sm px-3 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="manual">Manual</option>
                <option value="recent">Recently added</option>
                <option value="az">A to Z</option>
                <option value="year">Release year</option>
              </select>

              <button 
                onClick={() => setSelectionMode(true)}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                Select
              </button>
              
              <button 
                onClick={() => setShowClearConfirm(true)}
                disabled={items.length === 0}
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent disabled:opacity-50"
                title="Clear My List"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl">
          <p className="text-neutral-400 text-lg">Your list is empty.</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-3">
            <SortableContext 
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map(item => (
                <SortableItem 
                  key={item.id} 
                  item={item} 
                  view={view}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={(id: string) => {
                    const newSet = new Set(selectedIds);
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                    setSelectedIds(newSet);
                  }}
                  onRemove={handleRemove}
                  onMoveToTop={handleMoveToTop}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-heading font-bold mb-2">Clear My List?</h3>
            <p className="text-neutral-400 mb-6 text-sm">
              This removes {items.length} titles. This can't be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-full font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 rounded-full font-medium bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
