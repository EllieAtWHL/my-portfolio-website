// Parses an admin-supplied SVG icon (competitions.icon_svg) into a plain tree
// of allowlisted elements and attributes, so it can be rendered as React
// elements instead of via dangerouslySetInnerHTML (WEB-83).
//
// It's a strict "parse or reject" reader, not a cleaner: the whole string must
// be well-formed tags and whitespace using only the elements and attributes
// below, or the result is null (and the caller falls back to a generic icon).
// No text nodes, comments, CDATA, <script>, <style>, event handlers, href or
// style attributes can get through, because none of them parse.

export interface SvgNode {
  tag: SvgTag;
  attributes: Record<string, string>;
  children: SvgNode[];
}

const ALLOWED_TAGS = ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'] as const;
type SvgTag = (typeof ALLOWED_TAGS)[number];

// SVG attribute name -> React prop name. Presentation and geometry only.
const ALLOWED_ATTRIBUTES: Record<string, string> = {
  viewBox: 'viewBox',
  fill: 'fill',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'clip-rule': 'clipRule',
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-opacity': 'strokeOpacity',
  opacity: 'opacity',
  transform: 'transform',
  d: 'd',
  cx: 'cx',
  cy: 'cy',
  r: 'r',
  rx: 'rx',
  ry: 'ry',
  x: 'x',
  y: 'y',
  x1: 'x1',
  y1: 'y1',
  x2: 'x2',
  y2: 'y2',
  width: 'width',
  height: 'height',
  points: 'points',
};

// Accepted but dropped: the namespace (React adds it) and a Tailwind sizing
// class (the caller sizes the icon).
const IGNORED_ATTRIBUTES = new Set(['xmlns', 'class']);

const TAG_PATTERN = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9:-]*\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*)\s*(\/?)>/y;
const ATTRIBUTE_PATTERN = /([a-zA-Z][a-zA-Z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const WHITESPACE_PATTERN = /\s+/y;

function isAllowedTag(name: string): name is SvgTag {
  return (ALLOWED_TAGS as readonly string[]).includes(name);
}

/** The icon as an allowlisted tree, or null if it isn't a plain SVG icon. */
export function parseSafeSvg(markup: string | null | undefined): SvgNode | null {
  if (!markup || markup.length > 20_000) return null;

  const stack: SvgNode[] = [];
  let root: SvgNode | null = null;
  let position = 0;

  while (position < markup.length) {
    WHITESPACE_PATTERN.lastIndex = position;
    if (WHITESPACE_PATTERN.exec(markup)) {
      position = WHITESPACE_PATTERN.lastIndex;
      continue;
    }

    TAG_PATTERN.lastIndex = position;
    const match = TAG_PATTERN.exec(markup);
    if (!match) return null; // text, a comment, or anything else that isn't a plain tag
    position = TAG_PATTERN.lastIndex;

    const [, closing, tag, attributeText, selfClosing] = match;
    if (!isAllowedTag(tag)) return null;

    if (closing) {
      if (attributeText || selfClosing) return null;
      const open = stack.pop();
      if (!open || open.tag !== tag) return null;
      continue;
    }

    // Exactly one root, and it must be the <svg>.
    if (stack.length === 0 && (root || tag !== 'svg')) return null;
    if (stack.length > 0 && tag === 'svg') return null;

    const attributes: Record<string, string> = {};
    for (const [, name, doubleQuoted, singleQuoted] of attributeText.matchAll(ATTRIBUTE_PATTERN)) {
      if (IGNORED_ATTRIBUTES.has(name)) continue;
      const prop = ALLOWED_ATTRIBUTES[name];
      if (!prop) return null;
      attributes[prop] = doubleQuoted ?? singleQuoted ?? '';
    }

    const node: SvgNode = { tag, attributes, children: [] };
    if (stack.length === 0) root = node;
    else stack[stack.length - 1].children.push(node);
    if (!selfClosing) stack.push(node);
  }

  return stack.length === 0 ? root : null;
}
