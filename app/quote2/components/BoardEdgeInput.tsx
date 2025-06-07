import React from 'react';
import { BorderType, BorderCutType, BreakAwayRail } from '@/types/form';
import { QuoteFormCustomComponents } from "@/app/quote2/components/QuoteFormCustomComponents";
import { Label } from "@/components/ui/label";

interface BoardEdgeInputProps {
  value?: {
    breakAwayRail?: BreakAwayRail;
    border?: BorderType;
    borderCutType?: BorderCutType;
  };
  onChange?: (value: {
    breakAwayRail?: BreakAwayRail;
    border?: BorderType;
    borderCutType?: BorderCutType;
  }) => void;
  shipmentType?: string;
}

export const BoardEdgeInput: React.FC<BoardEdgeInputProps> = ({
  value = {},
  onChange,
  shipmentType,
}) => {
  // 只在 panel_by_speedx 时显示
  if (shipmentType !== 'panel_by_speedx') {
    return null;
  }

  const handleBreakAwayRailChange = (newValue: string | number) => {
    onChange?.({
      ...value,
      breakAwayRail: String(newValue) as BreakAwayRail,
    });
  };

  const handleBorderChange = (newValue: string | number) => {
    onChange?.({
      ...value,
      border: String(newValue) as BorderType,
    });
  };

  const handleBorderCutTypeChange = (newValue: string | number) => {
    onChange?.({
      ...value,
      borderCutType: String(newValue) as BorderCutType,
    });
  };

  const showBorderOptions = value?.breakAwayRail !== BreakAwayRail.None;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Break-away Rail</Label>
        <QuoteFormCustomComponents.TabSelect
          value={value?.breakAwayRail}
          onChange={handleBreakAwayRailChange}
          options={[
            { label: 'None', value: BreakAwayRail.None },
            { label: 'Left & Right', value: BreakAwayRail.LeftRight },
            { label: 'Top & Bottom', value: BreakAwayRail.TopBottom },
            { label: 'All Sides', value: BreakAwayRail.All },
          ]}
        />
      </div>

      {showBorderOptions && (
        <>
          <div className="space-y-2">
            <Label>Board Edge</Label>
            <QuoteFormCustomComponents.TabSelect
              value={value?.border}
              onChange={handleBorderChange}
              options={[
                { label: '5mm', value: BorderType.Five },
                { label: '10mm', value: BorderType.Ten },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label>Cutting Method</Label>
            <QuoteFormCustomComponents.TabSelect
              value={value?.borderCutType}
              onChange={handleBorderCutTypeChange}
              options={[
                { label: 'V-Cut', value: BorderCutType.VCut },
                { label: 'Postage Holes', value: BorderCutType.Tab },
                { label: 'Routing', value: BorderCutType.Routing },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}; 