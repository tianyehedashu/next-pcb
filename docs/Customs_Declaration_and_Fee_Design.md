# Customs Declaration and Fee Design for PCB Overseas E-commerce

## 1. Industry Practice Overview

- **Customs declaration information** is required for international shipments, especially for B2B and B2C PCB orders.
- Mainstream PCB manufacturers (e.g., JLCPCB, PCBWay, ALLPCB) collect recipient company name, tax ID, personal ID, declaration method, purpose, declared value, and remarks.
- Customs fees may include duty, VAT/GST, agent (broker) fee, and other surcharges. Whether these are included in the courier fee depends on the selected incoterm (e.g., DDP, DAP).
- For DDP (Delivered Duty Paid), all customs fees are typically included in the courier fee. For DAP/DDU, taxes are paid by the recipient upon delivery.

## 2. Field Design

| Field                | Description                                  | Required Condition         |
|----------------------|----------------------------------------------|---------------------------|
| companyName          | Company name (optional)                      | Optional                  |
| taxId                | Tax ID / VAT ID / EORI                       | Required for some countries|
| personalId           | Personal ID / Passport No.                   | Required for some countries|
| declarationMethod    | Declaration method (self/agent/DDP/DAP)      | Required                  |
| purpose              | Purpose (personal/commercial/sample/gift)    | Required                  |
| declaredValue        | Declared value (USD)                         | Required                  |
| customsNote          | Customs note (optional)                      | Optional                  |

- **Dynamic required fields**: For countries like Brazil, Russia, Korea, etc., tax ID and/or personal ID are mandatory.
- **Declaration method**: If 'Agent declare' or 'DDP' is selected, show a tip: "The courier will assist with customs declaration. Please ensure all information is accurate and complete."

## 3. Fee Calculation Logic

- **Parameters**: country, declaration method, courier, declared value, PCB type (optional)
- **Fee components**:
  - Duty: declaredValue × dutyRate (country-specific)
  - VAT: declaredValue × vatRate (country-specific)
  - Agent Fee: fixed or by courier, only for agent/DDP
  - Total: sum of above, depending on inclusion in courier fee
- **Example formula** (see `lib/customs-fee.ts`):

```ts
export function calculateCustomsFee({
  country,
  declarationMethod,
  courier,
  declaredValue,
  pcbType,
}: CustomsFeeParams): CustomsFeeResult {
  let dutyRate = 0.1; // default 10%
  let vatRate = 0.2;  // default 20%
  let agentFee = 20;  // default agent fee
  let includedInCourier = false;

  if (country === 'US') { dutyRate = 0.05; vatRate = 0; }
  if (country === 'DE') { dutyRate = 0.08; vatRate = 0.19; }
  // ...extend as needed

  if (declarationMethod === 'ddp' || declarationMethod === 'agent') {
    includedInCourier = true;
  }

  const duty = declaredValue * dutyRate;
  const vat = declaredValue * vatRate;
  const total = duty + vat + (includedInCourier ? agentFee : 0);

  return {
    duty,
    vat,
    agentFee: includedInCourier ? agentFee : 0,
    total,
    includedInCourier,
    explain: includedInCourier
      ? 'All customs fees are included in the courier fee.'
      : 'Duties and taxes will be collected by customs or courier upon delivery.',
  };
}
```

## 4. Frontend Integration

- When country, declaration method, courier, or declared value changes, call `calculateCustomsFee` and display the result.
- Show a breakdown: Duty, VAT, Agent Fee, Total, and an explanation.
- For DDP/Agent declare, show a blue tip: "The courier will assist with customs declaration. Please ensure all information is accurate and complete."
- For DAP/self-declare, show a tip: "Duties and taxes will be collected by customs or courier upon delivery."

## 5. Future Extension

- The calculation function can be replaced with an API call to a backend or third-party customs service.
- Fee rates, agent fees, and logic can be maintained in a database or config file for easy update.
- Support for more countries, couriers, and product types can be added as needed.

## 6. Best Practices for Small PCB Factories

- Keep the form simple, only require essential information.
- Use dynamic required fields based on country and declaration method.
- Provide clear tips and explanations to users.
- Make the fee calculation logic modular and easy to extend.
- Always inform users that actual customs fees may vary and are subject to local regulations and courier policies. 