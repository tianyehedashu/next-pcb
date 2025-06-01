import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import CustomNumberSelect from '@/app/components/custom-ui/CustomNumberSelect';
import type { PcbQuoteForm } from '@/types/pcbQuoteForm';
import { Dispatch, SetStateAction } from 'react';

interface QuantityInputProps {
  isSingle: boolean;
  form: PcbQuoteForm & { gerber?: File };
  setForm: Dispatch<SetStateAction<PcbQuoteForm & { gerber?: File }>>; // Corrected type for setForm
  countLabel: string;
  countUnit: string;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  isSingle,
  form,
  setForm,
  countLabel,
  countUnit,
}) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Tooltip content={<div className="max-w-xs text-left">Total quantity of boards or panels you need.</div>}>
        <label className="w-32 text-sm font-medium font-sans text-right cursor-help">{countLabel}</label>
      </Tooltip>
      <CustomNumberSelect
        value={isSingle ? form.singleCount ?? 0 : form.panelSet ?? 0}
        onChange={(v: number) => {
          if (isSingle) {
            setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, singleCount: v }));
          } else {
            setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, panelSet: v }));
          }
        }}
        options={[5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 6500, 7000, 8000, 9000]}
        unit={countUnit}
        placeholder="Select"
      />
      <span className="ml-2 text-xs text-muted-foreground">{countUnit}</span>
    </div>
  );
};

export default QuantityInput; 