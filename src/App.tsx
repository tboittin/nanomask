import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { EcranRevue } from './components/EcranRevue';
import { EcranRestauration } from './components/EcranRestauration';
import { useDocxUpload } from './hooks/useDocxUpload';
import { analyserTexte, fusionnerAvecMappingExistant } from './utils/analyse';
import { genererCleJson } from './utils/mapping';
import type { Mapping } from './utils/mapping';
import { buildDocx } from './utils/buildDocx';
import { declencherTelechargement } from './utils/telechargement';

type Onglet = 'anonymiser' | 'restaurer';
type Etape = 'upload' | 'revue';

function App() {
  const [onglet, setOnglet] = useState<Onglet>('anonymiser');
  const [messageSucces, setMessageSucces] = useState<string | null>(null);
  const {
    fichier, texte, chargement, erreur,
    cle, erreurCle, nomFichierCle,
    uploader, uploaderCle, reinitialiser,
  } = useDocxUpload();

  const [etape, setEtape] = useState<Etape>('upload');
  const [mapping, setMapping] = useState<Mapping | null>(null);

  const handleFichierChoisi = useCallback(
    async (file: File) => { await uploader(file); },
    [uploader],
  );

  const handleCleChoisie = useCallback(
    async (file: File) => { await uploaderCle(file); },
    [uploaderCle],
  );

  // Quand le texte est extrait, lancer l'analyse et fusionner avec la clé existante
  useEffect(() => {
    if (texte !== null) {
      const detections = analyserTexte(texte);
      const mappingGenere = fusionnerAvecMappingExistant(cle, detections);
      setMapping(mappingGenere);
      setEtape('revue');
    }
  }, [texte, cle]);

  const handleValider = useCallback(
      async (mappingFinal: Mapping, textePseudonymise: string) => {
        const nomBase = fichier?.name.replace(/\\.docx$/i, '') ?? 'rapport';

        // Télécharger le .docx pseudonymisé
        const blobDocx = await buildDocx(textePseudonymise);
        declencherTelechargement(blobDocx, `${nomBase}-pseudonymise.docx`);

        // Télécharger la clé .key.json
        const contenuCle = genererCleJson(mappingFinal);
        const blobCle = new Blob([contenuCle], { type: 'application/json' });
        declencherTelechargement(blobCle, `${nomBase}.key.json`);

        setMessageSucces('Fichiers téléchargés avec succès ✓');
        setTimeout(() => setMessageSucces(null), 5000);
      },
      [fichier],
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

      {/* Navigation par onglets */}
      <nav
        style={{
          display: 'flex',
          gap: 'var(--espacement-xs)',
          borderBottom: '1px solid var(--couleur-bordure)',
          paddingBottom: 'var(--espacement-xs)',
        }}
      >
        {(['anonymiser', 'restaurer'] as const).map((o) => (
          <button
            key={o}
            onClick={() => {
              setOnglet(o);
              setMessageSucces(null);
              if (o !== 'anonymiser') {
                reinitialiser();
                setMapping(null);
                setEtape('upload');
              }
            }}
            style={{
              padding: 'var(--espacement-sm) var(--espacement-md)',
              background: 'none',
              border: 'none',
              borderBottom: o === onglet ? '2px solid var(--couleur-primaire)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: o === onglet ? 600 : 400,
              color: o === onglet ? 'var(--couleur-primaire)' : 'var(--couleur-texte-secondaire)',
              fontSize: '0.9375rem',
              transition: 'all 0.15s ease',
            }}
          >
            {o === 'anonymiser' ? '🔒 Anonymiser' : '🔓 Restaurer'}
          </button>
        ))}
      </nav>

      {messageSucces && (
        <div
          role="status"
          style={{
            padding: 'var(--espacement-sm) var(--espacement-md)',
            background: '#f0fdf4',
            border: '1px solid var(--couleur-succes)',
            borderRadius: 'var(--rayon-bordure)',
            color: '#166534',
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {messageSucces}
        </div>
      )}

      {onglet === 'anonymiser' && etape === 'upload' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacement-md)' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)' }}>
              Rapport .docx
            </h3>
            <FileDropZone
              onFichierChoisi={handleFichierChoisi}
              chargement={chargement}
              erreur={erreur}
              fichierCourant={fichier?.name ?? null}
            />
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--espacement-sm)', color: 'var(--couleur-texte-secondaire)' }}>
              Clé .key.json existante <span style={{ fontWeight: 400 }}>(optionnel)</span>
            </h3>
            <FileDropZone
              onFichierChoisi={handleCleChoisie}
              erreur={erreurCle}
              fichierCourant={nomFichierCle}
              accept=".json"
            />
          </div>
        </section>
      )}

      {onglet === 'anonymiser' && etape === 'revue' && mapping && texte && (
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

      {onglet === 'restaurer' && (
        <section>
          <EcranRestauration />
        </section>
      )}
    </div>
  );
}

export default App;