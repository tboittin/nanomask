import { describe, it, expect } from 'vitest';
import { buildDocx } from './buildDocx';

describe('buildDocx', () => {
  it('retourne un Blob', async () => {
    const blob = await buildDocx('Bonjour');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('retourne un Blob avec le bon type MIME', async () => {
    const blob = await buildDocx('Test');
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('retourne un Blob non vide pour un texte normal', async () => {
    const blob = await buildDocx('Bonjour le monde');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('gère un texte multiligne', async () => {
    const texte = 'Ligne 1\nLigne 2\nLigne 3';
    const blob = await buildDocx(texte);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('gère un texte vide', async () => {
    const blob = await buildDocx('');
    expect(blob.size).toBeGreaterThan(0); // un document vide reste un .docx valide
  });
});