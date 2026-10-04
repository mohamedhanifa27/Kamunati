import React from 'react';
import UsersTable from '../../../components/admin/UsersTable';

export default function AdminUsersPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-heading">User Management</h1>
        <p className="text-white/40 text-sm mt-1">Manage accounts, enforce watch/review bans, and monitor active presence.</p>
      </div>

      <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-2xl">
        <UsersTable />
      </div>
    </div>
  );
}
