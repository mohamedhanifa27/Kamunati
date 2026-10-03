import React from 'react';
import ProfileDashboard from '../../components/user/ProfileDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - Kamunati',
  description: 'Your profile dashboard.',
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
