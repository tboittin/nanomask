import { type Detection, type TypePII, REGLES } from './regex';

export function analyserTexte(texte: string): Detection[] {
  const detections: Detection[] = [];

  for (const regle of REGLES) {
    let match: RegExpExecArray | null;
    regle.pattern.lastIndex = 0;
    while ((match = regle.pattern.exec(texte)) !== null) {
      detections.push({
        valeur: match[0],
        type: regle.type,
        position: match.index,
        longueur: match[0].length,
      });
    }
  }

  return detections;
}

export interface GroupeDetection {
  type: TypePII;
  valeurs: string[];
}

export function deduplicator(detections: Detection[]): GroupeDetection[] {
  const vues = new Map<string, Set<string>>();

  for (const d of detections) {
    const normalisee = d.valeur.trim().toLowerCase().replace(/[\s.-]+/g, '');
    if (!vues.has(d.type)) {
      vues.set(d.type, new Set());
    }
    vues.get(d.type)!.add(normalisee);
  }

  const groupes: GroupeDetection[] = [];
  Array.from(vues.entries()).forEach(([type, valeurs]) => {
    groupes.push({
      type: type as TypePII,
      valeurs: Array.from(valeurs),
    });
  });

  return groupes;
}

interface ConflitSousChaine {
  courte: string;
  longue: string;
  type: TypePII;
}

export function resoudreConflitsSousChaine(
  detections: Detection[],
): { net: Detection[]; conflits: ConflitSousChaine[] } {
  const conflits: ConflitSousChaine[] = [];
  const net = [...detections];
  const supprimees = new Set<number>();

  for (let i = 0; i < net.length; i++) {
    if (supprimees.has(i)) continue;
    for (let j = 0; j < net.length; j++) {
      if (i === j || supprimees.has(j)) continue;
      const a = net[i].valeur.toLowerCase().trim();
      const b = net[j].valeur.toLowerCase().trim();
      if (a !== b && a.includes(b) && a.length > b.length) {
        conflits.push({ courte: net[j].valeur, longue: net[i].valeur, type: net[i].type });
        supprimees.add(j);
      } else if (a !== b && b.includes(a) && b.length > a.length) {
        conflits.push({ courte: net[i].valeur, longue: net[j].valeur, type: net[i].type });
        supprimees.add(i);
        break;
      }
    }
  }

  return {
    net: net.filter((_, idx) => !supprimees.has(idx)),
    conflits,
  };
}