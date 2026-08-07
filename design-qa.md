# Design QA

## Target

- Reference: `/Users/stefan/.codex/generated_images/019fda5c-9aec-79d3-a4a6-dad343075ede/exec-abf4f944-8200-4b69-ac03-496e7db322bf.png`
- Desktop viewport: 1536 x 1024 CSS pixels
- Reference pixels: 1536 x 1024
- Implementation capture: `/private/tmp/stefan-site-implementation-viewport-5-top.jpg`
- Combined comparison: `/private/tmp/stefan-site-comparison-final.jpg`
- State: initial full-page view at the top of the document

## Comparison history

1. The first comparison exposed a center grid that started too far right, excessive vertical overflow, and project numbers that wrapped away from their headings.
2. The second comparison corrected the grid and numbering, then exposed a missing content inset and compressed work and focus sections.
3. The final combined comparison aligned the desktop column boundaries, content inset, section rules, typography hierarchy, project rows, header, and footer with the reference. No P0, P1, or P2 visual differences remain.

## Responsive and interaction checks

- Verified at 390 x 844 CSS pixels with no horizontal overflow: `scrollWidth` and `innerWidth` both measured 390 pixels.
- Inspected the upper and lower mobile states. Header links, metadata, project rows, link list, and footer remain legible and correctly stacked.
- Tested the Work in-page navigation. It updated the URL to `#work` and scrolled to the section.
- Verified all LinkedIn, GitHub, email, project, and archive link destinations in the rendered DOM.
- Browser diagnostics contained only Vite development connection messages and no warnings or errors.
- Reduced-motion behavior disables smooth scrolling.

## Build check

- `npm run build`

## Final result

passed
