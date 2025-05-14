# Trace Width/Spacing & Drill/Thickness Field Rules

This document details the dynamic rules for the PCB quote form fields:
- `minTrace` (Minimum Trace/Space)
- `minHole` (Minimum Drill Size)

These rules cover options, default values, disabling logic, and dependencies for robust frontend and backend validation.

---

## 1. minTrace (Minimum Trace/Space)

### Options (Dynamic)
- **1/2 Layer Boards:**
  - ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10']
- **4 Layer Boards:**
  - ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10']
- **6+ Layer Boards:**
  - ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10']

### Default Value
- If layers >= 4: '4/4'
- Otherwise: '6/6'

### Disabled Options
- **1/2 Layer Boards:** '3.5/3.5', '3/3', '2/2' are disabled
- **4 Layer Boards:** '3/3', '2/2' are disabled
- **6/8/10+ Layer Boards:** '3/3', '2/2' are disabled

### Dependencies
- Depends on: `layers`

---

## 2. minHole (Minimum Drill Size)

### Options (Dynamic)
- **1 Layer:** ['0.3']
- **2 Layers:**
  - If thickness >= 1.6mm: ['0.3', '0.25', '0.2']
  - If thickness < 1.6mm: ['0.3', '0.25', '0.2', '0.15']
- **4+ Layers:** ['0.3', '0.25', '0.2', '0.15']

### Default Value
- 1 Layer: '0.3'
- 2 Layers & thickness < 1.6mm: '0.15'
- 2 Layers & thickness >= 1.6mm: '0.2'
- 4+ Layers: '0.15'

### Disabled Options
- 1 Layer: all except '0.3' are disabled
- 2 Layers & thickness >= 1.6mm: '0.15' and <0.2 are disabled
- 2 Layers & thickness < 1.6mm: <0.15 are disabled
- 4 Layers: <0.15 are disabled
- 6/8/10+ Layers: <0.15 are disabled

### Dependencies
- Depends on: `layers`, `thickness`

---

## 3. Typical Interaction Scenarios
- Changing `layers` or `thickness` will update the available options, default value, and disabled state for `minTrace` and `minHole`.
- Disabled options should be grayed out and unselectable in the UI; backend should also reject invalid combinations.

---

## 4. Example Rule Implementation (TypeScript)
```ts
minTrace: {
  label: 'Min Trace/Space',
  options: (form) => { ... },
  default: (form) => { ... },
  required: true,
  dependencies: ['layers'],
  shouldDisable: (form) => { ... }
},
minHole: {
  label: 'Min Hole',
  options: (form) => { ... },
  default: (form) => { ... },
  required: true,
  dependencies: ['layers', 'thickness'],
  shouldDisable: (form) => { ... }
}
```

---

This document ensures that all business logic for trace width/spacing and drill/thickness fields is clear, maintainable, and consistent across the application. 