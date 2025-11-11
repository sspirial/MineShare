## **Visual Design System Foundation Document**

### **Project: MineShare**

### **Version: 1.1 (Updated from Logo Analysis)**

### **Date: November 10, 2025**

### **1\. Introduction and Goals**

The purpose of this document is to establish the foundational visual rules for the **MineShare** design system, derived directly from the primary brand asset: the logo. The system aims to ensure **consistency, recognizability, and efficiency** across all digital touchpoints.

**Core Goal:** Translate the logo's aesthetic properties (color, form, typography) into a flexible and comprehensive set of design tokens and components.

---

### **2\. Design Tokens: The Extracted Foundation**

Design tokens are the visual atoms of the system. They are the named entities for color, typography, and spacing, based on the logo's core properties.

#### **2.1. Color System**

The primary color palette is **extracted directly from the logo**.

| Role | Token Name | HEX Code | Source/Usage |
| :---- | :---- | :---- | :---- |
| **Primary Brand** | `$color-brand-primary` | `#5E17EB` | Dominant background color in the logo; used for key actions, primary navigation, headers, and hero sections. |
| **Secondary Brand** | `$color-brand-secondary` | `#FFB800` | Accent color (fox illustration \+ coin fill); used for secondary CTAs, selected highlights, icons, and emphasis. |
| **Tertiary Brand** | `$color-brand-tertiary` | `#FFFFFF` | Text color of the logotype ("MineShare"); used for light-on-dark headlines and prominent brand text. |
| **Coin Accent** | `$color-coin` | `#F90` | Inner coin glow/highlight; used sparingly for decorative accents or premium indicators. |
| **Background (Light)** | `$color-background-default` | `#FFFFFF` | Default canvas color. |
| **Background (Dark)** | `$color-background-brand` | `#5E17EB` | Brand-aligned dark canvas (e.g., footer, dark mode hero). |
| **Text (Dark)** | `$color-text-default` | `#1A1A1A` | Primary text color for maximum readability on light backgrounds. |
| **Text (Light)** | `$color-text-inverse` | `#FFFFFF` | Primary text on dark/brand backgrounds. |

**Expanded Palettes:**

- Generate **tints/shades** of `$color-brand-primary` (e.g., hover: `#4A12B8`, active: `#3F0E99`).  
- Generate **tints/shades** of `$color-brand-secondary` (e.g., hover: `#CC9400`).  
- Functional colors (Success: `#10B981`, Warning: `#F59E0B`, Error: `#EF4444`) will be introduced, ensuring they are visually distinct yet complementary to the core brand colors.

#### **2.2. Typography**

The typefaces establish the brand voice. The primary typeface is derived from the logo's logotype.

| Role | Token Name | Font Family | Weight/Style | Usage Context |
| :---- | :---- | :---- | :---- | :---- |
| **Primary (Headings & Logotype)** | `$font-family-header` | **Bebas Neue** (or geometric sans-serif equivalent) | Bold | Used for H1, H2, display text, and brand lockups. Reflects the condensed, bold, modern personality of "MineShare". |
| **Secondary (Body)** | `$font-family-body` | **Inter** | Regular (400), Medium (500), SemiBold (600) | Used for paragraph text, labels, UI elements. Prioritizes legibility and web performance. |

**Type Scale (Modular – Major Third, ratio 1.25):**  
| Level | Size (rem) | Line Height | Example Use | |-------|------------|-------------|-------------| | H1    | 3.815      | 1.2         | Hero titles | | H2    | 3.052      | 1.25        | Section headers | | H3    | 2.441      | 1.3         | Card titles | | H4    | 1.953      | 1.35        | Subheaders | | Body  | 1.0        | 1.5         | Paragraphs | | Small | 0.8        | 1.4         | Captions, footnotes |

#### **2.3. Spacing**

Spacing tokens ensure a consistent rhythm and hierarchy, aligned to an **8-point grid system**.

| Token Name | Value (px) | rem Equivalent | Usage Context |
| :---- | :---- | :---- | :---- |
| `$spacing-3xs` | 2px | 0.125rem | Micro-gaps (e.g., icon-text in tight buttons) |
| `$spacing-2xs` | 4px | 0.25rem | Smallest gaps (e.g., badge padding) |
| `$spacing-xs` | 8px | 0.5rem | Standard internal padding for small components |
| `$spacing-sm` | 12px | 0.75rem | Compact button padding, form field gaps |
| `$spacing-md` | 16px | 1rem | Default component padding, card gutters |
| `$spacing-lg` | 24px | 1.5rem | Section padding, modal spacing |
| `$spacing-xl` | 32px | 2rem | Large container margins, hero spacing |
| `$spacing-2xl` | 48px | 3rem | Major section breaks |
| `$spacing-3xl` | 64px | 4rem | Page-level vertical rhythm |

---

### **3\. Component Architecture**

All UI components will be built using the tokens defined above, ensuring a cohesive look that aligns with the logo's **bold, modern, fintech-crypto aesthetic**.

| Component | Key Design Characteristics (Inferred from Logo) |
| :---- | :---- |
| **Buttons** | **Shape:** Pill-shaped (full radius on small buttons) or **soft-rounded corners (8px radius)** reflecting the coin’s circular form. **Color:** Primary CTA uses `$color-brand-primary` with white text; secondary uses `$color-brand-secondary` with dark text. Hover lift: subtle scale (1.05) \+ brightness. |
| **Inputs/Forms** | **Border:** `1.5px solid $color-brand-primary` (inactive), `2px solid $color-brand-secondary` (focus). **Corner radius:** 8px. **Focus State:** Glow ring in `$color-brand-secondary`. Placeholder in muted gray (`#9CA3AF`). |
| **Cards** | **Background:** White or subtle `$color-brand-primary` tint. **Border radius:** 12px. **Shadow:** Soft elevation (`0 4px 12px rgba(94, 23, 235, 0.12)`). Optional top accent bar in `$color-brand-secondary`. |
| **Iconography** | **Style:** **Bold filled \+ line duotone**. Primary icons use `$color-brand-secondary` fill with `$color-brand-primary` outline. Match the **geometric boldness** and **smooth curves** of the fox \+ coin symbol. |
| **Illustrations** | **Style:** Flat vector with **gradient accents** (e.g., `$color-brand-secondary` → `$color-coin`). Use the **fox motif** as a mascot in onboarding, empty states. |
| **Logo Lockup** | **Clear space:** Minimum `1x` height of the fox symbol on all sides. **Minimum size:** 44px height (touch target). Never distort. Preferred horizontal layout. |

---

### **4\. Logo Usage Guidelines**

| Rule | Specification |
| :---- | :---- |
| **Primary Version** | Full color (fox \+ coin \+ "MineShare" text) on white or light backgrounds. |
| **Monochrome** | Use `$color-brand-primary` fill for dark backgrounds. |
| **Inverted** | White symbol \+ text on `$color-brand-primary` background. |
| **Do Not** | Stretch, rotate, add effects, or recolor core elements. |

---

### **5\. Next Steps**

1. **Generate full token export** (JSON/CSS variables) from this document.  
2. **Create Figma style library** with updated colors, typography, and component variants.  
3. **Build component library** (React/Vue) using tokens.  
4. **Accessibility audit**: Ensure AA contrast compliance (especially `$color-brand-secondary` on white).

---

**Prepared for:** MineShare (@MunubiEmmanuel)  
**Country:** Kenya (KE)  
**Time:** November 10, 2025 02:42 PM EAT  
