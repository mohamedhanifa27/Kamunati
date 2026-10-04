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
    // @ts-ignore`n    featureFlags.newBottomNav = false;
  });

  it('renders old bottom nav when flag is OFF', () => {
    render(<FloatingNavDock />);
    expect(document.querySelector('.tabler-icon-settings')).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('renders exactly five new items and no Admin when flag is ON', () => {
    // @ts-ignore`n    featureFlags.newBottomNav = true;
    render(<FloatingNavDock />);
    expect(document.querySelector('.tabler-icon-home')).toBeTruthy();
    expect(document.querySelector('.tabler-icon-search')).toBeTruthy();
    expect(document.querySelector('.tabler-icon-list-details')).toBeTruthy();
    expect(document.querySelector('.tabler-icon-user')).toBeTruthy();
    expect(document.querySelector('.tabler-icon-settings')).toBeTruthy();
    
    expect(screen.queryByText('Admin')).toBeNull();
  });
});



