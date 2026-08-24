import { useState, useRef, useCallback } from 'react';
import { PseudoTableau } from './PseudoTableau';
import { TexteApercu } from './TexteApercu';
import { PopupConfirmation } from './PopupConfirmation';
import { useRevue } from '../hooks/useRevue';
import type { Mapping } from '../utils/mapping';

interface EcranRevueProps {
  texteOriginal: string;
  mappingInitial: Mapping;
  onValider: (mappingFinal: Mapping, textePseudonymise: string) => void;
}

export function EcranRevue({
  texteOriginal,
  mappingInitial,
  onValider,
}: EcranRevueProps) {
  const revue = useRevue(texteOriginal, mappingInitial);
  const [popupOuverte, setPopupOuverte] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  const refPseudonymise = useRef<HTMLDivElement>(null);
  const refLisible = useRef<HTMLDivElement>(null);
  const syncing = useRef(false); // Évite la boucle de scroll

  const handleScroll = useCallback(
    (source: 'pseudo' | 'lisible') =>
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || syncing.current) return;
        syncing.current = true;

        const sourceEl = e.currentTarget;
        const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);

        const cible =
          source === 'pseudo' ? refLisible.current : refPseudonymise.current;
        if (cible) {
          cible.scrollTop = ratio * (cible.scrollHeight - cible.clientHeight || 1);
        }

        requestAnimationFrame(() => { syncing.current = false; });
      },
    [syncScroll],
  );

  const handleClicValider = () => {
    if (revue.mappingModifie) {
      setPopupOuverte(true);
    } else {
      onValider(revue.mappingFinal, revue.textePseudonymise);
    }
  };

  const handleContinuer = () => {
    setPopupOuverte(false);
    onValider(revue.mappingFinal, revue.textePseudonymise);
  };

  const handleRelancer = () => {
    setPopupOuverte(false);
    revue.reinitialiserMapping();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacement-md)' }}>
        {/* Volet gauche : tableau des pseudos */}
        <div
          style={{
            background: 'var(--couleur-surface)',
            border: '1px solid var(--couleur-bordure)',
            borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-md)',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <PseudoTableau
            tags={revue.tags}
            conflits={revue.conflits}
            tagSurbrillance={revue.tagSurbrillance}
            onTagClick={revue.mettreSurbrillance}
            onRenommer={revue.renommerTag}
            onSupprimer={revue.supprimerTag}
            onAjouterValeur={revue.ajouterValeur}
            onRetirerValeur={revue.retirerValeur}
            onAjouterTag={revue.ajouterTag}
          />
        </div>

        {/* Volet droit : aperçus texte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
          <div
            style={{
              background: 'var(--couleur-surface)',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              padding: 'var(--espacement-md)',
            }}
          >
            <TexteApercu
              titre="Texte pseudonymisé"
              texte={revue.textePseudonymise}
              mapping={revue.mappingFinal}
              tagSurbrillance={revue.tagSurbrillance}
              surlignerTags
              containerRef={refPseudonymise}
              onScroll={handleScroll('pseudo')}
            />
          </div>
          <div
            style={{
              background: 'var(--couleur-surface)',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              padding: 'var(--espacement-md)',
            }}
          >
            <TexteApercu
              titre="Texte lisible"
              texte={texteOriginal}
              mapping={revue.mappingFinal}
              tagSurbrillance={revue.tagSurbrillance}
              surlignerValeurs
              containerRef={refLisible}
              onScroll={handleScroll('lisible')}
            />
          </div>
        </div>
      </div>

      {/* Barre d'outils : scroll synchronisé + validation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--espacement-sm)',
            fontSize: '0.875rem',
            color: 'var(--couleur-texte-secondaire)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Scroll synchronisé
        </label>

        <button
          onClick={handleClicValider}
          style={{
            padding: 'var(--espacement-sm) var(--espacement-lg)',
            background: 'var(--couleur-primaire)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--rayon-bordure)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Valider et télécharger
        </button>
      </div>

      {popupOuverte && (
        <PopupConfirmation
          titre="Modifications détectées"
          message="Vous avez modifié le mapping. Voulez-vous relancer l'analyse depuis le rapport d'origine, ou continuer avec les données actuelles ?"
          boutonConfirmer="Continuer"
          boutonAnnuler="Relancer l'analyse"
          onConfirmer={handleContinuer}
          onAnnuler={handleRelancer}
        />
      )}
    </div>
  );
}