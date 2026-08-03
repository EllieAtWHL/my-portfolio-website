# EllieAtWHL Design System

**Version:** 1.0 (Draft)

**Status:** Living Document

---

# Introduction

## Purpose

This document defines the design language, interaction principles and visual identity of EllieAtWHL.

It serves as the single source of truth for anyone designing, developing or extending the website, whether they are a human contributor or an AI coding assistant such as Claude Code.

Rather than documenting individual pages, this guide explains the principles that underpin every design decision. New pages, features and components should feel like natural extensions of the existing site rather than isolated additions.

This document is intentionally opinionated. Consistency is valued over novelty, and reuse is preferred over reinvention.

---

# About EllieAtWHL

EllieAtWHL is a personal project that combines technical expertise, community involvement and football content into a cohesive digital experience.

Unlike many personal websites, it is not simply a blog or portfolio. Likewise, the Spurs Women section is not simply a football statistics site.

Instead, EllieAtWHL is built around a single philosophy:

> Present rich information in a way that feels calm, approachable and effortless to explore.

Everything within the site should reinforce that philosophy.

---

# Design Philosophy

## Content Always Comes First

Every design decision begins with the content.

Visual elements exist to improve understanding rather than attract attention.

A visitor should remember the information they discovered, not the interface they used.

If a decorative element does not improve comprehension, hierarchy or usability, it should not exist.

---

## Calm Interfaces

EllieAtWHL deliberately avoids visual noise.

Whitespace is treated as a design component rather than empty space.

Layouts should feel spacious, allowing users to absorb information without feeling overwhelmed.

The interface should never compete with the content.

---

## Simplicity Without Feeling Sparse

Minimalism should never result in a lack of useful information.

The objective is clarity, not emptiness.

Where information density increases, hierarchy becomes more important rather than introducing additional decoration.

---

## Progressive Disclosure

Users should never be overwhelmed with information immediately.

Pages should naturally guide visitors through increasingly detailed information.

Examples include:

* Summary before detail.
* Statistics before analysis.
* Headlines before full articles.
* High-level navigation before advanced filtering.

Complexity should emerge naturally rather than appearing immediately.

---

## Consistency Builds Trust

Every page should feel like it belongs within the same ecosystem.

Users should quickly develop confidence because familiar components behave consistently throughout the site.

Visual consistency is considered more important than introducing unique layouts for individual pages.

---

# Core Brand Attributes

The EllieAtWHL brand should consistently feel:

* Modern
* Approachable
* Thoughtful
* Trustworthy
* Informative
* Calm
* Personal
* Inclusive
* Technically confident
* Community-driven

It should never feel:

* Corporate
* Over-designed
* Aggressive
* Busy
* Clickbait-driven
* Sensationalist
* Gimmicky
* Artificially playful

---

# User Experience Principles

## Reduce Cognitive Load

Every interaction should reduce the amount of thinking required.

Users should instinctively understand:

* where they are
* what they are looking at
* what they can do next
* how to return

If additional explanation is required, the interface should be reconsidered.

---

## Predictability

Interactive elements should always behave consistently.

Buttons should look like buttons.

Links should look like links.

Cards should never unexpectedly become interactive unless they are clearly presented as such.

Consistency is more valuable than novelty.

---

## Information Hierarchy

Every page should establish a clear visual hierarchy.

Users should naturally notice:

1. Page purpose
2. Primary content
3. Supporting information
4. Secondary actions
5. Metadata

Nothing should compete unnecessarily for attention.

---

## Accessibility Is Not Optional

Accessibility is a core design principle rather than a final review step.

Every design decision should assume users may:

* use keyboard navigation
* use screen readers
* require high contrast
* zoom significantly
* browse on mobile
* browse in bright sunlight
* browse in dark environments

Accessibility improvements should never be considered optional enhancements.

---

# Visual Language

## Overall Feel

The visual identity should communicate quiet confidence.

Rather than relying on dramatic colours or elaborate effects, the interface should establish quality through careful spacing, typography and hierarchy.

The design should feel polished without appearing flashy.

---

## Whitespace

Whitespace is one of the defining characteristics of EllieAtWHL.

It should be used to:

* separate concepts
* establish hierarchy
* improve readability
* reduce cognitive load

Avoid introducing borders simply because two pieces of content need separating.

Prefer spacing wherever practical.

---

## Layout Rhythm

Content should follow a consistent rhythm throughout the site.

Large sections should have generous vertical spacing.

Related components should remain visually connected.

Margins and padding should feel intentional rather than arbitrary.

Users should subconsciously recognise the site's rhythm after browsing only a few pages.

---

## Component Philosophy

Components should be:

* reusable
* modular
* predictable
* lightweight
* easy to scan

Whenever a new feature is required, existing components should be adapted before creating entirely new ones.

A smaller number of versatile components is preferable to a large collection of specialised ones.

---

# Navigation Philosophy

Navigation should answer three questions immediately:

* Where am I?
* Where can I go?
* How do I get back?

Navigation should feel effortless rather than feature-rich.

Avoid overwhelming users with unnecessary menu options.

The most important destinations should always remain immediately discoverable.

---

# Mobile-First Thinking

Although EllieAtWHL offers a rich desktop experience, every feature should begin with mobile.

Desktop layouts should expand gracefully rather than becoming fundamentally different experiences.

Responsive design should involve reflowing information rather than removing important functionality.

No page should rely on hover interactions to remain usable.

---

# Theme Philosophy

The main EllieAtWHL site supports both light and dark mode.

These are not inverse colour schemes.

Each theme should feel intentionally designed.

Users choosing dark mode should experience the same sense of clarity, readability and polish as those using light mode.

Dark mode should never feel like a secondary implementation.

Conversely, the Spurs Women section is designed around a single visual theme rather than a light/dark toggle (see `VISUAL_LANGUAGE.md`'s "Spurs Women" section for the caveat that a few components have unintentional `dark:` classes that still respond to the site-wide toggle). It should continue to reflect the same design principles, maintaining consistency in spacing, typography, hierarchy and component behaviour with the rest of EllieAtWHL.

---

# The EllieAtWHL Test

Before introducing any new feature, ask the following questions.

* Does this improve the user experience?
* Does it reduce cognitive load?
* Does it make information easier to understand?
* Does it reuse existing design patterns?
* Does it strengthen visual consistency?
* Would removing something improve the page?
* Does it remain accessible?
* Does it work equally well on mobile?
* Does it feel unmistakably like EllieAtWHL?
* If someone visited this page in isolation, would they recognise it as part of the same website?

If the answer to any of these questions is "no", the design should be reconsidered before implementation.

---

# Guiding Principle

If there is ever uncertainty about a design decision, favour the option that improves clarity, consistency and usability over the one that introduces novelty.

EllieAtWHL should feel like a thoughtfully curated experience where every element has a purpose.

Nothing should exist simply because it can.
