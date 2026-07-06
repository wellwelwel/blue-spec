import { afterSeparator } from '../markdown/fields';
import { markdownLines, structuralText } from '../markdown/lines';

export const matchProject = (
  detect: string | null,
  charter: string | null
): string => {
  const source = structuralText(detect ?? charter ?? '');
  return (
    source.match(/^#\s+(.+?)\s+(Detect Map|Security Charter)/m)?.[1] ??
    'Project'
  );
};

const VERSION_LABEL = 'version';

export const matchVersion = (charter: string | null): string => {
  for (const line of markdownLines(charter ?? '')) {
    if (line.code) continue;
    if (
      line.text.slice(0, VERSION_LABEL.length).toLowerCase() !== VERSION_LABEL
    )
      continue;

    const cursor = afterSeparator(line.text, VERSION_LABEL.length);
    if (cursor === -1) continue;

    const value = line.text.slice(cursor).trim().split(' ')[0].split('|')[0];
    if (value !== '') return value;
  }

  return '—';
};
