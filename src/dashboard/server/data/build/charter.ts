import type { Charter } from '../../../../types/dashboard/dashboard';
import { fieldValue } from '../markdown/fields';
import { bulletText, inlineText, markdownLines } from '../markdown/lines';
import {
  firstParagraph,
  sectionBlocks,
  sectionIntro,
} from '../markdown/sections';

export const buildCharter = (charter: string | null): Charter => {
  const principles = sectionBlocks(charter, 'Principles').map((block) => ({
    name: block.name,
    rule: inlineText(firstParagraph(block.body)),
  }));

  const items = sectionBlocks(charter, 'Baseline discipline').map((block) => {
    const bullets = markdownLines(block.body)
      .filter((line) => !line.code)
      .map((line) => line.text.trim())
      .filter((line) => fieldValue(line, 'Why') === null)
      .map(bulletText)
      .filter((content): content is string => content !== null)
      .map(inlineText);
    return {
      name: block.name,
      rule: inlineText(firstParagraph(block.body)),
      bullets,
    };
  });

  return {
    principles,
    baseline: { intro: sectionIntro(charter, 'Baseline discipline'), items },
  };
};
