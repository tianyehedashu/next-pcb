# Public Directory Path Migration

This document records the migration of file references after reorganizing the public directory structure.

## Summary of Changes

### Updated File References

#### 1. Layout Files
- **app/layout.tsx**
  - `logo: 'https://speedxpcb.com/logo.png'` → `logo: 'https://speedxpcb.com/logos/pcb-logo.svg'`

#### 2. Page Components
- **app/page.tsx**
  - `/pcb-hero.svg` → `/logos/pcb-hero.svg`
  - `/fast.svg` → `/icons/fast.svg`
  - `/quality.svg` → `/icons/quality.svg`
  - `/support.svg` → `/icons/support.svg`
  - `/global.svg` → `/icons/global.svg`
  - `/avatar1.jpg` → `/avatars/avatar1.jpg`
  - `/avatar2.jpg` → `/avatars/avatar2.jpg`
  - `/avatar3.jpg` → `/avatars/avatar3.jpg`

- **app/about/page.tsx**
  - `/pcb-hero.svg` → `/logos/pcb-hero.svg`

- **app/auth/page.tsx**
  - `/pcb-bg.png` → `/backgrounds/pcb-bg.png`

- **app/auth/update-password/page.tsx**
  - `/pcb-bg.png` → `/backgrounds/pcb-bg.png`

- **app/testimonials/page.tsx**
  - `/avatar1.jpg` → `/avatars/avatar1.jpg`
  - `/avatar2.jpg` → `/avatars/avatar2.jpg`
  - `/avatar3.jpg` → `/avatars/avatar3.jpg`

#### 3. Components
- **components/ui/Navbar.tsx**
  - `/pcb-logo.svg` → `/logos/pcb-logo.svg`

- **app/components/custom-ui/carousel.tsx**
  - `/pcb-bg.png` → `/backgrounds/pcb-bg.png`
  - `/pcb-hero.png` → `/logos/pcb-hero.svg` (also fixed file extension)

## New Directory Structure Mapping

| Old Path | New Path | Category |
|----------|----------|----------|
| `/fast.svg` | `/icons/fast.svg` | Icon |
| `/quality.svg` | `/icons/quality.svg` | Icon |
| `/support.svg` | `/icons/support.svg` | Icon |
| `/global.svg` | `/icons/global.svg` | Icon |
| `/globe.svg` | `/icons/globe.svg` | Icon |
| `/window.svg` | `/icons/window.svg` | Icon |
| `/file.svg` | `/icons/file.svg` | Icon |
| `/vercel.svg` | `/icons/vercel.svg` | Icon |
| `/board-edge-*.svg` | `/icons/board-edge-*.svg` | Icon |
| `/pcb-logo.svg` | `/logos/pcb-logo.svg` | Logo |
| `/pcb-hero.svg` | `/logos/pcb-hero.svg` | Logo |
| `/pcb-bg.png` | `/backgrounds/pcb-bg.png` | Background |
| `/avatar1.jpg` | `/avatars/avatar1.jpg` | Avatar |
| `/avatar2.jpg` | `/avatars/avatar2.jpg` | Avatar |
| `/avatar3.jpg` | `/avatars/avatar3.jpg` | Avatar |
| `/chatwoot-sdk.js` | `/assets/chatwoot-sdk.js` | Asset |
| `/worker-bundle.js` | `/assets/worker-bundle.js` | Asset |
| `/libarchive.wasm` | `/assets/libarchive.wasm` | Asset |

## Files Updated

1. `app/layout.tsx`
2. `app/page.tsx`
3. `app/about/page.tsx`
4. `app/auth/page.tsx`
5. `app/auth/update-password/page.tsx`
6. `app/testimonials/page.tsx`
7. `components/ui/Navbar.tsx`
8. `app/components/custom-ui/carousel.tsx`

## Benefits of New Structure

- **Better Organization**: Files are categorized by type and usage
- **Easier Maintenance**: Clear directory structure makes it easier to find and manage files
- **Scalability**: New files can be easily categorized into appropriate directories
- **Development Experience**: Developers can quickly locate needed assets

## Migration Status

✅ **Complete** - All file references have been updated to use the new directory structure.

## Next Steps

1. Test the application to ensure all images and assets load correctly
2. Update any documentation that references the old file paths
3. Consider adding TypeScript path mappings if needed for easier imports
4. Update any build scripts or deployment configurations that might reference old paths

## Notes

- The `favicon.ico` file remains in the root of the public directory as required by web standards
- All SVG icons have been consolidated in the `/icons/` directory
- Background images are now in `/backgrounds/` for better organization
- Logo files are clearly separated in `/logos/` directory
- Avatar placeholder images are organized in `/avatars/` directory
- JavaScript and WebAssembly assets are contained in `/assets/` directory 