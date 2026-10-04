'use client';

import React, { useState } from 'react';
import { AdminBloomButton } from '@/features/admin/ui/threeui/AdminBloomButton';
import { AdminToggle } from '@/features/admin/ui/threeui/AdminToggle';
import { AdminOrbButton } from '@/features/admin/ui/threeui/AdminOrbButton';
import { AdminDockNav } from '@/features/admin/ui/threeui/AdminDockNav';
import { Settings, Users, Activity, Bell } from 'lucide-react';

export default function ThreeUIDemoPage() {
  const [toggleAdd, setToggleAdd] = useState(false);
  const [toggleState, setToggleState] = useState(true);
  const [toggleBusy, setToggleBusy] = useState(false);
  
  const [activeDock, setActiveDock] = useState('dashboard');

  const dockItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, badge: 3 },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-bg p-8 text-text flex gap-8">
      {/* Dock Sidebar */}
      <div className="h-[600px] border border-border rounded-xl bg-surface p-4 relative overflow-hidden">
        <AdminDockNav 
          items={dockItems} 
          activeId={activeDock} 
          onNavigate={setActiveDock} 
        />
      </div>

      <div className="flex-1 space-y-12">
        <h1 className="text-3xl font-heading font-bold mb-8">ThreeUI Integration Demo</h1>

        <section>
          <h2 className="text-xl mb-4 font-semibold">AdminBloomButton (Secondary Actions)</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <AdminBloomButton label="Standard Action" onClick={() => console.log('click')} />
            <AdminBloomButton label="Danger Action" intent="danger" onClick={() => console.log('danger')} />
            <AdminBloomButton label="Disabled" disabled />
            <AdminBloomButton label="Loading" loading />
          </div>
        </section>

        <section>
          <h2 className="text-xl mb-4 font-semibold">AdminToggle (Modern)</h2>
          <div className="grid grid-cols-2 gap-8 max-w-2xl">
            <div className="p-4 border border-border rounded-lg bg-surface">
              <h3 className="mb-4 text-text-muted">Tone: Add (Hue 73)</h3>
              <AdminToggle 
                label="Notify all users" 
                description="Send a broadcast when saving"
                tone="add" 
                checked={toggleAdd} 
                onCheckedChange={setToggleAdd} 
              />
            </div>
            
            <div className="p-4 border border-border rounded-lg bg-surface">
              <h3 className="mb-4 text-text-muted">Tone: State (Hue -97)</h3>
              <AdminToggle 
                label="Go Live" 
                description="Make visible immediately"
                tone="state" 
                checked={toggleState} 
                onCheckedChange={setToggleState} 
                busy={toggleBusy}
              />
              <button 
                className="mt-4 text-sm text-primary hover:underline"
                onClick={() => setToggleBusy(!toggleBusy)}
              >
                Toggle Busy State for testing
              </button>
            </div>
            
            <div className="p-4 border border-border rounded-lg bg-surface opacity-50">
              <h3 className="mb-4 text-text-muted">Disabled</h3>
              <AdminToggle 
                label="Disabled Toggle" 
                tone="state" 
                checked={true} 
                onCheckedChange={() => {}} 
                disabled
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl mb-4 font-semibold">AdminOrbButton (Primary Add)</h2>
          <div className="flex gap-8 items-center">
            <AdminOrbButton 
              ariaLabel="Add Media" 
              label="Add Media" 
              onClick={() => console.log('Add Media')} 
            />
            <AdminOrbButton 
              ariaLabel="Add User" 
              label="Add User" 
              size={64}
              onClick={() => console.log('Add User')} 
            />
            <AdminOrbButton 
              ariaLabel="Disabled Orb" 
              label="Disabled" 
              disabled
              onClick={() => {}} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}
