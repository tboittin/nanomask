import { useState, useRef, useCallback, useMemo } from 'react';
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
  const [selectionPopup, setSelectionPopup] = useState<{ valeur: string } | null>(null);

  const refPseudonymise = useRef<HTMLDivElement>(null);
  const refLisible = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

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

  const handleRecentrer = useCallback(() => {
    const tag = revue.tagSurbrillance;
    if (!tag) return;

    // Recentrer le tableau sur la ligne highlightée
    const tableau = refTableau.current;
    if (tableau) {
      const ligne = tableau.querySelector(`[data-tag="${tag}"]`);
      if (ligne) {
        ligne.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Recentrer le texte pseudonymisé sur le tag
    const pseudo = refPseudonymise.current;
    if (pseudo) {
      const spans = pseudo.querySelectorAll('span');
      for (const span of spans) {
        if (span.textContent === tag) {
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  }, [revue.tagSurbrillance]);

  const handleSelection = useCallback((valeur: string) => {
    // Vérifier si la sélection correspond à une valeur existante dans le mapping
    const existe = Object.entries(revue.mappingFinal).some(([, valeurs]) =>
      valeurs.some(v => v.toLowerCase() === valeur.toLowerCase()),
    );
    if (!existe) {
      setSelectionPopup({ valeur });
    }
  }, [revue.mappingFinal]);

  const handleCreerTagDepuisSelection = useCallback(() => {
    if (!selectionPopup) return;
    // Déterminer un type basé sur la première lettre ou un défaut
    const valeur = selectionPopup.valeur;
    // Chercher un type existant dans le mapping qui pourrait correspondre
    const typeExistant = Object.keys(revue.mappingFinal).find(t =>
      revue.mappingFinal[t].some(v =>
        v.toLowerCase().includes(valeur.toLowerCase()) ||
        valeur.toLowerCase().includes(v.toLowerCase()),
      ),
    );
    const type = typeExistant
      ? typeExistant.replace(/^\[/, '').replace(/_\d+\]$/, '').replace(/\]$/, '')
      : 'PERSONNE';
    revue.ajouterTag(type, valeur);
    revue.mettreSurbrillanceValeur(`[${type}]`, valeur);
    setSelectionPopup(null);
  }, [selectionPopup, revue]);

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

  const handleTagClick = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
  }, [revue]);

  const handleValeurClick = useCallback((tag: string, valeur: string) => {
    revue.mettreSurbrillanceValeur(tag, valeur);
  }, [revue]);

  const handleTexteTagClick = useCallback((tag: string) => {
    revue.mettreSurbrillance(tag);
    // Auto-scroll si pas de sync scroll
    const tableau = refTableau.current;
    if (tableau) {
      const ligne = tableau.querySelector(`[data-tag="${tag}"]`);
      if (ligne) {
        ligne.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [revue]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    revue.mettreSurbrillanceValeur(tag, valeur);
  }, [revue]);

  const tagRecherche = useMemo(() => revue.tagSurbrillance, [revue.tagSurbrillance]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacement-md)' }}>
        {/* Volet gauche : tableau des pseudos */}
        <div
          ref={refTableau}
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
            valeurSurbrillance={revue.valeurSurbrillance}
            onTagClick={handleTagClick}
            onValeurClick={handleValeurClick}
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
              onTagClick={handleTexteTagClick}
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
              valeurSurbrillance={revue.valeurSurbrillance}
              surlignerValeurs
              containerRef={refLisible}
              onScroll={handleScroll('lisible')}
              onValeurClick={handleTexteValeurClick}
              onSelection={handleSelection}
            />
          </div>
        </div>
      </div>

      {/* Barre d'outils : scroll synchronisé + recentrer + validation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--espacement-md)', alignItems: 'center' }}>
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
          {tagRecherche && (
            <button
              onClick={handleRecentrer}
              style={{
                padding: '4px 10px',
                background: 'none',
                border: '1px solid var(--couleur-bordure)',
                borderRadius: 'var(--rayon-bordure)',
                cursor: 'pointer',
                color: 'var(--couleur-texte-secondaire)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Recentrer sur l'élément sélectionné"
            >
              🎯 Recentrer
            </button>
          )}
        </div>

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

      {selectionPopup && (
        <PopupConfirmation
          titre="Nouveau pseudo détecté"
          message={`Voulez-vous créer un tag pour la valeur « ${selectionPopup.valeur} » ?`}
          boutonConfirmer="Créer le tag"
          boutonAnnuler="Ignorer"
          onConfirmer={handleCreerTagDepuisSelection}
          onAnnuler={() => setSelectionPopup(null)}
        />
      )}

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