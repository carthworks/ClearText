export type NonPrintableMatch = {
  index: number;
  char: string;
  codePoint: number;
  name: string;
  category: string;
};

export type PositionedMatch = NonPrintableMatch & {
  line: number; // 1-based
  column: number; // 1-based, visual column counting code points
};

const NON_PRINTABLE_REGEX = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}]/gu;

const NAMED: Record<number, { name: string; category: string }> = {
  0x00: { name: "NULL", category: "Cc" },
  0x09: { name: "TAB", category: "Cc" },
  0x0a: { name: "LINE FEED", category: "Cc" },
  0x0d: { name: "CARRIAGE RETURN", category: "Cc" },
  0x200b: { name: "ZERO WIDTH SPACE", category: "Cf" },
  0x200c: { name: "ZERO WIDTH NON-JOINER", category: "Cf" },
  0x200d: { name: "ZERO WIDTH JOINER", category: "Cf" },
  0x00a0: { name: "NO-BREAK SPACE", category: "Zs" },
  0x2028: { name: "LINE SEPARATOR", category: "Zl" },
  0x2029: { name: "PARAGRAPH SEPARATOR", category: "Zp" },
  0x00ad: { name: "SOFT HYPHEN", category: "Cf" },
  0x061c: { name: "ARABIC LETTER MARK", category: "Cf" },
  0x200e: { name: "LEFT-TO-RIGHT MARK", category: "Cf" },
  0x200f: { name: "RIGHT-TO-LEFT MARK", category: "Cf" },
  0x202a: { name: "LEFT-TO-RIGHT EMBEDDING", category: "Cf" },
  0x202b: { name: "RIGHT-TO-LEFT EMBEDDING", category: "Cf" },
  0x202c: { name: "POP DIRECTIONAL FORMATTING", category: "Cf" },
  0x202d: { name: "LEFT-TO-RIGHT OVERRIDE", category: "Cf" },
  0x202e: { name: "RIGHT-TO-LEFT OVERRIDE", category: "Cf" },
  0x2066: { name: "LEFT-TO-RIGHT ISOLATE", category: "Cf" },
  0x2067: { name: "RIGHT-TO-LEFT ISOLATE", category: "Cf" },
  0x2068: { name: "FIRST STRONG ISOLATE", category: "Cf" },
  0x2069: { name: "POP DIRECTIONAL ISOLATE", category: "Cf" },
};

function hex(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function classifyToken(codePoint: number, category: string): string {
  if (codePoint === 0x200b) return "token-zwsp";
  if (codePoint === 0x00a0) return "token-nbsp";
  if (codePoint === 0x00ad) return "token-soft";
  if (
    codePoint === 0x200e ||
    codePoint === 0x200f ||
    codePoint === 0x202a ||
    codePoint === 0x202b ||
    codePoint === 0x202c ||
    codePoint === 0x202d ||
    codePoint === 0x202e ||
    codePoint === 0x2066 ||
    codePoint === 0x2067 ||
    codePoint === 0x2068 ||
    codePoint === 0x2069
  ) return "token-bidi";
  if (category.startsWith("Cc")) return "token-cc";
  if (category.startsWith("Cf")) return "token-cf";
  if (category.startsWith("Cs")) return "token-cs";
  if (category.startsWith("Co")) return "token-co";
  if (category.startsWith("Cn")) return "token-cn";
  return "token-cf";
}

export function findNonPrintable(input: string): NonPrintableMatch[] {
  const matches: NonPrintableMatch[] = [];
  const iterator = input.matchAll(NON_PRINTABLE_REGEX);
  for (const m of iterator) {
    if (m.index === undefined || m[0] === undefined) continue;
    const char = m[0];
    const codePoint = char.codePointAt(0)!;
    const named = NAMED[codePoint];
    matches.push({
      index: m.index,
      char,
      codePoint,
      name: named?.name ?? hex(codePoint),
      category: named?.category ?? "C*",
    });
  }
  return matches;
}

export function findNonPrintableWithPositions(input: string): PositionedMatch[] {
  const results: PositionedMatch[] = [];
  let line = 1;
  let column = 1;
  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);

    if (NON_PRINTABLE_REGEX.test(ch)) {
      NON_PRINTABLE_REGEX.lastIndex = 0;
      const named = NAMED[cp];
      results.push({
        index: i,
        char: ch,
        codePoint: cp,
        name: named?.name ?? hex(cp),
        category: named?.category ?? "C*",
        line,
        column,
      });
    } else {
      NON_PRINTABLE_REGEX.lastIndex = 0;
    }

    // Newline handling (CRLF counts as a single newline)
    if (cp === 0x0d /* CR */) {
      const next = input.codePointAt(i + ch.length);
      if (next === 0x0a) {
        i += ch.length; // consume CR
        line += 1;
        column = 1;
        i += String.fromCodePoint(next).length; // consume LF
        continue;
      } else {
        line += 1;
        column = 1;
      }
    } else if (cp === 0x0a /* LF */ || cp === 0x2028 /* LS */ || cp === 0x2029 /* PS */) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }

    i += ch.length;
  }
  return results;
}

