# CSS Refactoring Plan for Mirascope Website

## Overview

A three-phase approach to refactoring the Mirascope website's CSS: first audit and understand the current state, then implement a theme variable system, then perform a post-implementation cleanup.

## Implementation Strategy

### Phase 1: Initial CSS Audit

1. **Analyze current CSS usage**
   - Run a full audit of styles.css
   - Document common color patterns across light/dark/sunset modes
   - Identify redundancies and opportunities for simplification
   - Create an inventory of color uses by component

2. **Document color system**
   - Map out all colors used across themes
   - Create a draft of semantic color naming

3. **Identify quick improvements**
   - Flag any obvious redundancies or inconsistencies
   - Document components with the most complex theme styling

### Phase 2: Theme Variable Implementation

1. **Create theme CSS variables**
   - Define CSS variables based on audit findings
   - Create theme.css with light/dark/sunset variations
   - Import in main.tsx

2. **Configure Tailwind**
   - Update tailwind.config.js to use CSS variables
   - Create semantic color mappings (text-primary, bg-primary, etc.)

3. **Convert components**
   - Replace direct color references with theme variables
   - Start with the most used components
   - Update style-test.mdx to showcase themed components

### Phase 3: Post-Implementation Cleanup

1. **Review and simplify**
   - Remove any now-redundant CSS
   - Consolidate similar patterns
   - Create more consistent component styling

2. **Verify theme consistency**
   - Test all components in all three themes
   - Fix any visual inconsistencies
   - Check for smooth theme transitions

3. **Optional: Introduce CVA**
   - If beneficial, add class-variance-authority
   - Start with one component as proof of concept
   - Create variants for commonly used patterns

## Example Theme Implementation

```css
/* theme.css */
:root {
  --color-text-primary: theme('colors.gray.900');
  --color-text-secondary: theme('colors.gray.600');
  --color-bg-primary: theme('colors.white');
  /* etc. */
}

.dark {
  --color-text-primary: theme('colors.gray.100');
  --color-text-secondary: theme('colors.gray.400');
  /* etc. */
}

.sunset {
  --color-text-primary: theme('colors.amber.900');
  --color-text-secondary: theme('colors.amber.700');
  /* etc. */
}
```

```js
// tailwind.config.js addition
theme: {
  extend: {
    colors: {
      theme: {
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          /* etc. */
        },
        bg: {
          primary: 'var(--color-bg-primary)',
          /* etc. */
        },
      }
    }
  }
}
```

## Success Criteria

1. No direct color classes in component JSX
2. All components render correctly in all three themes
3. CSS structure is cleaner and more maintainable
4. Style-test page provides a clear showcase of themed components