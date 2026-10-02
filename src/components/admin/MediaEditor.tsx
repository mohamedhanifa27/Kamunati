'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertTriangle, Eye, Star } from 'lucide-react';

const mediaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  overview: z.string().optional(),
  type: z.enum(['MOVIE', 'SERIES']),
  posterPath: z.string().url().optional().or(z.literal('')),
  backdropPath: z.string().url().optional().or(z.literal('')),
  releaseYear: z.number().int().min(1900).max(2100).optional().or(z.nan()),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

type MediaFormValues = z.infer<typeof mediaSchema>;

interface MediaEditorProps {
  initialData?: any;
  onSave: (data: MediaFormValues) => void;
}

export default function MediaEditor({ initialData, onSave }: MediaEditorProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      title: initialData?.title || '',
      overview: initialData?.overview || '',
      type: initialData?.type || 'MOVIE',
      posterPath: initialData?.posterPath || '',
      backdropPath: initialData?.backdropPath || '',
      releaseYear: initialData?.releaseYear || new Date().getFullYear(),
      isPublished: initialData?.isPublished ?? false,
      isFeatured: initialData?.isFeatured ?? false,
    }
  });

  const posterPath = watch('posterPath');
  const type = watch('type');

  return (
    <form onSubmit={handleSubmit(onSave)} className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-xl flex gap-8">
      
      {/* Poster Preview */}
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <div className="aspect-[2/3] bg-neutral-900 rounded-lg overflow-hidden border border-white/10 shadow-inner relative">
          {posterPath ? (
            <img src={posterPath} alt="Poster preview" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm font-medium">No Poster</div>
          )}
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" {...register('isPublished')} className="w-5 h-5 accent-primary bg-black border-white/20 rounded" />
            <div className="flex flex-col">
              <span className="text-white font-medium flex items-center gap-2"><Eye size={16}/> Published</span>
              <span className="text-white/40 text-xs">Visible to users</span>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 accent-primary bg-black border-white/20 rounded" />
            <div className="flex flex-col">
              <span className="text-white font-medium flex items-center gap-2"><Star size={16}/> Featured</span>
              <span className="text-white/40 text-xs">Pin to Billboard</span>
            </div>
          </label>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-white/70">Title</label>
            <input 
              {...register('title')} 
              className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Media Type</label>
            <select 
              {...register('type')} 
              className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              <option value="MOVIE">Movie</option>
              <option value="SERIES">TV Series</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Overview Synopsis</label>
          <textarea 
            {...register('overview')} 
            rows={4}
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Poster URL</label>
            <input 
              {...register('posterPath')} 
              className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Release Year</label>
            <input 
              type="number"
              {...register('releaseYear', { valueAsNumber: true })} 
              className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        {type === 'SERIES' && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 mt-4">
            <AlertTriangle size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              TV Series detected. After saving this parent metadata, a separate panel will appear below to let you map specific seasons and episodes to their respective torrents.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95">
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}
