import { describe, it, expect, vi } from 'vitest';
import { SEARCH_ICON_CATEGORIES } from './SearchIconCards';

describe('SearchIconCards', () => {
  it('should have standard icon search categories defined', () => {
    expect(SEARCH_ICON_CATEGORIES.length).toBeGreaterThanOrEqual(8);
  });

  it('should have valid queries for all icon cards', () => {
    SEARCH_ICON_CATEGORIES.forEach(cat => {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeTruthy();
      expect(cat.query).toBeTruthy();
      expect(cat.icon).toBeDefined();
      expect(cat.tagline).toBeTruthy();
    });
  });

  it('includes key entertainment categories like Action, Sci-Fi, Trending and Movies', () => {
    const queries = SEARCH_ICON_CATEGORIES.map(c => c.query);
    expect(queries).toContain('Trending');
    expect(queries).toContain('Action');
    expect(queries).toContain('Science Fiction');
    expect(queries).toContain('Movie');
  });
});
