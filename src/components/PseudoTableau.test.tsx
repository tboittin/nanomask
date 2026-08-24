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
    expect(screen.getAllByText('[EMAIL]').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('[TEL]').length).toBeGreaterThanOrEqual(1);
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
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    expect(boutons.length).toBeGreaterThanOrEqual(1);
  });

  it('ouvre le formulaire au clic sur Ajouter un pseudo', () => {
    render(<PseudoTableau {...props} />);
    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);
    expect(screen.getAllByPlaceholderText('Type (ex: PERSONNE)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Valeur').length).toBeGreaterThanOrEqual(1);
  });

  it('appelle onAjouterTag avec les valeurs saisies', () => {
    const onAjouterTag = vi.fn();
    render(<PseudoTableau {...props} onAjouterTag={onAjouterTag} />);

    const boutons = screen.getAllByText('+ Ajouter un pseudo');
    fireEvent.click(boutons[0]);

    const types = screen.getAllByPlaceholderText('Type (ex: PERSONNE)');
    const valeurs = screen.getAllByPlaceholderText('Valeur');
    fireEvent.change(types[0], { target: { value: 'PERSONNE' } });
    fireEvent.change(valeurs[0], { target: { value: 'Sophie' } });

    const ajouters = screen.getAllByText('Ajouter');
    fireEvent.click(ajouters[0]);

    expect(onAjouterTag).toHaveBeenCalledWith('PERSONNE', 'Sophie');
  });
});