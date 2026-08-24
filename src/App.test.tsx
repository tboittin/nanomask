import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as mammoth from 'mammoth';

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

const extractRawTextMock = vi.mocked(mammoth.extractRawText);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et la description', () => {
    render(<App />);
    expect(screen.getByText('NanoMask')).toBeInTheDocument();
    expect(
      screen.getByText(/pseudonymisation.*100% dans le navigateur/i),
    ).toBeInTheDocument();
  });

  it('affiche la zone de dépôt au démarrage', () => {
    render(<App />);
    expect(screen.getByText(/glisser-déposer.*\.docx/i)).toBeInTheDocument();
  });

  it('passe à l\'écran de revue après upload d\'un .docx', async () => {
    extractRawTextMock.mockResolvedValue({
      value: 'Contact : test@exemple.fr ou 0612345678. Mme Sophie Lambert.',
      messages: [],
    });

    render(<App />);

    const input = screen.getByTestId('input-fichier') as HTMLInputElement;
    const fichier = new File(['contenu'], 'rapport.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(input, { target: { files: [fichier] } });

    // L'analyse doit être lancée et afficher l'écran de revue
    await waitFor(() => {
      expect(screen.getByText(/Pseudos/)).toBeInTheDocument();
      expect(screen.getByText(/Valider et télécharger/)).toBeInTheDocument();
    });

    // Le mapping a été généré avec un email détecté
    expect(screen.getByText(/Texte pseudonymisé/)).toBeInTheDocument();
  });

  it('affiche une erreur si fichier invalide', async () => {
    render(<App />);

    const input = screen.getByTestId('input-fichier') as HTMLInputElement;
    const fichier = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [fichier] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Le fichier doit être au format .docx',
      );
    });
  });
});