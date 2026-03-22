# Design System Specification: The Monad Builder Protocol

This design system is a high-end, editorial framework designed specifically for the Monad ecosystem. It moves beyond traditional "dashboard" aesthetics to create a digital environment that feels like a premium developer atelier. It balances the high-octane energy of Web3 with the sober authority of a professional identity protocol.

---

### 1. Creative North Star: "The Neon Brutalist"
The design system is guided by the **Neon Brutalist** philosophy. Unlike standard "Soft UI," we embrace raw, structural layouts and high-contrast typography, but we refine them through sophisticated layering and glassmorphism. 

**Key Principles:**
- **Intentional Asymmetry:** Break the 12-column grid. Use oversized headings offset against compact data points to create a rhythmic, editorial flow.
- **Tonal Depth:** We do not use lines to separate ideas. We use "light" and "depth."
- **Technological Soul:** High-precision typography meets vibrant, ethereal gradients to signal both developer-centric utility and innovative speed.

---

### 2. Color & Surface Architecture
We utilize a monochromatic base of deep charcols and blacks, punctuated by Monad’s signature purples and neon cyan highlights.

#### The "No-Line" Rule
**Explicit Instruction:** Do not use `1px` solid borders for sectioning or layout containment. 
Boundary definition must be achieved exclusively through:
1.  **Background Shifts:** Transitioning from `surface` (#131314) to `surface_container_low` (#1c1b1c).
2.  **Negative Space:** Using the spacing scale (e.g., `spacing.16`) to create distinct content zones.

#### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
*   **Base Layer:** `surface` (#131314) - The canvas.
*   **Section Layer:** `surface_container` (#201f20) - For major content groupings.
*   **Interactive/Card Layer:** `surface_container_high` (#2a2a2b) - For clickable or elevated data.
*   **Active/Floating Layer:** `surface_container_highest` (#353436) - For modals and dropdowns.

#### The "Glass & Gradient" Signature
To achieve a "premium" feel, use `surface_variant` (#353436) at 60% opacity with a `20px` backdrop-blur for all floating navigation elements and "Connect Wallet" modals. 
*   **Primary CTA Gradient:** Linear 135° from `primary` (#deb7ff) to `primary_container` (#a332ff).

---

### 3. Typography Scale
We pair the structural precision of **Space Grotesk** for brand moments with the functional clarity of **Inter** for data.

| Token | Font Family | Size | Purpose |
| :--- | :--- | :--- | :--- |
| `display-lg` | Space Grotesk | 3.5rem | Hero "Passport" headers. |
| `headline-md` | Space Grotesk | 1.75rem | Section titles (Asymmetric alignment). |
| `title-md` | Inter | 1.125rem | Card titles and navigational items. |
| `body-md` | Inter | 0.875rem | Primary reading and metadata. |
| `label-sm` | Inter | 0.6875rem | All-caps "Monad" developer tags. |

**The Editorial Lean:** Use `display-lg` with tight letter-spacing (-0.04em) and pair it immediately with `label-sm` for a high-contrast, professional tech look.

---

### 4. Elevation & Depth
In this design system, shadows are light, not dark. They represent "glow" rather than "weight."

*   **The Layering Principle:** Depth is achieved by placing a `surface_container_lowest` (#0e0e0f) card inside a `surface_container` (#201f20) parent. This "inset" look creates a sense of high-precision machining.
*   **Ambient Shadows:** Use shadows only for floating states. Value: `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color should be a tinted version of `on_surface` at 4% opacity to mimic ambient room light.
*   **The Ghost Border:** If a container requires a border for accessibility, use `outline_variant` (#4d4355) at 15% opacity. **Never use 100% opacity.**

---

### 5. Component Guidelines

#### Buttons (Sleek & Tactical)
*   **Primary:** Gradient (Primary to Primary Container). Text: `on_primary` (#4a007f). Radius: `md` (0.375rem).
*   **Secondary:** Ghost style. `surface_container_highest` background with a 20% `outline` border.
*   **Wallet Connect:** Use `surface_bright` (#39393a). When connected, add a `secondary` (#e6feff) neon glow (2px outer blur) to indicate "Live" status.

#### Cards & Passport Modules
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use a background shift of `surface_container_low` for every even-numbered row, or simply use `spacing.4` of vertical whitespace.
*   **The Glass Card:** For "Passport Credentials," use `surface_variant` at 40% opacity with a `12px` blur and a `0.5px` Ghost Border.

#### Chips (Developer Metadata)
*   Use `surface_container_highest` with `label-sm` text. Radius: `full`. These should look like tiny, pill-shaped physical buttons.

#### Input Fields
*   Background: `surface_container_lowest` (#0e0e0f).
*   Border: None. Use a bottom-only `outline_variant` at 30% opacity that expands to 100% `primary` on focus.

---

### 6. Do’s and Don’ts

**Do:**
*   **Do** use asymmetrical margins. If the left margin is `spacing.10`, the right margin can be `spacing.16` to create visual tension.
*   **Do** use `primary` purple for interactive highlights and `secondary` cyan for "Success/Live" states.
*   **Do** leverage `spaceGrotesk` for all numerical data to emphasize the "Web3/Dev" vibe.

**Don’t:**
*   **Don’t** use standard 80% grey text. Use `on_surface_variant` (#d0c1d8) to keep the purple-tinted tonal harmony.
*   **Don’t** use "Drop Shadows" on cards. If it sits on the page, use background color shifts to define it.
*   **Don’t** use sharp corners. Stick strictly to the `md` (0.375rem) and `lg` (0.5rem) roundedness scale to keep the tech vibe "approachable."

---

### 7. Signature Interaction: The "Monad Pulse"
When a user interacts with a "Passport Detail," the container should not just change color. Use a subtle `secondary` (#e6feff) outer glow (blur: 15px, opacity: 0.1) to simulate a machine powering on. This reinforces the "innovative" and "trustworthy" nature of the protocol.