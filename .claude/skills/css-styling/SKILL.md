---
name: css-styling
description: Builds styling for the application using a shared component library and TailwindCSS utility classes, ensuring consistency and maintainability.
---

When applying formatting/styling to UI you should always ensure that:
- You are using the shared component library (e.g., `Button`, `Card`, etc.) instead of raw HTML elements with custom classes.
- You are using the correct variant and size props for the shared components to ensure consistency across the application.
- You are not using custom inline styles or classes that override the shared component styles, unless absolutely necessary.
- You are following the design system and accessibility guidelines (e.g., ARIA attributes, focus states, etc.) when implementing UI components.
- You are testing the UI components in different screen sizes and devices to ensure responsiveness and usability.
- You use tailwindcss utility classes only when necessary and avoid duplicating styles that are already provided by the shared components.
- Don't use inline styles or `!important` from outside a shared component to override its styling. If a shared component doesn't support the look you need, add a new variant or prop to the component instead of fighting its output locally. (Shared components may legitimately use Tailwind's `!` important-prefix *internally* — e.g. `Button`'s size variants bake it in so their own defaults can't be silently overridden — that's different from a consumer reaching for `!important` to force a one-off change from outside.)
- The application has two different brand guidelines: the main site and the Spurs Women section. Ensure that you are using the correct brand styles for each section of the application. For example, use the Spurs Women brand colors and typography for the Spurs Women section.
- When working on the main site, take care to consider both dark and light modes and ensure the UI components are styled appropriately for both modes. Use the shared component library's dark mode support and avoid hardcoding colors that may not be accessible in dark mode.

When designing new pages:

- Prefer existing components before inventing new ones.
- Match existing spacing exactly.
- Use generous whitespace.
- Maintain rounded corners consistently.
- Keep typography hierarchy unchanged.
- Avoid introducing new accent colours.
- Every page should have a clear primary action.
- Mobile-first layouts are mandatory.
- Dark mode should never feel like an inverted light mode - it should be intentionally designed.

Cards

- Rounded corners
- Consistent padding
- Optional subtle hover elevation
- Clear title hierarchy
- Never feel cramped

Statistics

- Large numerical values
- Supporting labels
- Consistent spacing
- Easy comparison
- Accessible colour choices

Tables

- Avoid unless genuinely the best representation.
- Prefer cards on mobile.

Before making styling decisions, read these reference docs (paths are relative to the repo root):
- `reference/ellieatwhl-design-system/README.md` for the overall design philosophy and brand attributes.
- `reference/ellieatwhl-design-system/VISUAL_LANGUAGE.md` for colour, typography, spacing, and motion principles.
- `reference/ellieatwhl-design-system/COMPONENT_LIBRARY.md` for the shared component library's conventions and usage guidelines.
- `reference/CSS_ARCHITECTURE.md` for the CSS architecture and best practices.
- `reference/BUTTON_MIGRATION.md` for the shared `Button` component and migration status.
- `reference/TAILWIND_MIGRATION_PLAN.md` for the TailwindCSS migration plan and best practices.
