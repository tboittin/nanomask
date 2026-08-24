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

  it('reinitialise l\'état', async () => {
    extractRawTextMock.mockResolvedValue({ value: 'texte', messages: [] });

    const { result } = renderHook(() => useDocxUpload());
    const fichier = creerFichierMock(new ArrayBuffer(8));

    await act(async () => {
      await result.current.uploader(fichier);
    });

    expect(result.current.texte).toBe('texte');

    act(() => {
      result.current.reinitialiser();
    });

    expect(result.current.fichier).toBeNull();
    expect(result.current.texte).toBeNull();
    expect(result.current.chargement).toBe(false);
    expect(result.current.erreur).toBeNull();
  });
});