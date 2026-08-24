import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('affiche le titre principal', () => {
    render(<App />);
    expect(screen.getByText('NanoMask')).toBeInTheDocument();
  });

  it('affiche la description', () => {
    render(<App />);
    expect(
      screen.getByText(/pseudonymisation.*100% dans le navigateur/i),
    ).toBeInTheDocument();
  });
});