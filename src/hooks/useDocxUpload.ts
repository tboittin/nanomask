import { useState, useCallback } from 'react';
import * as mammoth from 'mammoth';
import type { Mapping } from '../utils/mapping';
import { chargerCleJson } from '../utils/mapping';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

interface UseDocxUploadReturn {
  fichier: File | null;
  texte: string | null;
  chargement: boolean;
  erreur: string | null;
  erreurCle: string | null;
  cle: Mapping | null;
  nomFichierCle: string | null;
  uploader: (file: File) => Promise<void>;
  uploaderCle: (file: File) => Promise<void>;
  reinitialiser: () => void;
}

export function useDocxUpload(): UseDocxUploadReturn {
  const [fichier, setFichier] = useState<File | null>(null);
  const [texte, setTexte] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cle, setCle] = useState<Mapping | null>(null);
  const [nomFichierCle, setNomFichierCle] = useState<string | null>(null);
  const [erreurCle, setErreurCle] = useState<string | null>(null);

  const reinitialiser = useCallback(() => {
    setFichier(null);
    setTexte(null);
    setChargement(false);
    setErreur(null);
    setCle(null);
    setNomFichierCle(null);
    setErreurCle(null);
  }, []);

  const uploader = useCallback(async (file: File) => {
    setErreur(null);
    setTexte(null);

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErreur('Le fichier doit être au format .docx');
      return;
    }

    if (file.size === 0) {
      setErreur('Le fichier est vide');
      return;
    }

    if (file.size > TAILLE_MAX_OCTETS) {
      setErreur(`Le fichier dépasse la limite de 10 Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo)`);
      return;
    }

    setFichier(file);
    setChargement(true);

    try {
      const buffer = await file.arrayBuffer();
      const resultat = await mammoth.extractRawText({ arrayBuffer: buffer });
      setTexte(resultat.value);

      if (resultat.messages.length > 0) {
        console.warn('Avertissements mammoth :', resultat.messages);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction';
      setErreur(`Impossible de lire le fichier : ${message}`);
      setFichier(null);
    } finally {
      setChargement(false);
    }
  }, []);

  const uploaderCle = useCallback(async (file: File) => {
    setErreurCle(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setErreurCle('La clé doit être au format .json');
      return;
    }

    try {
      const contenu = await file.text();
      const mapping = chargerCleJson(contenu);
      setCle(mapping);
      setNomFichierCle(file.name);
    } catch {
      setErreurCle('Fichier .key.json invalide ou corrompu');
    }
  }, []);

  return {
    fichier, texte, chargement, erreur,
    cle, nomFichierCle, erreurCle,
    uploader, uploaderCle, reinitialiser,
  };
}