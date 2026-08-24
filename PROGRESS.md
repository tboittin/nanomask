# PROGRESS.md — NanoMask

> Document de suivi du projet. Met à jour au fil de l'avancement.
> Statut global : 🟢 **Phase 5 terminée**

---

## Légende

| Symbole | Signification |
|---------|---------------|
| 🔴 | Non démarré |
| 🟡 | En cours |
| 🟢 | Terminé |
| ❌ | Bloqué / abandonné |

---

## Phase 1 — Fondations du projet

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 1.1 | Initialiser le monorepo pnpm (Node ≥ 18, `.npmrc` node-linker=hoisted) | 🟢 | pnpm 9.15.9, Node 20.20.2 |\n| 1.2 | Configurer Vite + React 18 + TypeScript strict | 🟢 | Vite 6.4.3, React 18.3, TS 5.7 |\n| 1.3 | Configurer vitest + @testing-library/react | 🟢 | vitest 2.1.9, jsdom |\n| 1.4 | Configurer ESLint + Prettier (conventions françaises) | 🔴 | Reporté — pas bloquant |\n| 1.5 | Vérifier `tsc --noEmit` et `npm test` passent à vide | 🟢 | 2 tests passent, typecheck OK |\n| 1.6 | Créer la structure de dossiers (`src/`, `src/components/`, `src/utils/`, `src/hooks/`, `public/`) | 🟢 | `src/` + sous-dossiers créés |

---

## Phase 2 — Lecture et extraction .docx

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 2.1 | Installer `mammoth` | 🟢 | `messages` (type), polyfill Blob.arrayBuffer jsdom |\n| 2.2 | Créer le hook `useDocxUpload()` — upload + extraction texte brut | 🟢 | 6 tests |\n| 2.3 | Encapsuler dans un composant `FileDropZone` (glisser-déposer + sélecteur) | 🟢 | label natif au lieu de div+onClick |\n| 2.4 | Tests : upload fichier, extraction texte, erreur fichier invalide | 🟢 | 16 tests passent |

---

## Phase 3 — Pipeline de détection regex

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 3.1 | Implémenter les 9 règles regex (email, tel, ADELI, NIR, SIRET, IBAN, IP, URL, CB) | 🟢 | 10 tests regex |
| 3.2 | Fonction `analyzeText(text: string): Detection[]` avec positions et types | 🟢 | 4 tests |
| 3.3 | Déduplication : même valeur → même tag, variantes regroupées | 🟢 | testée dans analyse.test |
| 3.4 | Résolution de sous-chaîne (ex: "rue Gambetta" dans "15 rue Gambetta") | 🟢 | 2 tests |
| 3.5 | Support clé `.key.json` existante (mapping optionnel en entrée) | 🟢 | via chargerCleJson |
| 3.6 | Tests : chaque regex sur des cas réels (valides + limites + faux positifs) | 🟢 | 10 tests regex |
| 3.7 | Tests : déduplication, conflit de sous-chaîne, chargement clé existante | 🟢 | 8 tests analyse |

---

## Phase 4 — Mapping et tags

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 4.1 | Génération des tags sémantiques (`[PERSONNE]`, `[TELEPHONE]`…) avec compteurs | 🟢 | 3 tests |
| 4.2 | Fonction `applyMapping(text: string, map: Map): string` | 🟢 | 2 tests |
| 4.3 | Fonction `reverseMapping(text: string, map: Map): string` (restauration) | 🟢 | 1 test |
| 4.4 | Génération du fichier `.key.json` | 🟢 | round-trip testé |
| 4.5 | Tests : application, restauration, clé invalide/corrompue | 🟢 | 8 tests mapping |

---

