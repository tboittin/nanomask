import { useMemo, useCallback } from 'react';

interface TexteApercuProps {
  titre: string;
  texte: string;
  mapping: Record<string, string[]>;
  tagSurbrillance?: string | null;
  valeurSurbrillance?: string | null;
  surlignerTags?: boolean;
  surlignerValeurs?: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onTagClick?: (tag: string) => void;
  onValeurClick?: (tag: string, valeur: string) => void;
  onSelection?: (valeur: string) => void;
}

export function TexteApercu({
  titre,
  texte,
  mapping,
  tagSurbrillance = null,
  valeurSurbrillance = null,
  surlignerTags = false,
  surlignerValeurs = false,
  containerRef,
  onScroll,
  onTagClick,
  onValeurClick,
  onSelection,
}: TexteApercuProps) {
  const segments = useMemo(() => {
    if (surlignerTags) {
      return decouperTags(texte, tagSurbrillance);
    }
    if (surlignerValeurs) {
      return decouperValeurs(texte, mapping, tagSurbrillance, valeurSurbrillance);
    }
    return [{ texte, surbrillance: false, specifique: false, tag: undefined as string | undefined }];
  }, [texte, mapping, tagSurbrillance, valeurSurbrillance, surlignerTags, surlignerValeurs]);

  const handleMouseUp = useCallback(() => {
    if (!onSelection) return;
    const selection = window.getSelection();
    const selected = selection?.toString().trim();
    if (selected && selected.length > 0) {
      onSelection(selected);
    }
  }, [onSelection]);

  return (
    <div>
      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 var(--espacement-sm) 0' }}>
        {titre}
      </h4>
      <div
        ref={containerRef}
        onScroll={onScroll}
        onMouseUp={onSelection ? handleMouseUp : undefined}
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
            onClick={seg.tag ? () => {
              if (surlignerTags && onTagClick) onTagClick(seg.tag!);
              if (surlignerValeurs && onValeurClick && seg.valeur) onValeurClick(seg.tag!, seg.valeur);
            } : undefined}
            style={{
              backgroundColor: seg.specifique
                ? 'rgba(79, 70, 229, 0.35)'
                : seg.surbrillance
                  ? 'rgba(79, 70, 229, 0.12)'
                  : 'transparent',
              borderRadius: '2px',
              fontFamily: surlignerTags ? 'var(--police-mono)' : 'inherit',
              cursor: seg.tag ? 'pointer' : 'inherit',
              transition: 'background-color 0.15s',
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
  specifique?: boolean;
  tag?: string;
  valeur?: string;
}

function decouperTags(
  texte: string,
  tagSurbrillance: string | null,
): Segment[] {
  if (!tagSurbrillance) return [{ texte, surbrillance: false }];

  const segments: Segment[] = [];
  const escaped = tagSurbrillance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = texte.split(new RegExp(`(${escaped})`, 'g'));

  for (const part of parts) {
    if (part === tagSurbrillance) {
      segments.push({ texte: part, surbrillance: true, tag: part });
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
  valeurSurbrillance: string | null,
): Segment[] {
  if (!tagSurbrillance) return [{ texte, surbrillance: false }];

  const toutesValeurs = mapping[tagSurbrillance] || [];
  if (toutesValeurs.length === 0) return [{ texte, surbrillance: false }];

  // On cherche dans tout le texte TOUTES les valeurs de ce tag
  // pour les marquer en "surbrillance douce"
  const tousPatterns = toutesValeurs
    .map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  if (!tousPatterns) return [{ texte, surbrillance: false }];

  // Si une valeur spécifique est sélectionnée, on la surligne plus fort
  const specifique = valeurSurbrillance || null;

  const segments: Segment[] = [];
  const regex = new RegExp(`(${tousPatterns})`, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texte)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ texte: texte.slice(lastIndex, match.index), surbrillance: false });
    }
    const estSpecifique = specifique !== null &&
      match[0].toLowerCase() === specifique.toLowerCase();
    segments.push({
      texte: match[0],
      surbrillance: true,
      specifique: estSpecifique,
      tag: tagSurbrillance,
      valeur: match[0],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < texte.length) {
    segments.push({ texte: texte.slice(lastIndex), surbrillance: false });
  }

  return segments.length > 0 ? segments : [{ texte, surbrillance: false }];
}