# PCB International Shipping Cost Calculation

## Overview
This document details the shipping cost calculation system for international PCB orders. The system calculates shipping costs based on weight, dimensions, destination, courier service, and various surcharges.

## Weight Calculation

### Actual Weight
The actual weight calculation considers several PCB components:
1. Base material weight (FR4, Aluminum, etc.)
2. Copper layer weight
3. Solder mask weight
4. Silkscreen weight
5. Additional plating weight

Formula:
```typescript
totalWeight = baseWeight + copperWeight + solderMaskWeight + silkscreenWeight + platingWeight
```

### Volumetric Weight
Calculated using the standard international shipping formula:
```typescript
volumetricWeight = (length × width × height) ÷ 5000
```

### Chargeable Weight
The higher value between actual weight and volumetric weight:
```typescript
chargeableWeight = max(actualWeight, volumetricWeight)
```

## Shipping Zones

### Zone 1 - North America
- Countries: US, Canada
- Base rates:
  - DHL: $45 + $8.5/kg
  - FedEx: $48 + $9.0/kg
  - UPS: $46 + $8.8/kg

### Zone 2 - Europe
- Countries: UK, Germany, France, Italy, Spain, Netherlands, Belgium, Switzerland, Sweden, Norway, Denmark, Finland
- Base rates:
  - DHL: $50 + $9.5/kg
  - FedEx: $52 + $10.0/kg
  - UPS: $51 + $9.8/kg

### Zone 3 - Asia Pacific
- Countries: Australia, Japan, South Korea, Singapore, Malaysia, Thailand, Vietnam, Indonesia, Philippines, New Zealand
- Base rates:
  - DHL: $40 + $7.5/kg
  - FedEx: $42 + $8.0/kg
  - UPS: $41 + $7.8/kg

## Service Types and Multipliers

### Service Levels
1. Express (1-3 days)
   - Multiplier: 1.3
   - Priority handling
   - Fastest delivery time

2. Standard (3-5 days)
   - Multiplier: 1.0
   - Regular handling
   - Standard delivery time

3. Economy (5-7 days)
   - Multiplier: 0.8
   - Lower priority
   - Longer delivery time

## Additional Charges

### Fuel Surcharge
- DHL: 16-18% of base rate
- FedEx: 18-19% of base rate
- UPS: 15.5-18.5% of base rate

### Peak Season Surcharge
- Applied during November-January
- Varies by courier:
  - DHL: 18-22%
  - FedEx: 19-23%
  - UPS: 18.5-22.5%

## Final Cost Calculation
```typescript
finalCost = (baseCost + fuelSurcharge + peakCharge) × serviceMultiplier
```

## Optimization Opportunities

### Current Limitations
1. Fixed zone-based pricing might not be optimal for all routes
2. Limited number of supported countries
3. No consideration for bulk shipping discounts
4. Simplified peak season handling

### Suggested Improvements

#### Short-term Improvements
1. **Dynamic Pricing**
   - Implement real-time rate queries from courier APIs
   - Add support for actual courier-specific surcharges

2. **Bulk Order Discounts**
   - Add volume-based discounts
   - Implement tiered pricing for large orders

3. **Additional Service Options**
   - Add insurance options
   - Include customs clearance services
   - Add signature requirement option

#### Long-term Improvements
1. **Smart Routing**
   - Implement multi-carrier optimization
   - Add route optimization for better rates

2. **Advanced Analytics**
   - Track shipping costs over time
   - Analyze patterns for cost optimization
   - Implement predictive pricing

3. **Integration Improvements**
   - Direct integration with courier systems
   - Real-time tracking integration
   - Automated customs documentation

### Simplification Opportunities
1. **Zone Consolidation**
   - Merge similar pricing zones
   - Simplify country groupings

2. **Pricing Structure**
   - Reduce number of surcharge types
   - Implement simpler flat-rate options for standard sizes
   - Create pre-calculated package categories

3. **Service Levels**
   - Consider reducing to two service levels
   - Standardize multipliers across carriers

## Implementation Notes

### Code Structure
The shipping calculation is implemented in two main components:
1. `shipping-calculator.ts`: Core calculation logic
2. `ShippingTaxEstimationPanel.tsx`: User interface

### Best Practices
1. Keep courier-specific logic separated
2. Maintain clear documentation for rate changes
3. Implement proper error handling
4. Regular updates for rate changes

### Testing
1. Unit tests for weight calculations
2. Integration tests for full cost calculations
3. Edge case testing for unusual dimensions
4. Regular validation against actual courier rates

## Future Considerations
1. Support for additional carriers
2. Integration with real-time pricing APIs
3. Enhanced tracking capabilities
4. Automated customs documentation
5. Mobile-friendly shipping calculator
6. Multi-currency support
7. Regional pricing optimization 