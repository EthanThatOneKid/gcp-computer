# Design System — GCP Computer

## 1. Visual Theme & Atmosphere

GCP Computer embodies a cutting-edge digital spirituality aesthetic—a cosmic-meets-minimal design language that celebrates the intersection of human consciousness and technology. The visual identity is characterized by profound darkness punctuated by ethereal glows, mystical geometry, and a carefully restrained accent palette that speaks to the numinous and speculative. It's a design system built for immersive, contemplative experiences where every pixel carries intentionality. The atmosphere balances technical precision with organic, hand-drawn qualities, creating an interface that feels both futuristic and deeply human. Content takes precedence; the UI disappears into service of profound visual storytelling.

**Key Characteristics**

- Predominantly dark backgrounds emphasizing content contrast and visual breathing room
- Minimal, purposeful use of accent colors for critical interactions and highlights
- Ethereal purples and warm terracottas as emotional anchors
- Grid-based geometric layouts with organic, flowing imagery
- Typography that feels handcrafted yet structured
- High contrast accessibility without harshness
- Emphasis on negative space and contemplative pacing

## 2. Color Palette & Roles

### Primary

- **Deep Black** (`#0D0D0D`): Primary background and high-contrast text anchor
- **Pristine White** (`#FFFFFF`): Foreground text and light element fill
- **Pure Black** (`#000000`): Maximum contrast overlays and critical text

### Accent Colors

- **Ethereal Lavender** (`#D2BEFF`): Primary accent for highlights, interactive states, and spiritual/elevated moments
- **Warm Terracotta** (`#EF7759`): Secondary accent for warmth, energy, and action states
- **Ocean Blue** (`#1E90FF`): Tertiary accent for tech-forward and informational elements (inferred from color theory balance)

### Interactive

- **Danger Red** (`#BD3C1F`): Error states, critical warnings, and destructive actions

### Neutral Scale

- **Almost Black** (`#141414`): Slightly elevated surfaces from primary black
- **Charcoal** (`#212020`): Tertiary background for layered depth
- **Medium Gray** (`#323131`): Interactive borders and disabled states
- **Light Gray** (`#F7F5F3`): Subtle surface elevation and card backgrounds
- **Lighter Gray** (`#E8E6E4`): Border strokes and divider lines

### Surface & Borders

- **Deep Navy** (`#192F35`): Card and container backgrounds for tech/data contexts
- **Muted Green** (`#43542D`): Nature and organic content contexts
- **Forest Dark** (`#142417`): Deep surface for video and imagery contexts
- **Semi-Transparent White** (`#FFF0`): Overlay and glass-morphism effects
- **Semi-Transparent Black** (`#0003`): Darkening overlays and subtle shadows

## 3. Typography Rules

### Font Family

**Primary:** `cosmosOracle`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `system-ui`, sans-serif

**Secondary:** `cosmosOracle`, `Georgia`, serif (for emphasis and editorial contexts)

### Hierarchy

| Role       | Font                               | Size | Weight | Line Height | Letter Spacing | Notes                              |
| ---------- | ---------------------------------- | ---- | ------ | ----------- | -------------- | ---------------------------------- |
| Display 1  | cosmosOracle                       | 32px | 400    | 40px        | 0px            | Hero titles and page headers       |
| Display 2  | cosmosOracle                       | 26px | 400    | 32px        | 0px            | Section headers and profile names  |
| Heading 1  | cosmosOracle                       | 24px | 400    | 30px        | 0px            | Major section breaks               |
| Heading 2  | cosmosOracle                       | 20px | 400    | 26px        | 0px            | Subsection headers                 |
| Heading 3  | cosmosOracle                       | 18px | 400    | 24px        | 0px            | Card titles and labels             |
| Body Large | cosmosOracle                       | 16px | 400    | 24px        | 0px            | Links and primary body text        |
| Body       | cosmosOracle                       | 14px | 500    | 18px        | 0px            | Primary UI text and descriptions   |
| Body Small | cosmosOracle                       | 12px | 400    | 16px        | 0px            | Secondary information and captions |
| Button     | cosmosOracle                       | 14px | 500    | 18px        | 0px            | Interactive button labels          |
| Input      | cosmosOracle                       | 14px | 400    | 18px        | 0px            | Form field text                    |
| Monospace  | `Monaco`, `Courier New`, monospace | 12px | 400    | 16px        | 0px            | Code blocks and technical text     |

