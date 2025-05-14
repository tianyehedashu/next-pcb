# Price Handlers: Trace and Drill/Thickness

This document explains the business logic, rules, and scenarios for the following PCB price handlers:
- `traceHandler`: Handles trace width/spacing surcharges
- `drillAndThicknessHandler`: Handles drill and board thickness surcharges
- `syMaterialHandler`: Handles surcharges for Shengyi (Shengyi brand) PCB material

---

## 1. traceHandler

### Purpose
Calculates surcharges based on the trace width/spacing (minTrace) and layer count (layers) of a PCB order.

### Rules
- **1/2 Layer Boards:**
  - `4/4mil`: Sample +60 CNY, Batch +60 CNY/㎡
  - `<4/4mil` (e.g. `3.5/3.5`, `3/3`, `2/2`): Not supported, add note
- **4 Layer Boards:**
  - `3.5/3.5mil`: Sample +60 CNY, Batch +60 CNY/㎡
  - `<3.5/3.5mil` (e.g. `3/3`, `2/2`): Not supported, add note
- **6/8/10+ Layer Boards:**
  - `3.5/3.5mil` and above: No surcharge, add note
  - `<3.5/3.5mil`: Not supported, add note
- **Other specs:** No surcharge

### Usage Scenarios
- When a user selects a special trace width/spacing, the handler automatically determines if a surcharge applies or if the spec is unsupported.
- Useful for detailed quotation breakdowns and future maintenance.

### Example Output
```
{
  extra: 60,
  detail: { minTrace: 60 },
  notes: ["Trace/space 4/4mil, sample +60 CNY"]
}
```

---

## 2. drillAndThicknessHandler

### Purpose
Calculates surcharges based on the combination of board thickness (thickness), minimum drill size (minHole), and layer count (layers).

### Rules
- **thickness >= 1.6mm:**
  - 1 layer: minHole < 0.3mm not supported
  - 2 layers:
    - 0.2mm: Sample +50 CNY, Batch +50 CNY/㎡
    - <0.2mm: Not supported
- **thickness < 1.6mm:**
  - 1 layer: minHole < 0.3mm not supported
  - 2 layers:
    - 0.15mm: Sample +150 CNY, Batch +130 CNY/㎡
    - <0.15mm: Not supported
  - 4 layers:
    - 0.15mm: Sample +60 CNY, Batch +60 CNY/㎡
  - 6/8/10+ layers:
    - 0.15mm: Sample +50 CNY, Batch +50 CNY/㎡
- **Other specs:** No surcharge

### Usage Scenarios
- When a user selects a special drill size or board thickness, the handler automatically determines if a surcharge applies or if the spec is unsupported.
- Useful for detailed quotation breakdowns and future maintenance.

### Example Output
```
{
  extra: 130,
  detail: { minHole: 130 },
  notes: ["Min hole 0.15mm, batch +130 CNY/㎡ × 1.00 = 130.00 CNY"]
}
```

---

## 3. syMaterialHandler (Shengyi Material, TG-dependent)

### Purpose
Calculates surcharges for Shengyi (Shengyi brand) PCB material, with the price depending on the selected TG value.

### Rules
- Only applies if `useShengyiMaterial` is true.
- **TG130:**
  - Sample (area < 1㎡): +80 CNY/lot
  - Batch (area ≥ 1㎡): +80 CNY/㎡
- **TG150:**
  - Sample: +120 CNY/lot
  - Batch: +120 CNY/㎡
- **TG170:**
  - Sample: +150 CNY/lot
  - Batch: +150 CNY/㎡
- The TG type and pricing method are reflected in the detail and notes.

### Usage Scenarios
- When the user specifies Shengyi brand material, and selects a TG value, the surcharge is automatically calculated according to the rules above.
- Useful for detailed quotation breakdowns and future maintenance.

### Example Output
```
{
  extra: 120,
  detail: { syMaterial: 120 },
  notes: ["Shengyi material (TG150, sample): +120 CNY/lot"]
}
```

---

## Integration
Both handlers return an object with:
- `extra`: The surcharge amount
- `detail`: A breakdown by reason
- `notes`: Human-readable notes for quotation details

Integrate these handlers in the main pricing flow as needed for modular, maintainable business logic. 