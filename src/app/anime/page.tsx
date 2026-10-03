import React from 'react';
import BrowsePage from '../../components/browse/BrowsePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime - Kamunati',
  description: 'Browse our collection of anime.',
};

export default function AnimePage() {
  return (
    <BrowsePage 
      category="ANIME" 
      title="Anime" 
      emptyMessage="No anime here yet." 
      showContinueWatching={false} 
      showMyList={false} 
    />
  );
}