### Principles

- **Restraint over ornamentation:** Single font family maintains visual coherence and focus on content
- **Weight hierarchy matters:** Use weight 400 for reading comfort, 500 for emphasis and interaction
- **Generous line height:** Breathing room in body text aids contemplative reading
- **No all-caps emphasis:** Favor weight and size changes to maintain accessibility and elegance
- **Consistent vertical rhythm:** All sizes maintain alignment to 2px baseline grid

## 4. Component Styles

### Buttons

#### Primary Button

- **Background:** `#D2BEFF`
- **Text Color:** `#0D0D0D`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `0px 16px`
- **Height:** `54px`
- **Border Radius:** `33554400px` (fully rounded)
- **Border:** `1px solid rgba(0, 0, 0, 0.12)`
- **Box Shadow:** `none`
- **Line Height:** `18px`
- **Hover State:** Background `#C9ABFF`, maintain border
- **Active State:** Background `#B388FF`, deepen text to `#000000`
- **Disabled State:** Background `#E8E6E4`, Text `#323131`, opacity 0.5

#### Secondary Button (Icon, 26px)

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `0px`
- **Height:** `26px`
- **Width:** `26px`
- **Border Radius:** `8px`
- **Border:** `none`
- **Box Shadow:** `none`
- **Hover State:** Background `rgba(210, 190, 255, 0.2)`
- **Active State:** Background `rgba(210, 190, 255, 0.4)`

#### Tertiary Button (Icon, 38px)

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `0px`
- **Height:** `38px`
- **Width:** `38px`
- **Border Radius:** `33554400px` (fully rounded)
- **Border:** `none`
- **Box Shadow:** `none`
- **Hover State:** Background `rgba(210, 190, 255, 0.15)`
- **Active State:** Background `rgba(210, 190, 255, 0.3)`

#### Ghost Button (Circular, 40px)

- **Background:** `#F7F5F3`
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 16px, weight 400
- **Padding:** `0px`
- **Height:** `40px`
- **Width:** `40px`
- **Border Radius:** `33554400px` (fully rounded)
- **Border:** `none`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `#E8E6E4`
- **Active State:** Background `#D2BEFF`

### Links

#### Link Button (54px Primary)

- **Background:** `#D2BEFF`
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 16px, weight 400
- **Padding:** `0px`
- **Height:** `54px`
- **Width:** `54px`
- **Border Radius:** `33554400px` (fully rounded)
- **Border:** `1px solid rgba(0, 0, 0, 0.12)`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `#C9ABFF`

#### Text Link (Accent Color)

- **Background:** `transparent`
- **Text Color:** `#EF7759`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `0px`
- **Border:** `none`
- **Line Height:** `18px`
- **Hover State:** Text Color `#BD3C1F`, text-decoration `underline`
- **Active State:** Text Color `#8B2810`

#### Navigation Link (Accent Color)

- **Background:** `transparent`
- **Text Color:** `#EF7759`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `0px`
- **Border:** `none`
- **Line Height:** `18px`
- **Hover State:** Text Color `#BD3C1F`, opacity 0.8

### Cards & Containers

#### Standard Card

- **Background:** `#FFFFFF`
- **Border:** `1px solid #E8E6E4`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `0px 2px 8px rgba(0, 0, 0, 0.06)`
- **Hover State:** Box Shadow `0px 4px 16px rgba(0, 0, 0, 0.12)`

#### Dark Card

- **Background:** `#0D0D0D`
- **Border:** `1px solid #323131`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `0px 2px 8px rgba(0, 0, 0, 0.3)`

#### Elevated Surface

- **Background:** `#F7F5F3`
- **Border:** `none`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `0px 1px 4px rgba(0, 0, 0, 0.04)`

### Inputs & Forms

#### Text Input

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 14px, weight 400
- **Padding:** `8px 0px`
- **Height:** `17px` (line height driven)
- **Border:** `none`
- **Border Bottom:** `1px solid #E8E6E4`
- **Line Height:** `18px`
- **Placeholder Color:** `#323131`
- **Focus State:** Border Bottom `1px solid #D2BEFF`, background `rgba(210, 190, 255, 0.04)`
- **Error State:** Border Bottom `1px solid #BD3C1F`
- **Disabled State:** Color `#323131`, opacity 0.5, border `1px solid #E8E6E4`

#### Search Input

