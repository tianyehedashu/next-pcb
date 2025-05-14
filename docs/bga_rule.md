# BGA Field Rule

This document details the business and form logic for the `bga` (Ball Grid Array) field in the PCB quote form, including options, default value, visibility, disabling logic, dependencies, and pricing rule.

---

## 1. Field Definition
- **Field:** `bga`
- **Label:** BGA ≤0.25mm
- **Type:** boolean (true/false)

## 2. Options
- `[true, false]`

## 3. Default Value
- `false`

## 4. Visibility (shouldShow)
- Always visible (unless business requires hiding for certain board types)

## 5. Disabled State (shouldDisable)
- Always enabled (unless business requires disabling for certain board types)

## 6. Dependencies
- None (can be extended if BGA is only relevant for certain board types or layer counts)

## 7. Pricing Rule
- If `bga === true` (i.e., the board contains BGA with pitch ≤0.25mm), add a surcharge of **+50 CNY** to the order.
- This is handled by the `bgaHandler` in the pricing logic.
- Example output:
  ```js
  {
    extra: 50,
    detail: { bga: 50 },
    notes: ["BGA (≤0.25mm pitch): +50 CNY"]
  }
  ```

## 8. Typical Usage
- User checks the BGA option if their design contains BGA with pitch ≤0.25mm.
- The system automatically applies the surcharge and displays the reason in the quotation breakdown.

---

This rule ensures that all business logic for BGA is clear, maintainable, and consistent across the application. 