import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EcranRevue } from './EcranRevue';

const TEXTE = 'Contact : test@exemple.fr ou 0612345678';
const MAPPING = { '[EMAIL]': ['test@exemple.fr'] };

describe('EcranRevue', () => {
  it('affiche le tableau des tags', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('[EMAIL]')).toBeInTheDocument();
  });

  it('affiche le texte pseudonymisé', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
    expect(screen.getByText('[EMAIL]')).toBeInTheDocument();
  });

  it('affiche le texte lisible', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText(/Texte lisible/)).toBeInTheDocument();
  });

  it('affiche le bouton Valider', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('Valider et télécharger')).toBeInTheDocument();
  });

  it('appelle onValider au clic sur le bouton', () => {
    const onValider = vi.fn();
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={onValider} />);

    fireEvent.click(screen.getByText('Valider et télécharger'));

    expect(onValider).toHaveBeenCalledTimes(1);
    expect(onValider).toHaveBeenCalledWith(
      expect.objectContaining({ '[EMAIL]': ['test@exemple.fr'] }),
      expect.stringContaining('[EMAIL]'),
    );
  });

  it('affiche le bouton + Ajouter un pseudo', () => {
    render(<EcranRevue texteOriginal={TEXTE} mappingInitial={MAPPING} onValider={vi.fn()} />);
    expect(screen.getByText('+ Ajouter un pseudo')).toBeInTheDocument();
  });
});