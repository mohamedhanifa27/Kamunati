import React from 'react';
import BrowsePage from '../../components/browse/BrowsePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies - Kamunati',
  description: 'Browse our collection of movies.',
};

export default function MoviesPage() {
  return (
    <BrowsePage 
      category="MOVIE" 
      title="Movies" 
      emptyMessage="No movies here yet." 
      showContinueWatching={false} 
      showMyList={false} 
    />
  );
}
