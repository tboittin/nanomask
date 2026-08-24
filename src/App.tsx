import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { EcranRevue } from './components/EcranRevue';
import { useDocxUpload } from './hooks/useDocxUpload';
import { analyserTexte, deduplicator } from './utils/analyse';
import { genererMapping } from './utils/mapping';
import type { Mapping } from './utils/mapping';

type Etape = 'upload' | 'revue';

function App() {
  const { fichier, texte, chargement, erreur, uploader, reinitialiser } = useDocxUpload();
  const [etape, setEtape] = useState<Etape>('upload');
  const [mapping, setMapping] = useState<Mapping | null>(null);

  const handleFichierChoisi = useCallback(
    async (file: File) => {
      await uploader(file);
    },
    [uploader],
  );

  // Quand le texte est extrait par useDocxUpload, lancer l'analyse une seule fois
  useEffect(() => {
    if (texte !== null) {
      const detections = analyserTexte(texte);
      const groupes = deduplicator(detections);
      const mappingGenere = genererMapping(groupes);
      setMapping(mappingGenere);
      setEtape('revue');
    }
  }, [texte]);

  const handleValider = useCallback(
    (mappingFinal: Mapping, textePseudonymise: string) => {
      // Phase 6 : brancher le téléchargement ici
      console.log('Mapping final :', mappingFinal);
      console.log('Texte pseudonymisé :', textePseudonymise);
    },
    [],
  );

  const handleRetour = useCallback(() => {
    reinitialiser();
    setMapping(null);
    setEtape('upload');
  }, [reinitialiser]);

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--espacement-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--espacement-lg)',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--couleur-texte)' }}>
          NanoMask
        </h1>
        <p style={{ color: 'var(--couleur-texte-secondaire)', marginTop: 'var(--espacement-xs)' }}>
          Pseudonymisation de rapports de psychologue — 100% dans le navigateur.
        </p>
      </header>

      {etape === 'upload' && (
        <section>
          <FileDropZone
            onFichierChoisi={handleFichierChoisi}
            chargement={chargement}
            erreur={erreur}
            fichierCourant={fichier?.name ?? null}
          />
        </section>
      )}

      {etape === 'revue' && mapping && texte && (
        <section>
          <EcranRevue
            texteOriginal={texte}
            mappingInitial={mapping}
            onValider={handleValider}
          />
          <div style={{ marginTop: 'var(--espacement-md)', textAlign: 'center' }}>
            <button
              onClick={handleRetour}
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
              ← Recommencer avec un autre fichier
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;