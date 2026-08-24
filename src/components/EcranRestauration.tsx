import { useCallback } from 'react';
import { FileDropZone } from './FileDropZone';
import { useRestauration } from '../hooks/useRestauration';
import { buildDocx } from '../utils/buildDocx';
import { declencherTelechargement } from '../utils/telechargement';

export function EcranRestauration() {
  const {
    texteRestauré,
    chargement,
    erreur,
    fichierDocx,
    nomFichierCle,
    handleDocxChoisi,
    handleCleChoisie,
    reinitialiser,
  } = useRestauration();

  const handleTelecharger = useCallback(async () => {
    if (!texteRestauré || !fichierDocx) return;
    const nomBase = fichierDocx.name.replace(/\.docx$/i, '') + '-restauré';
    const blob = await buildDocx(texteRestauré);
    declencherTelechargement(blob, `${nomBase}.docx`);
  }, [texteRestauré, fichierDocx]);

  const estPret = texteRestauré !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)' }}>
          Rapport modifié (avec des tags)
        </h3>
        <FileDropZone
          onFichierChoisi={handleDocxChoisi}
          chargement={chargement}
          erreur={erreur}
          fichierCourant={fichierDocx?.name ?? null}
        />
      </div>

      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte-secondaire)' }}>
          Clé .key.json correspondante
        </h3>
        <FileDropZone
          onFichierChoisi={handleCleChoisie}
          fichierCourant={nomFichierCle}
        />
      </div>

      {estPret && (
        <div
          style={{
            background: 'var(--couleur-surface)',
            border: '1px solid var(--couleur-bordure)',
            borderRadius: 'var(--rayon-bordure)',
            padding: 'var(--espacement-md)',
          }}
        >
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 var(--espacement-sm) 0' }}>
            Aperçu du texte restauré
          </h4>
          <div
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: 'var(--espacement-sm)',
              background: 'white',
              border: '1px solid var(--couleur-bordure)',
              borderRadius: 'var(--rayon-bordure)',
              color: 'var(--couleur-texte)',
            }}
          >
            {texteRestauré}
          </div>
        </div>
      )}

      {estPret && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--espacement-sm)' }}>
          <button
            onClick={reinitialiser}
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
            Recommencer
          </button>
          <button
            onClick={handleTelecharger}
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
            Télécharger le rapport restauré
          </button>
        </div>
      )}
    </div>
  );
}