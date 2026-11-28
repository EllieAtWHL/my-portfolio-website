import { createElement, type ReactElement } from 'react';
import { parseSafeSvg, type SvgNode } from '@/lib/utils/safe-svg';

interface CompetitionIconProps {
  iconSvg?: string | null;
  className?: string;
}

function renderNode(node: SvgNode, key?: number): ReactElement {
  return createElement(
    node.tag,
    { ...node.attributes, key },
    ...node.children.map((child, index) => renderNode(child, index))
  );
}

/**
 * Renders a competition's admin-supplied icon_svg, falling back to a generic
 * competition icon when none is set or it isn't a plain SVG icon.
 *
 * The icon is parsed against an allowlist (parseSafeSvg) and rendered as React
 * elements, never via dangerouslySetInnerHTML, so a bad icon_svg value can't
 * inject script into the page (WEB-83).
 */
export function CompetitionIcon({ iconSvg, className = 'w-5 h-5' }: CompetitionIconProps) {
  const icon = parseSafeSvg(iconSvg);

  if (icon) {
    const { width, height, viewBox, ...attributes } = icon.attributes;
    return (
      <svg
        {...attributes}
        // The caller sizes the icon, so the stored width/height are dropped -
        // but they define the drawing's coordinates when there's no viewBox.
        viewBox={viewBox ?? (width && height ? `0 0 ${width} ${height}` : undefined)}
        className={className}
        aria-hidden="true"
      >
        {icon.children.map((child, index) => renderNode(child, index))}
      </svg>
    );
  }

  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
    </svg>
  );
}