export function stripNonPrintable(input: string): string {
  return input.replace(NON_PRINTABLE_REGEX, "");
}

export type FrequencyEntry = {
  codePoint: number;
  name: string;
  category: string;
  count: number;
};

export function summarizeNonPrintable(input: string): FrequencyEntry[] {
  const freq = new Map<number, { count: number; name: string; category: string }>();
  const iterator = input.matchAll(NON_PRINTABLE_REGEX);
  for (const m of iterator) {
    if (m[0] === undefined) continue;
    const cp = m[0].codePointAt(0)!;
    const named = NAMED[cp];
    const key = cp;
    const current = freq.get(key) ?? { count: 0, name: named?.name ?? hex(cp), category: named?.category ?? "C*" };
    current.count += 1;
    freq.set(key, current);
  }
  return Array.from(freq.entries())
    .map(([codePoint, v]) => ({ codePoint, name: v.name, category: v.category, count: v.count }))
    .sort((a, b) => b.count - a.count || a.codePoint - b.codePoint);
}

export function visualizeWithTokens(input: string): { html: string; count: number } {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let count = 0;

  let result = "";
  let line = 1;
  let column = 1;
  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i)!;
    const char = String.fromCodePoint(cp);
    const isHidden = NON_PRINTABLE_REGEX.test(char);
    NON_PRINTABLE_REGEX.lastIndex = 0;

    if (isHidden) {
      count += 1;
      const named = NAMED[cp];
      const name = named?.name ?? hex(cp);
      const category = named?.category ?? "C*";
      const cls = classifyToken(cp, category);
      const title = `${name} (${hex(cp)}) — Category ${category} — at ${line}:${column}`;
      result += `<span class=\"token ${cls}\" title=\"${escape(title)}\">&#9676;</span>`;
    } else {
      result += escape(char);
    }

    // newline handling for title positions
    if (cp === 0x0d) {
      const next = input.codePointAt(i + char.length);
      if (next === 0x0a) {
        i += char.length;
        line += 1;
        column = 1;
        i += String.fromCodePoint(next).length;
        continue;
      } else {
        line += 1;
        column = 1;
      }
    } else if (cp === 0x0a || cp === 0x2028 || cp === 0x2029) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }

    i += char.length;
  }

  return { html: result, count };
}

// Cleaning / normalization
export type CleanOptions = {
  removeCc: boolean;
  removeCf: boolean;
  removeCs: boolean;
  removeCo: boolean;
  removeCn: boolean;
  preserveTab: boolean;
  preserveLF: boolean;
  preserveCR: boolean;
  removeZWSP: boolean;
  nbspToSpace: boolean;
  normalizeDashes: boolean;
  normalizeQuotes: boolean;
};

export function defaultCleanOptions(): CleanOptions {
  return {
    removeCc: true,
    removeCf: true,
    removeCs: true,
    removeCo: true,
    removeCn: true,
    preserveTab: true,
    preserveLF: true,
    preserveCR: false,
    removeZWSP: true,
    nbspToSpace: true,
    normalizeDashes: true,
    normalizeQuotes: true,
  };
}

const DASH_MAP: Record<number, string> = {
  0x2010: "-",
  0x2011: "-",
  0x2012: "-",
  0x2013: "-",
  0x2014: "-",
  0x2212: "-",
};

const QUOTE_MAP: Record<number, string> = {
  0x2018: "'",
  0x2019: "'",
  0x201a: "'",
  0x201b: "'",
  0x2032: "'",
  0x201c: '"',
  0x201d: '"',
  0x201e: '"',
  0x201f: '"',
  0x2033: '"',
};

export function cleanText(input: string, options: CleanOptions): string {
  let out = "";
  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);

    if (options.nbspToSpace && cp === 0x00a0) {
      out += " ";
      i += ch.length;
      continue;
    }
    if (options.normalizeDashes && DASH_MAP[cp]) {
      out += DASH_MAP[cp];
      i += ch.length;
      continue;
    }
    if (options.normalizeQuotes && QUOTE_MAP[cp]) {
      out += QUOTE_MAP[cp];
      i += ch.length;
      continue;
    }

    if (options.removeZWSP && cp === 0x200b) {
      i += ch.length;
      continue;
    }

    if (NON_PRINTABLE_REGEX.test(ch)) {
      NON_PRINTABLE_REGEX.lastIndex = 0;
      if (cp === 0x09 && options.preserveTab) {
        out += ch;
      } else if (cp === 0x0a && options.preserveLF) {
        out += ch;
      } else if (cp === 0x0d && options.preserveCR) {
        out += ch;
      } else {
        const named = NAMED[cp];
        const cat = named?.category ?? "C*";
        const shouldRemove = (
          (cat.startsWith("Cc") && options.removeCc) ||
          (cat.startsWith("Cf") && options.removeCf) ||
          (cat.startsWith("Cs") && options.removeCs) ||
          (cat.startsWith("Co") && options.removeCo) ||
          (cat.startsWith("Cn") && options.removeCn)
        );
        if (!shouldRemove) {
          out += ch;
        }
      }
      i += ch.length;
      continue;
    }

    out += ch;
    i += ch.length;
  }
  return out;
}

export function downloadTextAsFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
} 