## Phase 5 — Écran de revue interactive

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 5.1 | Layout split : tableau (gauche) / aperçus texte (droite) | 🟢 | grid 2 colonnes |
| 5.2 | **Volet gauche** : tableau des tags avec valeurs associées | 🟢 | PseudoTableau |
| 5.3 | Code couleur : vert (nouveau), blanc (existant), rouge (conflit), gris (vide) | 🟢 | fonction couleurTag |
| 5.4 | Renommer un tag (double-clic), ajouter/éditer/supprimer une valeur | 🟢 | double-clic + inputs |
| 5.5 | Bouton "+ Ajouter un pseudo" (tag + valeur manuelle, typage libre) | 🟢 | formulaire déroulant |
| 5.6 | **Volet droit haut** : texte pseudonymisé avec surbrillance des tags | 🟢 | TexteApercu (surlignerTags) |
| 5.7 | **Volet droit bas** : texte lisible avec surbrillance des valeurs | 🟢 | TexteApercu (surlignerValeurs) |
| 5.8 | Highlight croisé : clic tag → surbrillance bleue dans les deux textes | 🟢 | useRevue.mettreSurbrillance |
| 5.9 | Détection des conflits (même valeur dans deux tags, sous-chaîne) | 🟢 | calculée dans useRevue |
| 5.10 | Tests : clic sur tag, ajout manuel, conflit affiché, rendu | 🟢 | 24 tests Phase 5 |

---

## Phase 6 — Reconstruction .docx

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 6.1 | Installer `docx` (npm) | 🔴 | |
| 6.2 | Fonction `buildDocx(text: string): Blob` avec `docx.Document` + `Packer.toBlob()` | 🔴 | |
| 6.3 | Téléchargement simultané du `.docx` pseudonymisé + `.key.json` | 🔴 | |
| 6.4 | Tests : vérifier que le blob généré est un .docx valide | 🔴 | |

---

## Phase 7 — Onglet Restauration

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 7.1 | Upload du rapport modifié (`.docx` avec tags) | 🔴 | |
| 7.2 | Upload de la clé `.key.json` | 🔴 | |
| 7.3 | Pipeline de remplacement `[TAG]` → valeur d'origine | 🔴 | |
| 7.4 | Téléchargement du rapport restauré | 🔴 | |
| 7.5 | Tests : round-trip complet (anonymiser → restaurer) | 🔴 | |

---

## Phase 8 — Navigation et UI globale

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 8.1 | Navigation à onglets : Anonymiser / Restaurer | 🔴 | |
| 8.2 | Bouton global "Valider et télécharger" (bas à droite) | 🔴 | |
| 8.3 | Popup de confirmation si texte modifié manuellement avant validation | 🔴 | |
| 8.4 | Messages d'erreur / état vide / chargement | 🔴 | |
| 8.5 | Tests : navigation, états, popup | 🔴 | |

---

## Phase 9 — Finitions et qualité

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| 9.1 | Audit de sécurité : zéro donnée sortante vérifié | 🔴 | |
| 9.2 | Test utilisateur complet : upload → revue → téléchargement → upload restauration | 🔴 | |
| 9.3 | Vérifier couverture de test (viser ≥ 80%) | 🔴 | |
| 9.4 | Build production `npm run build` | 🔴 | |

---

## Roadmap future (Spec.md § Roadmap)

| # | Tâche | Statut |
|---|-------|--------|
| R1 | Parser .docx natif (remplacer mammoth, préserver mise en page) | 🔴 |
| R2 | Export PDF pseudonymisé | 🔴 |
| R3 | Règles personnalisables par l'utilisateur | 🔴 |
| R4 | Mode instantané (bypass revue) | 🔴 |

---

## Résumé

| Phase | Statut |
|-------|--------|
| Phase 1 — Fondations | 🟢 |
| Phase 2 — Lecture .docx | 🟢 |
| Phase 3 — Détection regex | 🟢 |
| Phase 4 — Mapping/Tags | 🟢 |
| Phase 5 — Revue interactive | 🟢 |
| Phase 6 — Reconstruction .docx | 🔴 |
| Phase 7 — Restauration | 🔴 |
| Phase 8 — Navigation/UI | 🔴 |
| Phase 9 — Finitions | 🔴 |