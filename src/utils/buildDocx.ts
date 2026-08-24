import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Convertit un texte pseudonymisé en Blob .docx prêt au téléchargement.
 * Chaque ligne du texte devient un paragraphe dans le document.
 * Les lignes blanches consécutives (3+) sont réduites à une seule
 * pour éviter les sauts de page excessifs.
 */
export async function buildDocx(texte: string): Promise<Blob> {
  // Réduire les suites de 3+ lignes vides consécutives à une seule ligne vide
  const normalise = texte.replace(/\n{3,}/g, '\n\n');
  const lignes = normalise.split('\n');

  const children = lignes.map(
    (ligne) => new Paragraph({ children: [new TextRun(ligne)] }),
  );

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}