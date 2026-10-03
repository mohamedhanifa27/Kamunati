import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloatingNavDock } from './FloatingNavDock';
import { featureFlags } from '../../lib/featureFlags';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('FloatingNavDock Component', () => {
  beforeEach(() => {
    featureFlags.newBottomNav = false;
  });

  it('renders old bottom nav when flag is OFF', () => {
    render(<FloatingNavDock />);
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('renders exactly five new items and no Admin when flag is ON', () => {
    featureFlags.newBottomNav = true;
    render(<FloatingNavDock />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    
    expect(screen.queryByText('Admin')).toBeNull();
  });
});
