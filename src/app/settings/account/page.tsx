'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Loader2, Check } from 'lucide-react';
import { useNotification } from '../../../components/ui/NotificationProvider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const AVATAR_OPTIONS = [
  '/logo_vector.svg',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
];

export default function AccountSettings() {
  const { notify } = useNotification();
  const { data: profile, mutate } = useSWR('/api/me/profile', fetcher);
  
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAvatar(profile.avatar || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    try {
      await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatar }),
      });
      await mutate();
      notify('Success', 'Account settings saved', 'success');
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-neutral-500" /></div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-heading font-bold mb-8">Account Details</h2>
      
      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Read Only Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email Address</label>
            <input 
              type="text" 
              readOnly
              value={profile.email}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-neutral-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Username</label>
            <input 
              type="text" 
              readOnly
              value={profile.email.split('@')[0]}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-neutral-500 cursor-not-allowed"
            />
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Editable Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={32}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">Avatar</label>
            <div className="flex flex-wrap gap-4">
              {AVATAR_OPTIONS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${avatar === url ? 'border-primary scale-110 shadow-[0_0_15px_rgba(var(--color-primary),0.5)]' : 'border-transparent hover:border-white/30'}`}
                >
                  <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                  {avatar === url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check size={24} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit"
            disabled={isSaving || !displayName.trim()}
            className="px-6 py-3 rounded-full bg-primary hover:bg-primary/80 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            Save Changes
          </button>
          

        </div>
      </form>
    </div>
  );
}
