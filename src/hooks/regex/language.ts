import type {
  CarrierMap,
  LanguageId,
  RegexCarriers,
} from '../../types/hooks/regex.js';

const NO_CARRIERS: RegexCarriers = {
  slashLiteral: false,
  quoteApis: [],
  stringApis: [],
};

const CARRIERS = {
  javascript: {
    slashLiteral: true,
    quoteApis: ['new RegExp', 'RegExp'],
    stringApis: ['.match', '.matchAll', '.search'],
  },
  python: {
    slashLiteral: false,
    quoteApis: [
      're.compile',
      're.match',
      're.search',
      're.sub',
      're.findall',
      're.fullmatch',
      'regex.compile',
    ],
    stringApis: [],
  },
  ruby: { slashLiteral: true, quoteApis: ['Regexp.new'], stringApis: [] },
  go: {
    slashLiteral: false,
    quoteApis: ['regexp.Compile', 'regexp.MustCompile', 'regexp.MatchString'],
    stringApis: [],
  },
  php: {
    slashLiteral: true,
    quoteApis: ['preg_match', 'preg_match_all', 'preg_replace', 'preg_split'],
    stringApis: [],
  },
  rust: {
    slashLiteral: false,
    quoteApis: ['Regex::new', 'RegexBuilder::new'],
    stringApis: [],
  },
  java: { slashLiteral: false, quoteApis: ['Pattern.compile'], stringApis: [] },
  csharp: { slashLiteral: false, quoteApis: ['new Regex'], stringApis: [] },
  c: { slashLiteral: false, quoteApis: ['regcomp'], stringApis: [] },
  cpp: {
    slashLiteral: false,
    quoteApis: ['std::regex', 'regcomp'],
    stringApis: [],
  },
  kotlin: {
    slashLiteral: false,
    quoteApis: ['Regex', 'Pattern.compile'],
    stringApis: [],
  },
  swift: {
    slashLiteral: false,
    quoteApis: ['NSRegularExpression'],
    stringApis: [],
  },
  scala: {
    slashLiteral: false,
    quoteApis: ['Pattern.compile'],
    stringApis: [],
  },
  dart: { slashLiteral: false, quoteApis: ['RegExp'], stringApis: [] },
  powershell: NO_CARRIERS,
  elixir: { slashLiteral: true, quoteApis: ['Regex.compile'], stringApis: [] },
  objc: {
    slashLiteral: false,
    quoteApis: ['regularExpressionWithPattern'],
    stringApis: [],
  },
  r: {
    slashLiteral: false,
    quoteApis: ['grepl', 'gsub', 'regmatches', 'regexpr', 'regexec'],
    stringApis: [],
  },
  julia: { slashLiteral: false, quoteApis: ['Regex'], stringApis: [] },
  clojure: NO_CARRIERS,
  crystal: { slashLiteral: true, quoteApis: ['Regex.new'], stringApis: [] },
  nim: NO_CARRIERS,
  vlang: {
    slashLiteral: false,
    quoteApis: ['regex.regex_opt'],
    stringApis: [],
  },
  dlang: { slashLiteral: false, quoteApis: ['regex'], stringApis: [] },
  perl: { slashLiteral: true, quoteApis: [], stringApis: [] },
} satisfies CarrierMap;

export const carriersOf = (language: LanguageId): RegexCarriers =>
  CARRIERS[language];