- **Background:** `transparent`
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 14px, weight 400
- **Padding:** `8px 12px`
- **Height:** `40px`
- **Border Radius:** `8px`
- **Border:** `1px solid #E8E6E4`
- **Placeholder Color:** `#323131`
- **Focus State:** Border `1px solid #D2BEFF`, background `rgba(210, 190, 255, 0.02)`

### Navigation

#### Top Navigation Bar

- **Background:** `#FFFFFF`
- **Height:** `64px`
- **Padding:** `0px 32px`
- **Border Bottom:** `1px solid #E8E6E4`
- **Display:** flex, align-items center, justify-content space-between
- **Box Shadow:** `none`

#### Navigation Link

- **Color:** `#000000`
- **Font:** cosmosOracle, 14px, weight 500
- **Padding:** `8px 12px`
- **Hover State:** Color `#D2BEFF`
- **Active State:** Color `#EF7759`, border-bottom `2px solid #EF7759`

#### Breadcrumb

- **Color:** `#323131`
- **Font:** cosmosOracle, 12px, weight 400
- **Separator:** `" / "` in `#323131`
- **Active Item Color:** `#000000`

### Badges

#### Primary Badge

- **Background:** `#D2BEFF`
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 12px, weight 500
- **Padding:** `4px 8px`
- **Border Radius:** `16px`
- **Border:** `none`

#### Secondary Badge

- **Background:** `#F7F5F3`
- **Text Color:** `#000000`
- **Font:** cosmosOracle, 12px, weight 500
- **Padding:** `4px 8px`
- **Border Radius:** `16px`
- **Border:** `1px solid #E8E6E4`

#### Error Badge

- **Background:** `#BD3C1F`
- **Text Color:** `#FFFFFF`
- **Font:** cosmosOracle, 12px, weight 500
- **Padding:** `4px 8px`
- **Border Radius:** `16px`
- **Border:** `none`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Scale:**

- `4px`: Micro spacing (icon margins, tight grouping)
- `8px`: Extra small (compact form inputs, tight padding)
- `12px`: Small (label spacing, tight sections)
- `16px`: Base (standard margin, form spacing)
- `24px`: Medium (card padding, section spacing)
- `32px`: Large (container padding, major sections)
- `40px`: Extra large (section margin, dramatic breaks)
- `48px`: XXL (page margin, grid gaps)
- `64px`: XXXL (hero spacing, max breathing room)
- `72px`: Quad (massive section breaks, hero to content)

**Usage Context:**

- Micro interactions: `4px`
- Form fields and compact components: `8px` to `12px`
- Card interiors and button groups: `16px` to `24px`
- Page sections and containers: `32px` to `48px`
- Full-page rhythm and hero layouts: `64px` to `72px`

### Grid & Container

**Max Width:** `1440px` (desktop), `100%` (tablet/mobile with padding)

**Column Strategy:**

- **Desktop:** 12-column grid with `24px` gutters
- **Tablet:** 6-column grid with `16px` gutters
- **Mobile:** 1-column layout with `16px` side padding

**Section Patterns:**

- Hero: Full width with `72px` vertical padding
- Content sections: Constrained to `1200px` with `48px` sides, `64px` vertical
- Card grids: Flexible 4-column (desktop), 2-column (tablet), 1-column (mobile) with `24px` gap
- Sidebar layouts: 65% / 35% split on desktop, stacked on tablet

### Whitespace Philosophy

GCP Computer employs profound negative space as a design principle, not an afterthought. Large stretches of darkness between content elements encourage contemplation and focus. The grid breathes; components never feel crowded. Whitespace is semantic—it groups related elements and creates visual hierarchy through absence. Section breaks use vertical rhythm (`64px` / `72px`) to establish pacing and prevent cognitive overload. This restraint elevates the moments when accent colors and content do appear.

### Border Radius Scale

- `0px`: Sharp edges for structural elements and technical components
- `3px`: Micro rounding for very small buttons and controls
- `8px`: Standard rounding for cards, inputs, and medium components
- `16px`: Pronounced rounding for badges and pills
- `33554400px` (effectively infinite): Fully circular buttons and avatars

## 6. Depth & Elevation

