'use client';

import React, { useState } from 'react';
import { Layers, Image as ImageIcon, HardDrive, ListTree, MessageSquare, Shield, FileText } from 'lucide-react';

import DetailsTab from './editor/DetailsTab';
import ArtworkTab from './editor/ArtworkTab';
import MediaTab from './editor/MediaTab';
import ReviewsTab from './editor/ReviewsTab';

interface MediaEditorProps {
  initialData: any;
  onSave?: (data: any) => void;
}

export default function MediaEditor({ initialData, onSave }: MediaEditorProps) {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'artwork', disabled: !initialData?.id, label: 'Artwork', icon: ImageIcon },
    { id: 'media', disabled: !initialData?.id, label: 'Media', icon: HardDrive },
    { id: 'seasons', label: 'Seasons & Episodes', icon: ListTree, hidden: initialData?.type !== 'SERIES', disabled: !initialData?.id },
    { id: 'subtitles', disabled: !initialData?.id, label: 'Subtitles', icon: Layers },
    { id: 'reviews', disabled: !initialData?.id, label: 'Reviews', icon: MessageSquare },
    { id: 'rights', disabled: !initialData?.id, label: 'Rights & Publishing', icon: Shield },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        {tabs.filter(t => !t.hidden).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)} disabled={tab.disabled}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : tab.disabled ? 'text-white/30 cursor-not-allowed' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[600px]">
        {activeTab === 'details' && <DetailsTab data={initialData} />}
        {activeTab === 'artwork' && <ArtworkTab data={initialData} />}
        {activeTab === 'media' && <MediaTab data={initialData} />}
        {activeTab === 'reviews' && <ReviewsTab mediaId={initialData?.id} />}
        
        {/* Placeholders for tabs not fully implemented here yet */}
        {activeTab === 'seasons' && <div className="text-white/50">Seasons & Episodes Manager (Coming Soon)</div>}
        {activeTab === 'subtitles' && <div className="text-white/50">Subtitles Manager (Coming Soon)</div>}
        {activeTab === 'rights' && <div className="text-white/50">Rights & Publishing Manager (Coming Soon)</div>}
      </div>
    </div>
  );
}


