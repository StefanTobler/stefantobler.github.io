# Design QA

## Target

- Reference: `/Users/stefan/.codex/generated_images/019fda5c-9aec-79d3-a4a6-dad343075ede/exec-abf4f944-8200-4b69-ac03-496e7db322bf.png`
- Desktop verification viewport: 1280 x 720 CSS pixels
- Reference pixels: 1536 x 1024
- Implementation capture: `/private/tmp/personal-site-implementation-desktop.jpg`
- Combined comparison: `/private/tmp/personal-site-comparison.jpg`
- State: initial full-page view at the top of the document

## Comparison history

1. The first comparison exposed a center grid that started too far right, excessive vertical overflow, and project numbers that wrapped away from their headings.
2. The second comparison corrected the grid and numbering, then exposed a missing content inset and compressed work and focus sections.
3. The final combined comparison aligned the desktop column boundaries, content inset, section rules, typography hierarchy, project rows, header, and footer with the reference.
4. The annotation revision intentionally lengthens the page with a four-row professional timeline, replaces Focus with Privacy, and updates the requested project and contact copy. These changes preserve the reference system and hierarchy. No P0, P1, or P2 visual differences remain.

## Responsive and interaction checks

- Verified at 390 x 844 CSS pixels with no horizontal overflow: `scrollWidth` and `innerWidth` both measured 390 pixels.
- Verified every timeline row remains inside the 342-pixel mobile content width.
- Inspected the desktop implementation capture and the responsive rendered DOM. Header links, metadata, timeline, project rows, link list, and footer remain legible and correctly stacked.
- Tested the Work in-page navigation. It updated the URL to `#work` and scrolled to the section.
- Verified all LinkedIn, GitHub, email, project, and archive link destinations in the rendered DOM.
- Browser diagnostics contained no warnings or errors.
- Reduced-motion behavior disables smooth scrolling.

## Content and asset checks

- Confirmed the rendered headline is `Ambiguity -> Shipped`, status is `thinking...`, section label is `Privacy`, and project title is `Wiki Wander`.
- Confirmed both contact links use `hello@stefantobler.com`.
- Confirmed the work timeline contains four LinkedIn-grounded professional entries.
- Confirmed the manifest's 192px and 512px icon paths resolve inside the production build.

## Build check

- `npm run build`

## Final result

passed