| Level              | Treatment                           | Use                                       |
| ------------------ | ----------------------------------- | ----------------------------------------- |
| Flat (Level 0)     | No shadow, no elevation             | Backgrounds, base surfaces                |
| Ground (Level 1)   | `0px 1px 4px rgba(0, 0, 0, 0.04)`   | Subtle surface lifts, minimal elevation   |
| Raised (Level 2)   | `0px 2px 8px rgba(0, 0, 0, 0.06)`   | Cards, standard components, default hover |
| Elevated (Level 3) | `0px 4px 16px rgba(0, 0, 0, 0.12)`  | Modals, popovers, focused cards           |
| Floating (Level 4) | `0px 8px 24px rgba(0, 0, 0, 0.18)`  | Dropdowns, tooltips, top-level overlays   |
| Extreme (Level 5)  | `0px 12px 32px rgba(0, 0, 0, 0.24)` | Maximum emphasis, splash screens          |

**Shadow Philosophy:**

GCP Computer's elevation system is restrained and naturalistic. Shadows are soft, warm-leaning, and never harsh—they suggest subtle depth rather than aggressive layering. The dark background (`#0D0D0D`) absorbs shadows naturally, creating a unified visual plane where component separation is achieved through border strokes and careful color rather than heavy shadows. Interactive states elevate components subtly; the focus is on content, not chrome. Shadows increase only for critical, attention-demanding moments (modals, critical alerts).

## 7. Do's and Don'ts

### Do

- **Prioritize content over chrome:** Always ensure imagery, text, and core functionality dominate the visual hierarchy
- **Use Ethereal Lavender (`#D2BEFF`) sparingly:** Reserve it for primary CTAs, highlights, and moments of spiritual/elevated interaction; overuse dilutes impact
- **Maintain dark backgrounds as default:** Let content breathe against darkness; avoid excessive white surfaces except for cards and explicit foreground containers
- **Stack vertical rhythm consistently:** Use the spacing scale (`16px`, `24px`, `32px`, `48px`) for all major sections; establish predictable pacing
- **Group related elements with tight spacing (`8px`–`12px`):** Let semantic whitespace (larger gaps) separate distinct concepts
- **Ensure minimum touch targets of `44px`:** All interactive elements must be comfortably tappable on mobile
- **Layer fonts with restraint:** Stick to cosmosOracle; vary size and weight, not family
- **Test contrast ratios:** Text on accent backgrounds must maintain WCAG AA compliance (7:1 minimum for small text)
- **Use Warm Terracotta (`#EF7759`) for warmth and energy:** Links, secondary CTAs, and moments of action or passion
- **Build with semantic color roles:** Treat `#BD3C1F` exclusively for errors and destructive actions; never use for primary UI

### Don't

- **Avoid mixing multiple font families:** Cohesion is compromised by serif/sans mixture; use weight and size instead
- **Don't use shadows to create separation:** Prefer borders (`#E8E6E4`), color shifts (`#F7F5F3`), or clever negative space
- **Avoid bright, saturated accent colors:** The palette is intentionally muted and spiritual; garish accents violate the mood
- **Don't crowd components:** If an element needs padding, add it; if a layout needs breathing room, give it `48px` vertical gap—never compromise for density
- **Avoid all-caps text:** It breaks the elegant flow and harms accessibility; use weight and size for emphasis
- **Don't apply borders to every card:** Minimal borders on light surfaces; dark surfaces need strokes for definition (`#323131`), but light cards often work border-free
- **Don't orphan text in large whitespace:** Ensure text always has a clear semantic container; floating text feels adrift
- **Avoid color-only information:** Always pair color with iconography or text labels (especially critical for error states and status indicators)
- **Don't over-animate:** Motion should be subtle, purposeful, and under 300ms; constant animation distracts from content
- **Avoid multiple concurrent hover states:** Only one interactive element per group should highlight; clarify focus clearly

## 8. Responsive Behavior

### Breakpoints

| Breakpoint    | Width         | Key Changes                                                                       |
| ------------- | ------------- | --------------------------------------------------------------------------------- |
| Mobile        | 320px–767px   | 1-column layout, `16px` side padding, full-width cards, stacked navigation        |
| Tablet        | 768px–1023px  | 2–6 column grid, `24px` padding, sidebar when applicable, optimized touch targets |
| Desktop       | 1024px–1439px | 12-column grid, `32px` padding, full component suite, 2-3 column cards            |
| Large Desktop | 1440px+       | Max-width container (`1440px`), centered, generous side gutters                   |

### Touch Targets

