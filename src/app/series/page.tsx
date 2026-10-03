import React from 'react';
import BrowsePage from '../../components/browse/BrowsePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TV Series - Kamunati',
  description: 'Browse our collection of TV series.',
};

export default function SeriesPage() {
  return (
    <BrowsePage 
      category="TV_SERIES" 
      title="TV Series" 
      emptyMessage="No TV series here yet." 
      showContinueWatching={false} 
      showMyList={false} 
    />
  );
}
