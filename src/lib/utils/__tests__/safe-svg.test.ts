import { parseSafeSvg } from '../safe-svg';

describe('parseSafeSvg', () => {
  it('parses a plain icon into an allowlisted tree with React prop names', () => {
    const tree = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">\n' +
        '  <path fill-rule="evenodd" d="M1 1Z" clip-rule="evenodd" />\n' +
        '  <g stroke-width=\'2\'><circle cx="1" cy="2" r="3"></circle></g>\n' +
        '</svg>'
    );
    expect(tree).toEqual({
      tag: 'svg',
      attributes: { viewBox: '0 0 24 24', fill: 'currentColor' },
      children: [
        { tag: 'path', attributes: { fillRule: 'evenodd', d: 'M1 1Z', clipRule: 'evenodd' }, children: [] },
        {
          tag: 'g',
          attributes: { strokeWidth: '2' },
          children: [{ tag: 'circle', attributes: { cx: '1', cy: '2', r: '3' }, children: [] }],
        },
      ],
    });
  });

  it.each([null, undefined, ''])('returns null for an empty value (%p)', (value) => {
    expect(parseSafeSvg(value)).toBeNull();
  });

  it.each([
    ['a script element', '<svg><script>alert(1)</script></svg>'],
    ['a style element', '<svg><style>*{}</style></svg>'],
    ['a foreignObject', '<svg><foreignObject><div></div></foreignObject></svg>'],
    ['an event handler attribute', '<svg onload="alert(1)"></svg>'],
    ['an href', '<svg><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>'],
    ['an xlink:href on an allowed element', '<svg><path xlink:href="#x" d="M0 0"/></svg>'],
    ['a style attribute', '<svg style="background:url(x)"></svg>'],
    ['text content', '<svg>hello</svg>'],
    ['a comment', '<svg><!-- hi --></svg>'],
    ['an unquoted attribute', '<svg viewBox=0></svg>'],
    ['a non-svg root', '<path d="M0 0"/>'],
    ['two roots', '<svg></svg><svg></svg>'],
    ['a nested svg', '<svg><svg></svg></svg>'],
    ['an unclosed element', '<svg><g></svg>'],
    ['a mismatched close tag', '<svg><g></path></svg>'],
    ['a stray close tag', '</svg>'],
    ['trailing markup after the root', '<svg></svg><img src=x onerror=alert(1)>'],
    ['a quote-breaking attribute value', '<svg fill="a"onload="alert(1)"></svg>'],
  ])('rejects %s', (_label, markup) => {
    expect(parseSafeSvg(markup)).toBeNull();
  });

  it('rejects oversized markup without parsing it', () => {
    expect(parseSafeSvg(`<svg>${' '.repeat(20_001)}</svg>`)).toBeNull();
  });
});