- **Minimum interactive element:** `44px` × `44px` (button, link, icon)
- **Comfortable spacing between targets:** `8px` minimum gap
- **Recommended tappable area:** `48px` × `48px` for frequently used controls
- **Form inputs (height):** `40px`–`54px` for comfortable thumb interaction
- **Avoid targets smaller than `32px`:** Require click-through explanations or increase size

### Collapsing Strategy

**Mobile (320px–767px):**

- **Navigation:** Hamburger menu with side drawer or bottom sheet navigation
- **Cards:** Stack vertically, full width with `16px` margins
- **Grid layouts:** Single column; multi-column grids become 1×N
- **Modals:** Full-height with `16px` padding on sides
- **Typography:** Reduce display sizes by 4px–6px; maintain line-height ratios
- **Spacing:** Reduce vertical gaps from `64px` to `48px`, `48px` to `32px`
- **Forms:** Full-width inputs, labels stack above fields

**Tablet (768px–1023px):**

- **Navigation:** Horizontal navigation bar or collapsible sidebar
- **Cards:** 2-column grid with `24px` gaps
- **Modals:** 90% width, max `600px`
- **Sidebar layouts:** Maintain split but adjust proportions (60% / 40%)
- **Typography:** Maintain hierarchy but scale down display by 2px–4px
- **Forms:** Input width max `400px`, labels inline or stacked depending on field complexity

**Desktop (1024px+):**

- **Navigation:** Full horizontal navigation bar or permanent sidebar
- **Cards:** 3–4 column grid with `24px` gaps
- **Modals:** Fixed max-width `800px`, centered on viewport
- **Typography:** Full size as defined in hierarchy table
- **Spacing:** Maintain full spacing scale
- **Forms:** Input width max `500px`, labels inline for simple forms

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Ethereal Lavender (`#D2BEFF`)
- **Secondary CTA / Links:** Warm Terracotta (`#EF7759`)
- **Background (default):** Deep Black (`#0D0D0D`)
- **Heading Text:** Pure Black (`#000000`)
- **Body Text:** Pure Black (`#000000`) on light surfaces, Pristine White (`#FFFFFF`) on dark
- **Borders:** Light Gray (`#E8E6E4`) on light, Medium Gray (`#323131`) on dark
- **Surfaces (cards):** Pristine White (`#FFFFFF`) primary, Light Gray (`#F7F5F3`) secondary
- **Error / Danger:** Danger Red (`#BD3C1F`)
- **Disabled / Muted:** Medium Gray (`#323131`)
- **Subtle Overlays:** Semi-Transparent Black (`#0003`) for darken, Semi-Transparent White (`#FFF0`) for lighten

### Iteration Guide

1. **Start with background:** Always establish the surface color first—default to `#0D0D0D` for full pages, `#FFFFFF` for cards
2. **Apply typography hierarchy:** Never skip heading levels; use the exact sizes from the hierarchy table (26px for Display 2, 14px for Body, etc.)
3. **Set button styles by role:** Primary buttons use `#D2BEFF` with `#0D0D0D` text, rounded pill shape (`33554400px` radius). Secondary buttons are transparent with `#000000` text and `8px` radius.
4. **Establish spacing rhythm:** Use `24px` padding inside cards, `48px` gaps between major sections, `8px` between tightly grouped elements. Never deviate without semantic reason.
5. **Build grid with constraints:** Desktop: 12 columns, `24px` gutter. Tablet: 6 columns, `16px` gutter. Mobile: full-width with `16px` side padding.
6. **Test contrast and accessibility:** Text on `#D2BEFF` must be `#0D0D0D`; text on `#FFFFFF` must be `#000000`. Verify WCAG AA ratios (7:1 for small text, 4.5:1 minimum).
7. **Use borders sparingly:** Prefer color and whitespace; only add borders (`1px solid #E8E6E4` on light, `1px solid #323131` on dark) when semantic separation is necessary.
8. **Minimize shadows:** Only apply elevation shadows for modals and hovered cards. Default to flat or ground-level shadows (`0px 1px 4px rgba(0, 0, 0, 0.04)`).
9. **Accent color restraint:** Use `#D2BEFF` for max 3–5 interactive elements per page. Use `#EF7759` for secondary CTAs and warmth. Never mix both heavily or the palette loses impact.
10. **Verify touch targets:** Ensure all buttons, links, and interactive elements are minimum `44px` × `44px`; check gap spacing is at least `8px` between targets on mobile.
