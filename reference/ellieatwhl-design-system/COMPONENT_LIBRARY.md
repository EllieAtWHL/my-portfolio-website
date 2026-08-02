# Component Library

## Purpose

Components are the building blocks of the EllieAtWHL experience.

Every component should solve a clear problem, communicate its purpose immediately and integrate seamlessly with the rest of the interface.

New components should only be introduced when an existing component cannot reasonably be adapted.

Consistency is preferred over novelty.

---

# Component Philosophy

Every component should be:

* Predictable
* Reusable
* Accessible
* Responsive
* Lightweight
* Easy to scan
* Visually consistent
* Content-first

A component should never exist purely because a page requires a unique layout.

Instead, pages should be assembled from reusable building blocks wherever possible.

---

# Component Hierarchy

Components generally fall into one of four categories.

## Layout Components

Responsible for page structure.

Examples include:

* Page containers
* Content sections
* Grid layouts
* Split layouts
* Sidebars
* Hero sections

These define the overall rhythm of a page rather than presenting content directly.

---

## Content Components

Responsible for presenting information.

Examples include:

* Cards
* Articles
* Statistics
* Timelines
* Tables
* Lists
* Quotes
* Galleries
* Code snippets

These should prioritise readability above all else.

---

## Navigation Components

Responsible for helping users move through the site.

Examples include:

* Primary navigation
* Breadcrumbs
* Pagination
* Tabs
* Secondary navigation
* Filters

Navigation should always reduce cognitive effort.

---

## Interactive Components

Responsible for user actions.

Examples include:

* Buttons
* Forms
* Toggles
* Search
* Menus
* Dialogs
* Dropdowns

Interaction should feel effortless and predictable.

---

# Cards

Cards are one of the primary organisational patterns within EllieAtWHL.

They provide structure without introducing unnecessary visual weight.

Cards should:

* Group related information
* Improve scanning
* Maintain generous padding
* Present a clear hierarchy
* Avoid unnecessary decoration

Cards should not become miniature web pages.

If a card contains excessive information, the content should be reconsidered.

---

## Card Anatomy

Where applicable, cards should contain:

* Title
* Supporting metadata
* Primary content
* Optional actions

Not every card requires every element.

Cards should remain as simple as possible.

---

## Interactive Cards

Cards may be clickable.

When they are:

* Interaction should be obvious.
* Hover states should be subtle.
* Keyboard focus must be fully supported.
* The entire interaction area should be clear.

Users should never be surprised that a card is interactive.

---

# Buttons

Buttons represent intentional actions.

Each page should establish a clear primary action.

Secondary actions should remain visually subordinate.

Button styling should communicate importance through hierarchy rather than excessive colour.

A button showing an in-progress action (the shared `Button` component's
`loading` prop) shows a small spinner alongside its label. This is a
deliberate, accepted exception to the "skeleton over spinners" loading
guidance - see "Loading States" in `VISUAL_LANGUAGE.md` for why.

---

## Button Priorities

Where multiple buttons exist:

1. Primary action
2. Secondary action
3. Tertiary action
4. Destructive action

Avoid presenting multiple visually dominant actions beside one another.

---

# Links

Links should always be recognisable.

Users should never need to guess whether text is interactive.

Links appearing within body copy should remain visually distinct without interrupting reading flow.

External links should communicate that users are leaving the current experience where appropriate.

---

# Forms

Forms should minimise effort.

Only request information that is genuinely required.

Where possible:

* Group related fields.
* Use sensible defaults.
* Validate early.
* Explain errors clearly.

The interface should help users succeed rather than punish mistakes.

---

## Form Validation

Validation should be:

* Immediate where appropriate
* Clear
* Helpful
* Accessible

Error messages should explain how to resolve the problem rather than merely identifying it.

---

# Search

Search should be treated as navigation rather than data entry.

Users should quickly understand:

* what can be searched
* what has been matched
* how to refine results

Search should remain responsive and forgiving.

---

# Filters

Filters should progressively reduce complexity.

Avoid presenting every filtering option immediately.

