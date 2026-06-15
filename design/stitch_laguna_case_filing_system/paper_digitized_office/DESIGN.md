---
name: Paper Digitized Office
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444652'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747683'
  outline-variant: '#c4c6d4'
  surface-tint: '#3a59b1'
  primary: '#001c59'
  on-primary: '#ffffff'
  primary-container: '#002f87'
  on-primary-container: '#7f9cf8'
  inverse-primary: '#b4c5ff'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#4b0300'
  on-tertiary: '#ffffff'
  tertiary-container: '#730700'
  on-tertiary-container: '#ff765f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174c'
  on-primary-fixed-variant: '#1d4097'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a7'
  on-tertiary-fixed: '#400200'
  on-tertiary-fixed-variant: '#910b00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-title:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  section-header:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 240px
  gutter: 1.5rem
  margin-page: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  table-cell-padding: 12px 16px
---

## Brand & Style
The design system is built on the metaphor of a "Digitized Records Office." It prioritizes order, privacy, and institutional trust for school counselors. The aesthetic leans toward a **Corporate/Modern** style with **Minimalist** sensibilities, utilizing structural lines rather than shadows to define space. 

The emotional response should be one of calm focus. By mimicking the tactile organization of a physical filing cabinet—through tabbed navigation and "official stamp" indicators—the system provides a familiar mental model for administrative work while maintaining the efficiency of a high-performance SaaS tool.

## Colors
The palette is grounded in "Institutional Blue" and "Paper Neutrals" to evoke a sense of authority and clarity.

- **Primary Deep Blue (#002F87):** Used for primary actions, branding, and active navigational states.
- **Surface Palette:** The main workspace uses `#F3F3F3`, while `#FAF8F4` (Paper Neutral) is reserved for document-specific panels or secondary containers to provide a subtle "sheet of paper" contrast.
- **Semantic Stamps:** Statuses use a dual-tone system (e.g., Deep Green text on a Light Green background) to ensure legibility while maintaining the "stamped" aesthetic.
- **Borders:** A consistent `#E2E2E2` is the primary tool for layout separation, replacing heavy shadows.

## Typography
The system employs a tri-font pairing strategy to balance authority, readability, and technical precision.

- **Serif (Source Serif 4):** Reserved for page titles, section dividers, and formal document headers. This provides the "official" institutional feel.
- **Sans-Serif (Inter):** The workhorse font for all UI elements, inputs, and general body copy. It ensures high legibility on standard monitors.
- **Monospace (IBM Plex Mono):** Used exclusively for Case IDs, timestamps, and numerical data to prevent character confusion and imply a "system-generated" record.

## Layout & Spacing
The layout follows a **Fixed Sidebar / Fluid Content** model optimized for desktop viewing. 

- **Sidebar (240px):** Positioned on the left, acting as the "filing cabinet" chassis.
- **Content Area:** A fluid container with a maximum width of 1440px to prevent excessive line lengths in case notes.
- **Grid:** A standard 8px spacing system governs all margins and padding. 
- **Zebra Striping:** Tables use a background of `#F3F3F3` on even rows to assist the eye in tracking horizontal data across wide screens.

## Elevation & Depth
In keeping with the "Paper" motif, depth is achieved through **Tonal Layers** and **1px Borders** rather than ambient shadows.

- **Level 0 (Base):** The application background (`#F3F3F3`).
- **Level 1 (Sheet):** Cards and main content containers use `#FFFFFF` with a 1px solid border of `#E2E2E2`.
- **Active Tabs:** Sidebar tabs use a "pulled forward" effect. When active, the tab background matches the main content area color (`#FFFFFF`) and removes its right border to appear physically connected to the central workspace.
- **Shadows:** Only used for temporary overlays like dropdowns or modals, using a very crisp `0px 1px 2px rgba(0,0,0,0.1)`.

## Shapes
The shape language differentiates between "containers" and "indicators."

- **Standard Elements:** Cards, input fields, and primary buttons use a **0.5rem (8px)** radius to feel modern and approachable.
- **Stamp Indicators:** Status badges use a tighter **4px** radius and a 1px solid border to mimic the look of a physical ink stamp.
- **Filing Tabs:** Sidebar navigation items have a top-right and bottom-right radius only, enhancing the "folder" metaphor.

## Components

### Navigation Sidebar
Styled as filing cabinet tabs.
- **Inactive:** Transparent background, dark gray text, indented slightly.
- **Active:** Deep Blue left-accent bar (4px), White background, connected seamlessly to the main content panel.

### Status Stamps (Badges)
Small, rectangular badges with a 4px radius. 
- **Style:** High-contrast text on a subtle tinted background (e.g., Red text on Light Red).
- **Border:** Always includes a 1px border in a slightly darker shade of the badge color.

### Zebra Tables
- **Header:** Background `#FAF8F4`, Serif typography, 1px bottom border.
- **Rows:** Alternating white and `#F3F3F3`. 
- **Selection:** Selected rows use a Primary Light (`#E8EBF3`) highlight.

### Form Controls
Inspired by DaisyUI's functional clarity.
- **Inputs:** 1px solid border, 8px radius. On focus, use a 2px Deep Blue ring with 0px offset.
- **Primary Buttons:** Solid Deep Blue (`#002F87`) with white text.
- **Secondary Buttons:** Ghost style with a 1px border of `#E2E2E2`.

### Case ID Labels
Always rendered in **IBM Plex Mono**. They should be wrapped in a subtle gray inline-block with a `1px` border to emphasize their nature as a unique record key.