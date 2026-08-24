import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocxUpload } from './useDocxUpload';
import * as mammoth from 'mammoth';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

function creerFichierMock(contenu: ArrayBuffer, nom = 'rapport.docx'): File {
  return new File([contenu], nom, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function creerCleMock(mapping: Record<string, string[]>, nom = 'key.json'): File {
  return new File([JSON.stringify(mapping)], nom, { type: 'application/json' });
}

describe('useDocxUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractRawTextMock.mockReset();
  });

  it('retourne l\'état initial', () => {
    const { result } = renderHook(() => useDocxUpload());
    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.cle).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
    expect(result.current.erreurCle).toBeNull();
  });

  it('rejette un fichier qui n\'est pas .docx', async () => {
    const { result } = renderHook(() => useDocxUpload());
    const fauxDoc = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploader(fauxDoc);
    });

    expect(result.current.erreur).toBe('Le fichier doit être au format .docx');
    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
  });

  it('rejette un fichier vide', async () => {
    const { result } = renderHook(() => useDocxUpload());
    const vide = new File([], 'vide.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await act(async () => {
      await result.current.uploader(vide);
    });

    expect(result.current.erreur).toBe('Le fichier est vide');
  });

  it('extrait le texte d\'un fichier .docx valide', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Bonjour ceci est un rapport de psychologie.',
      messages: [],
    });

    const { result } = renderHook(() => useDocxUpload());
    const fichier = creerFichierMock(new ArrayBuffer(8));

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toBeNull();
    expect(result.current.fichier).toBe(fichier);
    expect(result.current.texte).toBe('Bonjour ceci est un rapport de psychologie.');
  });

  it('gère une erreur d\'extraction', async () => {
    extractRawTextMock.mockRejectedValue(new Error('fichier corrompu'));

    const { result } = renderHook(() => useDocxUpload());
    const fichier = creerFichierMock(new ArrayBuffer(8));

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.erreur).toContain('Impossible de lire le fichier');
    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
  });

  it('charge une clé .key.json valide', async () => {
    const { result } = renderHook(() => useDocxUpload());
    const mapping = { '[EMAIL]': ['test@exemple.fr'] };
    const fichierCle = creerCleMock(mapping);

    await act(async () => {
      await result.current.uploaderCle(fichierCle);
    });

    expect(result.current.cle).toEqual(mapping);
    expect(result.current.nomFichierCle).toBe('key.json');
    expect(result.current.erreurCle).toBeNull();
  });

  it('rejette une clé invalide', async () => {
    const { result } = renderHook(() => useDocxUpload());
    const fichierInvalide = new File(['pas du json'], 'key.json', { type: 'application/json' });

    await act(async () => {
      await result.current.uploaderCle(fichierInvalide);
    });

    expect(result.current.erreurCle).toBe('Fichier .key.json invalide ou corrompu');
    expect(result.current.cle).toBeNull();
  });

  it('rejette une clé qui n\'est pas .json', async () => {
    const { result } = renderHook(() => useDocxUpload());
    const fichier = new File(['{}'], 'cle.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploaderCle(fichier);
    });

    expect(result.current.erreurCle).toBe('La clé doit être au format .json');
  });

  it('reinitialise tout', async () => {
    extractRawTextMock.mockResolvedValue({ value: 'texte', messages: [] });

    const { result } = renderHook(() => useDocxUpload());
    await act(async () => {
      await result.current.uploader(creerFichierMock(new ArrayBuffer(8)));
    });

    expect(result.current.texte).toBe('texte');

    act(() => {
      result.current.reinitialiser();
    });

    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
    expect(result.current.cle).toBeNull();
    expect(result.current.nomFichierCle).toBeNull();
    expect(result.current.erreurCle).toBeNull();
  });
});