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
  const [recentrer, setRecentrer] = useState(true);

  const [selection, setSelection] = useState<{ valeur: string; source: 'pseudo' | 'lisible' } | null>(null);
  const [pickerValeur, setPickerValeur] = useState<string | null>(null);

  const refPseudonymise = useRef<HTMLDivElement>(null);
  const refLisible = useRef<HTMLDivElement>(null);
  const refTableau = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const defilerTableauVers = useCallback((tag: string) => {
    const tableau = refTableau.current;
    if (tableau) {
      const lignes = tableau.querySelectorAll('tr[data-tag]');
      for (const ligne of lignes) {
        if (ligne.getAttribute('data-tag') === tag) {
          ligne.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  }, []);

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

    defilerTableauVers(tag);

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
  }, [revue.tagSurbrillance, defilerTableauVers]);

  const handleSelection = useCallback((valeur: string, source: 'pseudo' | 'lisible') => {
    setSelection({ valeur, source });
  }, []);

  const handleNouveauTag = useCallback(() => {
    if (!selection) return;
    const valeur = selection.valeur;
    // Si c'est un tag ([...]), l'utiliser comme type plutôt que valeur
    const matchTag = valeur.match(/^\[(\w+(?:_\d+)?)\]$/);
    if (matchTag) {
      revue.ajouterTag(matchTag[1], valeur);
    } else {
      revue.ajouterTag('PERSONNE', valeur);
    }
    setSelection(null);
  }, [selection, revue]);

  const handleNouvelleValeur = useCallback(() => {
    if (!selection) return;
    setPickerValeur(selection.valeur);
  }, [selection]);

  const handlePickerSelect = useCallback((tag: string) => {
    if (!pickerValeur) return;
    revue.ajouterValeur(tag, pickerValeur);
    revue.mettreSurbrillanceValeur(tag, pickerValeur);
    defilerTableauVers(tag);
    setPickerValeur(null);
    setSelection(null);
  }, [pickerValeur, revue, defilerTableauVers]);

  const handlePickerAnnuler = useCallback(() => {
    setPickerValeur(null);
    setSelection(null);
  }, []);

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
    defilerTableauVers(tag);
  }, [revue, defilerTableauVers]);

  const handleTexteTagClick = useCallback((tag: string) => {
    setSelection(null);
    revue.mettreSurbrillance(tag);
    defilerTableauVers(tag);
    if (recentrer) {
      handleRecentrer();
    }
  }, [revue, defilerTableauVers, recentrer, handleRecentrer]);

  const handleTexteValeurClick = useCallback((tag: string, valeur: string) => {
    setSelection(null);
    revue.mettreSurbrillanceValeur(tag, valeur);
    defilerTableauVers(tag);
    if (recentrer) {
      handleRecentrer();
    }
  }, [revue, defilerTableauVers, recentrer, handleRecentrer]);

  const tagsExistants = Object.keys(revue.mappingFinal);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <TexteApercu
              titre="Texte pseudonymisé"
              texte={revue.textePseudonymise}
              mapping={revue.mappingFinal}
              tagSurbrillance={revue.tagSurbrillance}
              surlignerTags
              containerRef={refPseudonymise}
              onScroll={handleScroll('pseudo')}
              onTagClick={handleTexteTagClick}
              onSelection={(v) => handleSelection(v, 'pseudo')}
            />
            {selection && selection.source === 'pseudo' && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                display: 'flex',
                gap: 'var(--espacement-xs)',
                padding: 'var(--espacement-sm)',
                zIndex: 10,
              }}>
                <BoutonAction label="Nouveau tag" onClick={handleNouveauTag} />
                <BoutonAction label="Nouvelle valeur" onClick={handleNouvelleValeur} />
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
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
              onSelection={(v) => handleSelection(v, 'lisible')}
            />
            {selection && selection.source === 'lisible' && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                display: 'flex',
                gap: 'var(--espacement-xs)',
                padding: 'var(--espacement-sm)',
                zIndex: 10,
              }}>
                <BoutonAction label="Nouveau tag" onClick={handleNouveauTag} />
                <BoutonAction label="Nouvelle valeur" onClick={handleNouvelleValeur} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--espacement-md)', alignItems: 'center' }}>
          <CheckboxInput
            checked={syncScroll}
            onChange={setSyncScroll}
            label="Scroll synchronisé"
          />
          <CheckboxInput
            checked={recentrer}
            onChange={setRecentrer}
            label="Recentrer auto"
          />
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

      {/* Picker de tag pour Nouvelle valeur */}
      {pickerValeur && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handlePickerAnnuler}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 'var(--rayon-bordure)',
              padding: 'var(--espacement-lg)',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte)' }}>
              Ajouter à quel tag ?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--couleur-texte-secondaire)', marginBottom: 'var(--espacement-md)' }}>
              Valeur : <strong>{pickerValeur}</strong>
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--espacement-xs)' }}>
              {tagsExistants.length === 0 ? (
                <p style={{ color: 'var(--couleur-texte-secondaire)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  Aucun tag existant. Créez d'abord un nouveau tag.
                </p>
              ) : (
                tagsExistants.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handlePickerSelect(tag)}
                    style={{
                      padding: 'var(--espacement-sm) var(--espacement-md)',
                      background: 'var(--couleur-surface)',
                      border: '1px solid var(--couleur-bordure)',
                      borderRadius: 'var(--rayon-bordure)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--police-mono)',
                      color: 'var(--couleur-texte)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--couleur-fond)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--couleur-surface)'; }}
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
            <div style={{ marginTop: 'var(--espacement-md)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handlePickerAnnuler}
                style={{
                  padding: 'var(--espacement-sm) var(--espacement-md)',
                  background: 'none',
                  border: '1px solid var(--couleur-bordure)',
                  borderRadius: 'var(--rayon-bordure)',
                  cursor: 'pointer',
                  color: 'var(--couleur-texte-secondaire)',
                  fontSize: '0.875rem',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
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

function CheckboxInput({ checked, onChange, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
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
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}

function BoutonAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: '4px 10px',
        background: 'var(--couleur-primaire)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--rayon-bordure)',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {label}
    </button>
  );
}