'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import TMDBImportModal from '../../../../components/admin/TMDBImportModal';

export default function TMDBImportModalWrapper({ isButton = false }: { isButton?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleImportSuccess = (importedData: any) => {
    setIsOpen(false);
    router.push(`/admin/media/${importedData.id}`);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
      >
        <RefreshCw size={18} /> {isButton ? 'Search TMDB' : 'Auto-fill with TMDB'}
      </button>

      <TMDBImportModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
}
