export type MarkdownDocInput = {
  title: string;
  description: string | undefined;
  permalink: string;
  dateModified: string | undefined;
  body: string;
};

type FaqPair = { question: string; answer: string };

const frontmatterBlock = /^---\n[\s\S]*?\n---\n/;
const fenceLine = /^`{3,}/;
const importLine = /^import\s+(?:.+\s+from\s+)?['"][^'"]+['"];?\s*$/;
const admonitionOpen = /^:{3,}([a-z]+)(?:\[(.+)\])?\s*$/;
const admonitionClose = /^:{3,}\s*$/;
const tabItemLabel = /label=["']([^"']+)["']/;
const selfClosingComponent = /^<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\/>$/;
const faqEntry =
  /(question|answer)\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;

const admonitionTitles: Record<string, string> = {
  tip: 'Tip',
  note: 'Note',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
  caution: 'Caution',
};

const unquote = (literal: string): string =>
  literal.slice(1, -1).replace(/\\(['"\\])/g, '$1');

const extractFaqPairs = (block: string): FaqPair[] => {
  const pairs: FaqPair[] = [];
  let question: string | undefined;

  for (const match of block.matchAll(faqEntry)) {
    const key = match[1];
    const literal = match[2];
    if (literal === undefined) continue;

    if (key === 'question') question = unquote(literal);
    else if (question !== undefined) {
      pairs.push({ question, answer: unquote(literal) });
      question = undefined;
    }
  }

  return pairs;
};

const renderFaq = (pairs: FaqPair[]): string[] =>
  pairs.length === 0
    ? []
    : [
        '## Frequently Asked Questions',
        '',
        ...pairs.flatMap((pair) => [
          `### ${pair.question}`,
          '',
          pair.answer,
          '',
        ]),
      ];

const renderImage = (block: string): string[] => {
  const src = block.match(/src=["']([^"']+)["']/)?.[1];
  if (src === undefined) return [];

  const alt = block.match(/alt=["']([^"']*)["']/)?.[1] ?? '';

  return [`![${alt}](${src})`, ''];
};

const readJsxBlock = (
  lines: string[],
  start: number
): { block: string; nextIndex: number } => {
  let end = start;
  while (end < lines.length && !(lines[end] ?? '').trim().endsWith('/>'))
    end += 1;

  return {
    block: lines.slice(start, end + 1).join('\n'),
    nextIndex: end + 1,
  };
};

const transformInline = (line: string, siteUrl: string): string =>
  line
    .replace(
      /<ArrowLink\s+to=["']([^"']+)["']\s*>(.*?)<\/ArrowLink>/g,
      '[$2]($1)'
    )
    .replace(
      /<PartnerLink\s*>(.*?)<\/PartnerLink>/g,
      `[$1](${siteUrl}/docs#partners)`
    )
    .replace(/<Level\s+value=\{(\d+)\}\s*\/>/g, '$1/5')
    .replace(/\]\(\//g, `](${siteUrl}/`);

export const cleanMdxBody = (source: string, siteUrl: string): string => {
  const lines = source.replace(frontmatterBlock, '').split('\n');
  const output: string[] = [];
  let lastBlank = true;
  let inFence = false;

  const emit = (line: string): void => {
    const blank = line.trim() === '';
    if (blank && lastBlank) return;
    output.push(line);
    lastBlank = blank;
  };

  const emitRaw = (line: string): void => {
    output.push(line);
    lastBlank = line.trim() === '';
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (inFence) {
      emitRaw(line);
      if (fenceLine.test(trimmed)) inFence = false;
      index += 1;
      continue;
    }

    if (fenceLine.test(trimmed)) {
      inFence = true;
      emit(line);
      index += 1;
      continue;
    }

    if (importLine.test(trimmed)) {
      index += 1;
      continue;
    }

    const admonition = trimmed.match(admonitionOpen);
    if (admonition) {
      const title =
        admonition[2] ?? admonitionTitles[admonition[1] ?? ''] ?? 'Note';
      emit('');
      emit(`**${title}**`);
      emit('');
      index += 1;
      continue;
    }

    if (admonitionClose.test(trimmed)) {
      emit('');
      index += 1;
      continue;
    }

    if (
      trimmed === '<Tabs>' ||
      (trimmed.startsWith('<Tabs ') && trimmed.endsWith('>')) ||
      trimmed === '</Tabs>' ||
      trimmed === '</TabItem>' ||
      (trimmed.startsWith('<div') && trimmed.endsWith('>')) ||
      trimmed === '</div>'
    ) {
      emit('');
      index += 1;
      continue;
    }

    if (trimmed.startsWith('<TabItem')) {
      const label = trimmed.match(tabItemLabel)?.[1];
      emit('');
      if (label !== undefined) {
        emit(`**${label}**`);
        emit('');
      }
      index += 1;
      continue;
    }

    if (trimmed.startsWith('<Faq')) {
      const { block, nextIndex } = readJsxBlock(lines, index);
      emit('');
      for (const faqLine of renderFaq(extractFaqPairs(block)))
        emit(transformInline(faqLine, siteUrl));
      index = nextIndex;
      continue;
    }

    if (trimmed.startsWith('<img')) {
      const { block, nextIndex } = readJsxBlock(lines, index);
      for (const imageLine of renderImage(block))
        emit(transformInline(imageLine, siteUrl));
      index = nextIndex;
      continue;
    }

    if (trimmed.startsWith('<SkillsOverview')) {
      emit(
        '*The interactive sub-skill overview lives on the web page. The full catalog is in the table below.*'
      );
      index += 1;
      continue;
    }

    if (selfClosingComponent.test(trimmed)) {
      index += 1;
      continue;
    }

    emit(transformInline(line, siteUrl));
    index += 1;
  }

  return output.join('\n');
};

const stripLeadingH1 = (markdown: string): string => {
  const lines = markdown.split('\n');
  const first = lines.findIndex((line) => line.trim() !== '');
  if (first === -1 || !(lines[first] ?? '').startsWith('# ')) return markdown;
  return lines.slice(first + 1).join('\n');
};

export const renderDocMarkdown = (
  input: MarkdownDocInput,
  siteUrl: string
): string => {
  const body = stripLeadingH1(cleanMdxBody(input.body, siteUrl)).trim();
  const header = [
    `# ${input.title}`,
    '',
    ...(input.description ? [`> ${input.description}`, ''] : []),
    `Canonical: ${siteUrl}${input.permalink}`,
    ...(input.dateModified
      ? [`Last updated: ${input.dateModified.slice(0, 10)}`]
      : []),
    '',
  ];

  return `${[...header, body].join('\n')}\n`;
};
