# 📁 Styles - Fundación Entrelineas

This directory contains all global styles and variables for the project.

## 📂 File Structure

```
src/styles/
├── README.md              # This file
├── _variables.scss        # SCSS variables (partial file)
├── global.scss           # Main global styles
└── components/           # Component-specific styles (future)
```

## 🎯 Main Files

### `_variables.scss`
**Partial file** containing all SCSS variables for the project:
- **Colors**: Primary, secondary, and accent color palette
- **Spacing**: Margin, padding, and gap values
- **Typography**: Fonts, sizes, and weights
- **Shadows**: Predefined shadow effects
- **Borders**: Border radius and colors

**Convention**: The underscore `_` indicates it's a partial file that doesn't compile independently.

### `global.scss`
**Main file** containing:
- Variables import (`_variables.scss`)
- Basic CSS reset
- Global styles for HTML elements
- Global font-family configuration
- Base styles for the entire application

## ⚙️ Configuration

### Astro Config
Styles are automatically imported in all SCSS components through `astro.config.mjs`:

```javascript
css: {
  preprocessorOptions: {
    scss: {
      additionalData: `@import 'src/styles/global.scss';`,
    },
  },
}
```

### Scoped Style Strategy
Uses `scopedStyleStrategy: 'where'` for:
- Lower specificity in component styles
- Better compatibility with global styles
- Greater flexibility for overriding styles

## 🎨 Available Variables

### Colors
```scss
$color-primary: #fbd100;      // Primary yellow
$color-secondary: #050308;    // Secondary black
$color-accent: #151515;       // Dark gray accent
$color-text: #333333;         // Primary text
$color-text-light: #ffffff;   // Light text
$color-bg: #ffffff;           // Primary background
$color-bg-light: #fafafa;     // Light background
$color-bg-dark: #111111;      // Dark background
```

### Spacing
```scss
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px
```

### Typography
```scss
$font-family: 'Inter', system-ui, sans-serif;
$font-size-sm: 0.875rem;    // 14px
$font-size-base: 1rem;      // 16px
$font-size-lg: 1.125rem;    // 18px
$font-size-xl: 1.25rem;     // 20px
$font-size-2xl: 1.5rem;     // 24px
```

## 🚀 Usage in Components

### In `.astro` files
```astro
<style lang="scss">
  .my-component {
    background-color: $color-primary;
    padding: $spacing-lg;
    font-family: $font-family;
  }
</style>
```

### In `.scss` files
```scss
.my-component {
  background-color: $color-primary;
  padding: $spacing-lg;
  font-family: $font-family;
}
```

## 📋 Conventions

### Partial Files (`_`)
- Use `_` for files containing only variables, mixins, or functions
- Don't compile independently
- Are imported in main files

### Naming
- **Variables**: `$variable-name` (kebab-case)
- **Files**: `kebab-case.scss`
- **Classes**: `.kebab-case` (BEM methodology)

### Organization
- Global variables in `_variables.scss`
- Global styles in `global.scss`
- Component styles in their respective `.astro` files

## 🔧 Maintenance

### Adding new variables
1. Edit `_variables.scss`
2. Add the variable with descriptive comment
3. Use in components as needed

### Modifying global styles
1. Edit `global.scss`
2. Changes will automatically apply to the entire application
3. Test in different components to verify consistency

## 📚 Resources

- [Sass Documentation](https://sass-lang.com/documentation)
- [Sass Guidelines](https://sass-guidelin.es/)
- [Astro Documentation](https://docs.astro.build/en/guides/styling/)
- [BEM Methodology](https://getbem.com/)

---

**Note**: This README is updated as the project's style structure evolves.
