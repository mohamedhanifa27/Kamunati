import { render, screen } from '@testing-library/react';
import MediaRow from './MediaRow';
import { vi } from 'vitest';

// Mock intersection observer for framer-motion/tailwind if needed
beforeAll(() => {
  const IntersectionObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
  }));
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
});

describe('MediaRow Component', () => {
  const mockItems = [
    { id: '1', title: 'The Matrix', posterUrl: '/matrix.jpg', qualityBadge: 'HD' },
    { id: '2', title: 'Inception', posterUrl: '/inception.jpg' }
  ];

  it('renders the row title', () => {
    render(<MediaRow title="Trending Now" items={mockItems} />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('renders all media items', () => {
    render(<MediaRow title="Trending Now" items={mockItems} />);
    
    const image1 = screen.getByAltText('The Matrix');
    const image2 = screen.getByAltText('Inception');
    
    expect(image1).toBeInTheDocument();
    expect(image2).toBeInTheDocument();
    expect(image1).toHaveAttribute('src', '/matrix.jpg');
  });

  it('renders quality badge if provided', () => {
    render(<MediaRow title="Trending Now" items={mockItems} />);
    expect(screen.getByText('HD')).toBeInTheDocument();
  });
});