Where large numbers of filters exist:

* Group related options.
* Collapse advanced filters.
* Preserve user selections where practical.

Filtering should simplify exploration rather than complicate it.

---

# Tables

Tables should only be used when direct comparison between rows and columns is genuinely beneficial.

Avoid using tables for information that would be more understandable as cards or lists.

On smaller screens, tables should adapt thoughtfully rather than simply becoming horizontally scrollable where possible.

---

# Lists

Lists communicate collections.

Spacing should clearly distinguish:

* separate items
* grouped information
* nested information

Lists should never feel cramped.

---

# Badges

Badges provide lightweight metadata.

Examples include:

* Categories
* Tags
* Status
* Labels

Badges should support understanding rather than dominate attention.

Avoid creating badge collections that become visually noisy.

---

# Statistics

Statistics are particularly important within EllieAtWHL.

Numbers should communicate information immediately.

Visual hierarchy should prioritise:

1. Value
2. Label
3. Context

Supporting explanation should remain secondary.

Avoid decorative treatments that reduce readability.

---

# Charts

Charts should simplify understanding.

Choose the visualisation that answers the user's question most effectively.

Avoid charts purely because they appear visually interesting.

Accessibility must always be considered when relying on colour.

---

# Timelines

Timelines communicate progression.

They should emphasise:

* sequence
* context
* relationships
* key milestones

Users should naturally understand what happened and when.

---

# Alerts

Alerts exist to communicate important information.

Every alert should answer:

* What happened?
* Why does it matter?
* What should the user do next?

Avoid unnecessarily alarming language.

Severity should match importance.

---

# Dialogs

Dialogs should interrupt only when necessary.

Before introducing a modal dialog ask:

* Can this be completed inline?
* Can this become its own page?
* Is interruption genuinely required?

Dialogs should remain focused on a single task.

---

# Navigation Components

Navigation should always communicate location.

Users should never become disoriented.

Navigation components should prioritise:

* clarity
* consistency
* discoverability

Complex navigation structures should be avoided unless they significantly improve usability.

---

# Empty States

Every empty state should be intentionally designed.

An empty page should:

* explain the situation
* reassure the user
* suggest a next step

Empty states should never appear unfinished.

---

# Loading States

Loading should preserve confidence.

Whenever practical:

* maintain page layout
* display placeholders
* reduce layout shift

Users should understand what is about to appear.

---

# Error States

Errors should remain calm.

Explain:

* what happened
* why it happened (if known)
* how the user can recover

Never blame the user.

Never expose unnecessary technical detail.

---

# Responsive Behaviour

Components should adapt naturally across devices.

Responsive behaviour should preserve:

* hierarchy
* readability
* usability

Rather than hiding information, components should reorganise themselves appropriately.

---

# Accessibility Expectations

Every component must support:

* keyboard navigation
* visible focus indicators
* semantic HTML
* assistive technologies
* sufficient colour contrast
* reduced motion preferences

Accessibility is considered part of the component definition rather than an enhancement.

---

# Component Evolution

Before introducing a new component ask:

* Does an existing component already solve this problem?
* Could an existing component be extended?
* Will users recognise this interaction?
* Is this adding complexity or reducing it?
* Will this still feel appropriate in two years' time?

A smaller, well-defined component library is more valuable than a large collection of highly specialised components.

---

# Component Checklist

Every component introduced to EllieAtWHL should satisfy the following criteria:

* Solves a clear user problem.
* Uses established visual patterns.
* Feels visually consistent.
* Is accessible by default.
* Behaves predictably.
* Supports responsive layouts.
* Avoids unnecessary decoration.
* Is reusable in multiple contexts.
* Places content ahead of presentation.
* Contributes positively to the overall design language.

If a component fails several of these criteria, it should be redesigned before implementation.

---

# Guiding Principle

Components are not individual pieces of interface.

They are members of the same design family.

When viewed together, they should feel cohesive, predictable and unmistakably part of EllieAtWHL.

Every new component should strengthen that identity rather than introduce a competing one.
