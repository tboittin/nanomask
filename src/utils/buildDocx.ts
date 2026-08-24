import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Convertit un texte pseudonymisé en Blob .docx prêt au téléchargement.
 * Chaque ligne du texte devient un paragraphe dans le document.
 */
export async function buildDocx(texte: string): Promise<Blob> {
  const lignes = texte.split('\n');
  const children = lignes.map(
    (ligne) => new Paragraph({ children: [new TextRun(ligne)] }),
  );

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}