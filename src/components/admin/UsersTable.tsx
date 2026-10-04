'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Ban, CheckCircle, Trash2, ShieldAlert, Key, Activity } from 'lucide-react';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');

  // Ban state
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const [banType, setBanType] = useState('WATCH_BLOCK');
  const [banReason, setBanReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      if (res.ok) {
        setNewEmail(''); setNewPassword(''); setShowAddForm(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create user');
      }
    } catch (e) {
      alert('Failed to create user');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!banReason) { alert('A reason is required'); return; }
    try {
      const res = await fetch(`/api/admin/users/${userId}/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: banType, reason: banReason })
      });
      if (res.ok) {
        setBanningUser(null); setBanReason('');
        fetchUsers();
      }
    } catch (e) {
      alert('Failed to apply ban');
    }
  };

  const handleUnban = async (userId: string, restrictionId: string) => {
    if (!confirm('Remove this restriction?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/restrictions/${restrictionId}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (e) {}
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('WARNING: Irreversibly delete this user account?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div className="p-8 text-white/50 text-center">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Platform Users</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateUser} className="bg-black/40 border border-white/10 rounded-xl p-4 md:p-6 grid gap-4 grid-cols-1 md:grid-cols-4 items-end">
          <div className="space-y-1">
            <label className="text-xs text-white/50">Email</label>
            <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Designated Password</label>
            <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-200">
            Create Account
          </button>
        </form>
      )}

      <div className="space-y-4">
        {users.map(user => {
          const isOnline = user.presence?.state === 'ONLINE';
          const restrictions = user.restrictions || [];
          
          return (
            <div key={user.id} className="bg-black/30 border border-white/10 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between gap-6 transition-all hover:bg-black/50">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {user.displayName} 
                      {user.role === 'ADMIN' && <span className="text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded border border-primary/30 uppercase tracking-widest">Admin</span>}
                    </h3>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`}></div>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  {isOnline && user.presence?.currentMediaAssetId && (
                    <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                      <Activity size={12} /> Watching Media: {user.presence.currentMediaAssetId.slice(0,8)}...
                    </div>
                  )}
                  <div className="text-white/40 flex items-center gap-1">
                    <Key size={12} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {restrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {restrictions.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-md">
                        <ShieldAlert size={12} /> {r.type}: {r.reason}
                        <button onClick={() => handleUnban(user.id, r.id)} className="ml-2 text-white/50 hover:text-white underline">Unban</button>
                      </div>
                    ))}
                  </div>
                )}
                
                {banningUser === user.id && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 mt-3">
                    <select value={banType} onChange={e => setBanType(e.target.value)} className="bg-black border border-white/20 rounded p-1.5 text-sm text-white">
                      <option value="WATCH_BLOCK">Ban from Watching</option>
                      <option value="REVIEW_BLOCK">Ban from Reviewing</option>
                      <option value="LOGIN">Suspend Login</option>
                    </select>
                    <input type="text" placeholder="Reason..." value={banReason} onChange={e => setBanReason(e.target.value)} className="bg-black border border-white/20 rounded p-1.5 text-sm text-white flex-1" />
                    <button onClick={() => handleBanUser(user.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-red-600">Apply</button>
                    <button onClick={() => setBanningUser(null)} className="text-white/50 hover:text-white text-sm px-2">Cancel</button>
                  </div>
                )}
              </div>

              <div className="flex md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4">
                <button 
                  onClick={() => setBanningUser(user.id)}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors p-2 rounded hover:bg-yellow-500/10 w-full"
                >
                  <Ban size={16} /> Restrict
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors p-2 rounded hover:bg-red-500/10 mt-auto w-full"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
