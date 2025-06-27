# Public Directory Structure

This document describes the organized structure of the `/public` directory for the SpeedXPCB website.

## Directory Structure

```
public/
├── assets/              # Static assets and libraries
│   ├── chatwoot-sdk.js  # Chatwoot SDK for customer service
│   ├── libarchive.wasm  # WebAssembly library for file processing
│   └── worker-bundle.js # Web worker bundle
├── avatars/             # User avatar images
│   ├── avatar1.jpg      # Sample avatar 1
│   ├── avatar2.jpg      # Sample avatar 2
│   └── avatar3.jpg      # Sample avatar 3
├── backgrounds/         # Background images
│   └── pcb-bg.png       # PCB-themed background image
├── carousel/            # Carousel/slider images
│   ├── pcb-manufacturing.JPG  # Manufacturing process image
│   ├── quality-control.JPG    # Quality control process
│   ├── smt-assembly.JPG       # SMT assembly process
│   └── test1.jpg             # Additional carousel image
├── chatwoot/           # Chatwoot-specific files
│   └── sdk.js          # Chatwoot SDK
├── home/               # Homepage-specific images
│   ├── IMG_0319.JPG    # Homepage gallery image
│   ├── IMG_0485.JPG    # Homepage gallery image
│   ├── IMG_0486.JPG    # Homepage gallery image
│   ├── IMG_0496.JPG    # Homepage gallery image
│   ├── IMG_0514.JPG    # Homepage gallery image
│   └── IMG_0570.JPG    # Homepage gallery image
├── icons/              # SVG icons and small graphics
│   ├── board-edge-all.svg        # PCB edge connector icon
│   ├── board-edge-left-right.svg # PCB side edge icon
│   ├── board-edge-top-bottom.svg # PCB top/bottom edge icon
│   ├── fast.svg                  # Speed/fast icon
│   ├── file.svg                  # File icon
│   ├── global.svg                # Global/worldwide icon
│   ├── globe.svg                 # Earth/globe icon
│   ├── quality.svg               # Quality assurance icon
│   ├── support.svg               # Customer support icon
│   ├── vercel.svg                # Vercel platform icon
│   └── window.svg                # Window/interface icon
├── logos/              # Company and brand logos
│   ├── pcb-hero.svg    # Hero section PCB logo
│   └── pcb-logo.svg    # Main company logo
└── favicon.ico         # Website favicon
```

## File Usage Guidelines

### Assets (`/assets/`)
- Contains JavaScript libraries, WebAssembly files, and other static resources
- Use for files that are loaded programmatically
- Keep organized by functionality

### Avatars (`/avatars/`)
- User profile images and placeholder avatars
- Optimize for web delivery (JPEG format, compressed)
- Use consistent naming convention

### Backgrounds (`/backgrounds/`)
- Large background images for sections
- Optimize for performance (consider WebP format)
- Use descriptive naming

### Carousel (`/carousel/`)
- Images for homepage carousels and sliders
- High-quality product and process images
- Maintain consistent aspect ratios

### Icons (`/icons/`)
- SVG icons for UI elements
- Keep file sizes small
- Use semantic naming
- Maintain consistent style

### Logos (`/logos/`)
- Brand logos and brand-related graphics
- SVG format preferred for scalability
- Include different variations if needed

## Optimization Notes

- All images should be optimized for web delivery
- Consider using WebP format for better compression
- SVG files should be optimized and cleaned
- Use descriptive filenames
- Maintain consistent naming conventions

## Updates

When adding new files to the public directory:
1. Choose the appropriate subdirectory based on file type and usage
2. Use descriptive, lowercase filenames with hyphens
3. Optimize files for web delivery
4. Update this README if adding new categories 