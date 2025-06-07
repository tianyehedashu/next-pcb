import { BoardEdgeInput } from './BoardEdgeInput';
import { decorators } from '@formily/react';
import { FormFieldLayout } from './FormFieldLayout';

export const components = {
  // ... existing components ...
  BoardEdgeInput,
};

decorators.FormFieldLayout = FormFieldLayout; 