import { useMemo } from 'react';

interface TexteApercuProps {
  titre: string;
  texte: string;
  mapping: Record<string, string[]>;
  tagSurbrillance?: string | null;
  surlignerTags?: boolean;
  surlignerValeurs?: boolean;
}

export function TexteApercu({
  titre,
  texte,
  mapping,
  tagSurbrillance = null,
  surlignerTags = false,
  surlignerValeurs = false,
}: TexteApercuProps) {
  const segments = useMemo(() => {
    if (surlignerTags) {
      return decouperTags(texte, tagSurbrillance);
    }
    if (surlignerValeurs) {
      return decouperValeurs(texte, mapping, tagSurbrillance);
    }
    return [{ texte, surbrillance: false }];
  }, [texte, mapping, tagSurbrillance, surlignerTags, surlignerValeurs]);

  return (
    <div>
      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 var(--espacement-sm) 0' }}>
        {titre}
      </h4>
      <div
        style={{
          background: 'var(--couleur-surface)',
          border: '1px solid var(--couleur-bordure)',
          borderRadius: 'var(--rayon-bordure)',
          padding: 'var(--espacement-md)',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            style={{
              backgroundColor: seg.surbrillance ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
              borderRadius: '2px',
              fontFamily: surlignerTags ? 'var(--police-mono)' : 'inherit',
            }}
          >
            {seg.texte}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Segment {
  texte: string;
  surbrillance: boolean;
}

function decouperTags(
  texte: string,
  tagSurbrillance: string | null,
): Segment[] {
  if (!tagSurbrillance) return [{ texte, surbrillance: false }];

  const segments: Segment[] = [];
  const parts = texte.split(new RegExp(`(${tagSurbrillance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'));

  for (const part of parts) {
    if (part === tagSurbrillance) {
      segments.push({ texte: part, surbrillance: true });
    } else {
      segments.push({ texte: part, surbrillance: false });
    }
  }

  return segments;
}

function decouperValeurs(
  texte: string,
  mapping: Record<string, string[]>,
  tagSurbrillance: string | null,
): Segment[] {
  if (!tagSurbrillance) return [{ texte, surbrillance: false }];

  const valeursSurbrillees = mapping[tagSurbrillance] || [];
  if (valeursSurbrillees.length === 0) return [{ texte, surbrillance: false }];

  // Construire une regex avec toutes les valeurs
  const pattern = valeursSurbrillees
    .map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  if (!pattern) return [{ texte, surbrillance: false }];

  const segments: Segment[] = [];
  const regex = new RegExp(`(${pattern})`, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texte)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ texte: texte.slice(lastIndex, match.index), surbrillance: false });
    }
    segments.push({ texte: match[0], surbrillance: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < texte.length) {
    segments.push({ texte: texte.slice(lastIndex), surbrillance: false });
  }

  return segments.length > 0 ? segments : [{ texte, surbrillance: false }];
}