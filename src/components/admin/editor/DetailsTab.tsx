'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertTriangle, Eye, Star, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const detailsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  originalName: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  tagline: z.string().optional(),
  hoverTagline: z.string().max(120, 'Max 120 characters').optional(),
  overview: z.string().optional(),
  type: z.enum(['MOVIE', 'SERIES']),
  category: z.enum(['MOVIE', 'TV_SERIES', 'ANIME']),
  releaseYear: z.number().int().min(1900).max(2100).optional().or(z.nan()),
  runtime: z.number().optional().or(z.nan()),
  maturityRating: z.string().optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export default function DetailsTab({ data }: { data: any }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, watch, reset } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: data?.title || '',
      originalName: data?.originalName || '',
      slug: data?.id || '', // Using id as slug for now if slug doesn't exist
      tagline: data?.tagline || '',
      hoverTagline: data?.hoverTagline || '',
      overview: data?.overview || '',
      type: data?.type || 'MOVIE',
      category: data?.category || 'MOVIE',
      releaseYear: data?.releaseYear || new Date().getFullYear(),
      runtime: data?.runtime || 0,
      maturityRating: data?.maturityRating || '',
      isPublished: data?.isPublished ?? false,
      isFeatured: data?.isFeatured ?? false,
    }
  });

  const hoverTaglineLength = watch('hoverTagline')?.length || 0;

  const onSave = async (formData: DetailsFormValues) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/titles/${data.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      reset(formData); // clear dirty state
      alert('Details saved successfully');
      if (!data?.id) { router.push(`/admin/media/${formData.slug}`); } else { router.refresh(); }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Metadata Details</h2>
          <p className="text-white/40 text-sm mt-1">Core information about this title.</p>
        </div>
        <button 
          disabled={!isDirty || isSaving}
          className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-sm font-medium text-white/70">Title</label>
          <input 
            {...register('title')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-sm font-medium text-white/70">Slug</label>
          <input 
            {...register('slug')} 
            disabled={!!data?.id} // Disabled if existing
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug.message}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            Structure Type
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">Affects seasons/episodes</span>
          </label>
          <select 
            {...register('type')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="MOVIE">Movie (Single File)</option>
            <option value="SERIES">Series (Seasons & Episodes)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            Category
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">Display only</span>
          </label>
          <select 
            {...register('category')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="MOVIE">Movie</option>
            <option value="TV_SERIES">TV Series</option>
            <option value="ANIME">Anime</option>
          </select>
          <p className="text-xs text-white/40 mt-1">Anime can be a movie or a series. Structure comes from the Structure Type above.</p>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="text-sm font-medium text-white/70">Tagline</label>
          <input 
            {...register('tagline')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <label className="flex items-center justify-between text-sm font-medium text-white/70">
            <span>Hover Tagline (Billboard)</span>
            <span className={`text-xs ${hoverTaglineLength > 120 ? 'text-red-400' : 'text-white/40'}`}>
              {hoverTaglineLength}/120
            </span>
          </label>
          <input 
            {...register('hoverTagline')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
          />
          {errors.hoverTagline && <p className="text-red-400 text-xs mt-1">{errors.hoverTagline.message}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-white/70">Synopsis</label>
          <textarea 
            {...register('overview')} 
            rows={4}
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors resize-none"
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Maturity Rating</label>
          <input 
            {...register('maturityRating')} 
            className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. TV-MA, PG-13"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
        <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
          <input type="checkbox" {...register('isPublished')} className="w-5 h-5 mt-0.5 accent-primary bg-black border-white/20 rounded" />
          <div className="flex flex-col">
            <span className="text-white font-medium flex items-center gap-2"><Eye size={16}/> Published</span>
            <span className="text-white/50 text-sm mt-1">Make this title visible to users. You can toggle this off to hide it temporarily.</span>
          </div>
        </label>
        
        <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
          <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 mt-0.5 accent-primary bg-black border-white/20 rounded" />
          <div className="flex flex-col">
            <span className="text-white font-medium flex items-center gap-2"><Star size={16}/> Featured Billboard</span>
            <span className="text-white/50 text-sm mt-1">Pin this title to the hero billboard on the homepage.</span>
          </div>
        </label>
      </div>

      {isDirty && (
        <div className="fixed bottom-8 right-8 bg-black border border-white/20 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <AlertTriangle className="text-yellow-500" />
          <span className="text-white font-medium">You have unsaved changes in Details</span>
          <button 
            disabled={isSaving}
            className="bg-primary hover:bg-primary-hover text-white font-medium py-1.5 px-4 rounded-lg transition-colors ml-4"
          >
            Save
          </button>
        </div>
      )}
    </form>
  );
}



