import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar';
import { featureFlags } from '../../lib/featureFlags';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock theme store
vi.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({ motionLevel: 'standard' }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset flags
    featureFlags.categoryNav = false;
  });

  it('renders old navigation when flag is OFF', () => {
    render(<Navbar />);
    expect(screen.getByText('TV Shows')).toBeTruthy(); // Old link
    expect(screen.queryByText('Anime')).toBeNull(); // New link
  });

  it('renders exactly three category items when flag is ON', () => {
    featureFlags.categoryNav = true;
    render(<Navbar />);
    expect(screen.getByText('Movies')).toBeTruthy();
    expect(screen.getByText('TV Series')).toBeTruthy();
    expect(screen.getByText('Anime')).toBeTruthy();
    expect(screen.queryByText('TV Shows')).toBeNull();
  });
});
