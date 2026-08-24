import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PseudoTableau } from './PseudoTableau';

const TAGS = [
  { tag: '[EMAIL]', valeurs: ['test@exemple.fr'], estNouveau: false },
  { tag: '[TEL]', valeurs: ['0612345678'], estNouveau: true },
];

const CONFLITS = [
  { type: 'doublon' as const, tag: '[EMAIL]', message: '"test@exemple.fr" existe aussi dans [EMAIL2]' },
];

describe('PseudoTableau', () => {
  const props = {
    tags: TAGS,
    conflits: CONFLITS,
    tagSurbrillance: null,
    onTagClick: vi.fn(),
    onRenommer: vi.fn(),
    onSupprimer: vi.fn(),
    onAjouterValeur: vi.fn(),
    onRetirerValeur: vi.fn(),
    onAjouterTag: vi.fn(),
  };

  it('affiche les tags', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText('[EMAIL]')).toBeInTheDocument();
    expect(screen.getByText('[TEL]')).toBeInTheDocument();
  });

  it('affiche les valeurs', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText('test@exemple.fr')).toBeInTheDocument();
    expect(screen.getByText('0612345678')).toBeInTheDocument();
  });

  it('affiche les conflits', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText(/existe aussi dans/)).toBeInTheDocument();
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    render(<PseudoTableau {...props} />);
    expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
  });

  it('ouvre le formulaire au clic sur Ajouter un pseudo', () => {
    render(<PseudoTableau {...props} />);
    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    expect(screen.getByPlaceholderText('Type (ex: PERSONNE)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Valeur')).toBeInTheDocument();
  });

  it('appelle onAjouterTag avec les valeurs saisies', () => {
    const onAjouterTag = vi.fn();
    render(<PseudoTableau {...props} onAjouterTag={onAjouterTag} />);

    fireEvent.click(screen.getByText('+ Ajouter un pseudo'));
    fireEvent.change(screen.getByPlaceholderText('Type (ex: PERSONNE)'), { target: { value: 'PERSONNE' } });
    fireEvent.change(screen.getByPlaceholderText('Valeur'), { target: { value: 'Sophie' } });
    fireEvent.click(screen.getByText('Ajouter'));

    expect(onAjouterTag).toHaveBeenCalledWith('PERSONNE', 'Sophie');
  });
});