// 🎯 Formily 表单辅助函数
// 提供动态选项生成、业务逻辑计算等功能

import { 
  PcbColor, 
  PcbType,
  Silkscreen, 
  SurfaceFinish, 
  MaskCover, 
  EdgeCover, 
  TestMethod,
  QualityAttach
} from "../../../types/form";

// === 类型定义 ===
type ThicknessDeps = [number, string, string]; // [layers, outerCopper, innerCopper]
type MinTraceDeps = [number, string, string]; // [layers, outerCopper, innerCopper]
type MinHoleDeps = [number, number]; // [layers, thickness]
type SilkscreenDeps = [string]; // [solderMask]
type SurfaceFinishDeps = [number, number]; // [layers, thickness]
type MaskCoverDeps = [number]; // [layers]
type EdgeCoverDeps = [number]; // [layers]
type TestMethodDeps = [number, object, number, string, object, number]; // [layers, singleDimensions, singleCount, shipmentType, panelDimensions, panelSet]

// 选项格式类型
type OptionItem = { label: string; value: string | number };
type OptionsResult = { options: OptionItem[] };

// 定义字段值类型 - 根据实际使用场景调整
type FieldValue = string | number | null | undefined;

// 定义 $self 参数的大致结构，您可以根据 Formily 的实际 Field 类型进行调整
interface FormilyField {
  path?: { toString: () => string };
  value?: FieldValue;
  dataSource?: OptionItem[];
  adjusting?: boolean;
  setValue?: (value: FieldValue) => void;
  componentProps?: {
    options?: OptionItem[];
  };
  [key: string]: unknown; // 允许其他属性
}

// === 核心选项生成函数 ===

/**
 * 🎯 获取板厚选项 - 复杂的层数+铜厚联动逻辑
 */
export function getThicknessOptions([layers, outerCopper, innerCopper]: ThicknessDeps): OptionItem[] {
  const all = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.0, 3.2];
  let filtered = all;

      // 层数限制
      if (layers >= 16) {
        filtered = filtered.filter(v => v >= 2);
      } else if (layers === 2) {
        // 2L层板：基础范围包含所有常用厚度，后续通过铜厚限制
        filtered = filtered.filter(v => v >= 0.6);
      } else if (layers === 4) {
        filtered = filtered.filter(v => [0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4].includes(v));
      } else if (layers === 6) {
        filtered = filtered.filter(v => [0.8, 1.0, 1.2, 1.6, 2.0, 2.4].includes(v));
      } else if (layers >= 12) {
        filtered = filtered.filter(v => v >= 1.6);
      } else if (layers >= 10) {
        filtered = filtered.filter(v => v >= 1.2);
      } else if (layers >= 8) {
        filtered = filtered.filter(v => v > 0.8);
      }

      
  // 铜厚限制 - 优化30Z(铜厚=3)的处理
  if (outerCopper === '3' || innerCopper === '3') {
    if (layers === 2) {
      // 2L板铜厚=3时：可制作范围1.0MM及以上
      filtered = filtered.filter(v => v >= 1.0);
    } else if (layers === 4) {
      // 4L板铜厚=3时：可制作范围1.2MM及以上
      filtered = filtered.filter(v => v >= 1.2);
    } else if (layers === 6) {
      // 6L板铜厚=3时：保持1.2MM及以上
      filtered = filtered.filter(v => v >= 1.6);
    } else if (layers >= 8) {
      filtered = filtered.filter(v => v >= 2.0);
    } 
  } else if (outerCopper === '2' || innerCopper === '2') {
    // 铜厚=2时的处理
    if ([2, 4, 6].includes(layers)) {
      filtered = filtered.filter(v => v >= 0.8);
    } else {
      filtered = filtered.filter(v => v >= 1.2);
    }
  } else if (outerCopper === '4' || innerCopper === '4') {
    // 铜厚=4时的处理
    if (layers >= 4) {
      filtered = filtered.filter(v => v >= 1.6);
    }
  }

  // 🔧 确保至少有一个选项
  if (filtered.length === 0) {
    console.warn('getThicknessOptions: All options filtered out, using fallback', { layers, outerCopper, innerCopper });
    // 根据层数提供安全的默认值
    if (layers === 2) {
      filtered = [1.0]; // 2L板默认1.0mm
    } else if (layers === 4) {
      filtered = [1.2]; // 4L板默认1.2mm
    } else {
      filtered = [1.6]; // 其他层数默认1.6mm
    }
  }

  return filtered.map(value => ({ label: `${value}mm`, value }));
}

/**
 * 🎯 Formily 专用的板厚选项函数 - 返回 componentProps 格式
 */
export function getThicknessOptionsForFormily([layers, outerCopper, innerCopper]: ThicknessDeps): OptionsResult {
  const options = getThicknessOptions([layers, outerCopper, innerCopper]);
  return { options };
}

/**
 * 🎯 获取最小线宽选项 - 层数+铜厚联动
 */
export function getMinTraceOptions([layers, outerCopper, innerCopper]: MinTraceDeps): OptionsResult {
  let options: string[] = [];
  const allOptions = ['3.5/3.5', '4/4', '5/5', '6/6', '8/8', '10/10'];
  
  // 基础层数逻辑
  if (layers === 1 || layers === 2) {
    options = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
  } else if (layers === 4) {
    options = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
  } else if (layers >= 6) {
    options = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
  } else {
    options = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
  }

  // 铜厚限制逻辑
  const copperList = [outerCopper, innerCopper].filter(Boolean).map(String);
  let maxCopper = '1';
  if (copperList.includes('4')) maxCopper = '4';
  else if (copperList.includes('3')) maxCopper = '3';
  else if (copperList.includes('2')) maxCopper = '2';

  let minIndex = 0;
  if (maxCopper === '2') {
    minIndex = allOptions.indexOf('6/6');
  } else if (maxCopper === '3' || maxCopper === '4') {
    minIndex = allOptions.indexOf('10/10');
  }

  // 过滤掉不符合铜厚要求的选项
  const filteredOptions = options.filter(option => {
    const optionIndex = allOptions.indexOf(option);
    return optionIndex >= minIndex;
  });

  return { options: filteredOptions.map(value => ({ label: `${value}mil`, value })) };
}

/**
 * 🎯 获取最小孔径选项 - 层数+厚度联动
 */
export function getMinHoleOptions([layers, thickness]: MinHoleDeps): OptionsResult {
  if (layers === 1) {
    return { options: [{ label: '0.3mm', value: '0.3' }] };
  } else if (layers === 2) {
    if (thickness >= 1.6) {
      return {
        options: [
          { label: '0.2mm', value: '0.2' },
          { label: '0.25mm', value: '0.25' },
          { label: '0.3mm', value: '0.3' }
        ]
      };
    } else {
      return {
        options: [
          { label: '0.15mm', value: '0.15' },
          { label: '0.2mm', value: '0.2' },
          { label: '0.25mm', value: '0.25' },
          { label: '0.3mm', value: '0.3' }
        ]
      };
    }
  } else if (layers === 4) {
    return {
      options: [
        { label: '0.15mm', value: '0.15' },
        { label: '0.2mm', value: '0.2' },
        { label: '0.25mm', value: '0.25' },
        { label: '0.3mm', value: '0.3' }
      ]
    };
  } else if (layers >= 6) {
    return {
      options: [
        { label: '0.15mm', value: '0.15' },
        { label: '0.2mm', value: '0.2' },
        { label: '0.25mm', value: '0.25' },
        { label: '0.3mm', value: '0.3' }
      ]
    };
  }
  
  return {
    options: [
      { label: '0.15mm', value: '0.15' },
      { label: '0.2mm', value: '0.2' },
      { label: '0.25mm', value: '0.25' },
      { label: '0.3mm', value: '0.3' }
    ]
  };
}

/**
 * 🎯 获取丝印颜色选项 - 避免与阻焊同色
 */
export function getSilkscreenOptions([solderMask]: SilkscreenDeps): OptionsResult {
  const maskShouldDisableBlack: string[] = [
    PcbColor.Black,
    PcbColor.MattBlack, 
    PcbColor.Blue,
    PcbColor.Red,
  ];
  
  let opts = Object.values(Silkscreen) as string[];
  // 禁止同色
  opts = opts.filter(silk => String(silk) !== solderMask);
  // 指定阻焊色时禁用black字符色
  if (maskShouldDisableBlack.includes(solderMask)) {
    opts = opts.filter(silk => silk !== Silkscreen.Black);
  }

  return { options: opts.map(value => ({ label: value as string, value: value as string })) };
}

/**
 * 🎯 获取表面处理选项 - 薄板强制ENIG
 */
export function getSurfaceFinishOptions([layers, thickness]: SurfaceFinishDeps): OptionsResult {
  if ((layers === 1 || layers === 2) && thickness < 0.6) {
    return { options: [{ label: SurfaceFinish.Enig, value: SurfaceFinish.Enig }] };
  }
  
  return { 
    options: Object.values(SurfaceFinish).map(value => ({ 
      label: value as string, 
      value: value as string 
    }))
  };
}

/**
 * 🎯 获取过孔处理选项 - 层数依赖
 */
export function getMaskCoverOptions([layers]: MaskCoverDeps): OptionsResult {
  if (layers === 1) {
    return {
      options: [
        { label: MaskCover.TentedVias, value: MaskCover.TentedVias },
        { label: MaskCover.OpenedVias, value: MaskCover.OpenedVias },
      ]
    };
  } else if (layers === 2) {
    return {
      options: [
        { label: MaskCover.TentedVias, value: MaskCover.TentedVias },
        { label: MaskCover.OpenedVias, value: MaskCover.OpenedVias },
        { label: MaskCover.SolderMaskPlug, value: MaskCover.SolderMaskPlug },
      ]
    };
  }
  
  return {
    options: [
      { label: MaskCover.TentedVias, value: MaskCover.TentedVias },
      { label: MaskCover.OpenedVias, value: MaskCover.OpenedVias },
      { label: MaskCover.SolderMaskPlug, value: MaskCover.SolderMaskPlug },
      { label: MaskCover.NonConductiveFillCap, value: MaskCover.NonConductiveFillCap },
    ]
  };
}

/**
 * 🎯 获取边缘覆盖选项 - 层数依赖
 */
export function getEdgeCoverOptions([]: EdgeCoverDeps): OptionsResult {
  return {
    options: Object.values(EdgeCover).map(value => ({ 
      label: value as string, 
      value: value as string 
    }))
  };
}

/**
 * 🎯 获取电测方式选项 - 根据层数和面积计算
 * 业务规则：
 * - 单层板（layers=1）：可选 None、FlyingProbe、Fixture
 * - 多层板（layers>1）：
 *   - 面积 > 5㎡：只能选 Fixture
 *   - 面积 ≤ 5㎡：可选 FlyingProbe、Fixture
 */
export function getTestMethodOptions([layers, singleDimensions, singleCount, shipmentType, panelDimensions, panelSet]: TestMethodDeps): OptionsResult {
  // 计算面积（平方米）
  let area = 0;
  
  if (shipmentType === 'single' && singleDimensions && singleCount) {
    const dimensions = singleDimensions as { length?: number; width?: number };
    const { length = 0, width = 0 } = dimensions;
    area = (length * width * singleCount) / 10000; // 转换为平方米（cm² -> m²）
  } else if (shipmentType === 'panel' && panelDimensions && panelSet) {
    const dimensions = panelDimensions as { length?: number; width?: number };
    const { length = 0, width = 0 } = dimensions;
    area = (length * width * panelSet) / 10000; // 转换为平方米（cm² -> m²）
  }

  // 根据层数和面积确定可选项
  if (layers === 1) {
    // 单层板：可选 None、FlyingProbe、Fixture
    return {
      options: [
        { label: TestMethod.None, value: TestMethod.None },
        { label: TestMethod.FlyingProbe, value: TestMethod.FlyingProbe },
        { label: TestMethod.Fixture, value: TestMethod.Fixture },
      ]
    };
  } else {
    // 多层板
    if (area > 5) {
      // 面积 > 5㎡：只能选 Fixture
      return {
        options: [
          { label: TestMethod.Fixture, value: TestMethod.Fixture },
        ]
      };
    } else {
      // 面积 ≤ 5㎡：可选 FlyingProbe、Fixture
      return {
        options: [
          { label: TestMethod.FlyingProbe, value: TestMethod.FlyingProbe },
          { label: TestMethod.Fixture, value: TestMethod.Fixture },
        ]
      };
    }
  }
}

/**
 * 🎯 获取品质附件选项
 */
export function getQualityAttachOptions(): OptionsResult {
  return {
    options: Object.values(QualityAttach).map(value => ({ 
      label: value as string, 
      value: value as string 
    }))
  };
}

/**
 * 🎯 智能调整函数 - 基于当前值和选项进行智能调整（优化版）
 */
export function runSmartAdjustment($self: FormilyField) {
  // 防止重复执行
  if ($self.adjusting) {
    return;
  }
  
  $self.adjusting = true;
  
  try {
    const currentValue = $self.value;
    const currentOptions = $self.componentProps?.options || [];
    
    // 如果选项还没有更新完成，稍等一下再执行
    if (currentOptions.length === 0) {
      $self.adjusting = false;
      setTimeout(() => {
        runSmartAdjustment($self);
      }, 10);
      return;
    }
    
    // 检查当前值是否在可用选项中
    const isCurrentValueValid = currentOptions.some((opt: OptionItem) => 
      (opt.value !== undefined ? opt.value : opt) === currentValue
    );
    
    if (isCurrentValueValid) {
      $self.adjusting = false;
      return;
    }
    
    // 智能选择新值
    let newValue = null;
    const fieldName = $self.path?.toString();
    
    if (fieldName === 'thickness') {
      // 厚度字段：选择最接近的数值
      if (currentValue && !isNaN(parseFloat(currentValue.toString()))) {
        const targetThickness = parseFloat(currentValue.toString());
        const validOptions = currentOptions.map((opt: OptionItem) => parseFloat((opt.value || opt).toString()));
        const closest = validOptions.reduce((prev: number, curr: number) => 
          Math.abs(curr - targetThickness) < Math.abs(prev - targetThickness) ? curr : prev
        );
        newValue = closest.toString();
      } else {
        newValue = currentOptions[0]?.value || currentOptions[0];
      }
    } else if (fieldName && (fieldName.includes('trace') || fieldName.includes('space'))) {
      // 线宽间距字段：尝试部分匹配
      const partialMatch = currentOptions.find((opt: OptionItem) => {
        const optValue = opt.value || opt;
        return currentValue && optValue.toString().includes(currentValue.toString().split('/')[0]);
      });
      newValue = partialMatch ? (partialMatch.value || partialMatch) : (currentOptions[0]?.value || currentOptions[0]);
    } else {
      // 其他字段：选择第一个可用选项
      newValue = currentOptions[0]?.value || currentOptions[0];
    }
    
    // 确保newValue是正确的类型
    const finalValue = (typeof newValue === 'object' && newValue !== null && 'value' in newValue) 
      ? newValue.value 
      : newValue;
    
    if (finalValue !== null && finalValue !== currentValue && $self.setValue) {
      $self.setValue(finalValue);
    }
    
  } catch {
    $self.adjusting = false;
  }
}

/**
 * 🎯 带检查的智能调整函数 - 检查当前值是否在可选项中，不在则自动选择第一个
 */
export function runSmartAdjustmentWithCheck($self: FormilyField) {
  // 防止重复执行
  if ($self.adjusting) {
    return;
  }
  
  $self.adjusting = true;
  
  try {
    const currentValue = $self.value;
    const currentOptions = $self.componentProps?.options || [];
    
    // 如果选项还没有更新完成，稍等一下再执行
    if (currentOptions.length === 0) {
      $self.adjusting = false;
      setTimeout(() => {
        runSmartAdjustmentWithCheck($self);
      }, 10);
      return;
    }
    
    // 检查当前值是否有效
    const isValid = currentValue && currentOptions.some((opt: OptionItem) => 
      (opt.value !== undefined ? opt.value : opt) === currentValue
    );
    
    if (!isValid || !currentValue) {
      const newValue = currentOptions[0]?.value || currentOptions[0];
      // 确保newValue是正确的类型
      const finalValue = (typeof newValue === 'object' && newValue !== null && 'value' in newValue) 
        ? newValue.value 
        : newValue;
      if (finalValue && $self.setValue) {
        $self.setValue(finalValue);
      }
    } else {
      $self.adjusting = false;
    }
    
  } catch {
    $self.adjusting = false;
  }
}

/**
 * 🎯 同步智能调整函数 - 立即执行，不使用异步
 */
export function runSmartAdjustmentSync($self: FormilyField): void {
  if (!$self?.path || typeof $self.value === 'undefined' || $self.adjusting) {
    return;
  }

  try {
    const fieldPath = $self.path.toString();
    const fieldName = fieldPath.split('.').pop();
    const currentValue = $self.value;
    const currentOptions = $self.dataSource || [];
    
    // 如果选项为空则跳过
    if (currentOptions.length === 0) return;

    const availableValues = currentOptions.map((opt: OptionItem) => opt.value);
    const isCurrentValueValid = currentValue != null && availableValues.includes(currentValue);
    
    if (currentValue != null && !isCurrentValueValid && $self.setValue) {
      let newValue: FieldValue;
      
      // thickness 字段特殊处理（数值匹配最接近的）
      if (fieldName === 'thickness' || fieldPath.includes('thickness')) {
        const numericCurrent = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue));
        const numericValues = availableValues.filter((v: string | number) => typeof v === 'number').map(Number);
        
        if (!isNaN(numericCurrent) && numericValues.length > 0) {
          newValue = numericValues.reduce((prev: number, curr: number) => 
            Math.abs(curr - numericCurrent) < Math.abs(prev - numericCurrent) ? curr : prev
          );
        } else {
          newValue = availableValues[0];
        }
      } else if (typeof currentValue === 'string') {
        // 字符串字段尝试部分匹配
        newValue = availableValues.find((val: string | number) => 
          typeof val === 'string' && val.includes(currentValue)
        ) || availableValues[0];
      } else {
        // 其他情况使用第一个选项
        newValue = availableValues[0];
      }
      
      if (newValue !== undefined && newValue !== currentValue) {
        $self.setValue(newValue);
      }
    }
  } catch {
    $self.adjusting = false;
  }
}

// === 自动调整函数 ===

/**
 * 🎯 厚度调整建议
 */
export function adjustThicknessForLayers([currentThickness, layers, outerCopper, innerCopper]: [number, number, string, string]) {
  const availableOptions = getThicknessOptions([layers, outerCopper, innerCopper]);
  const currentValue = currentThickness;
  
  // 检查当前值是否在可用选项中
  const isCurrentValid = availableOptions.some(opt => opt.value === currentValue);
  
  if (!isCurrentValid && availableOptions.length > 0) {
    // 找到最接近的推荐值
    const recommended = availableOptions.reduce((prev, curr) => {
      return Math.abs(Number(curr.value) - currentValue) < Math.abs(Number(prev.value) - currentValue) ? curr : prev;
    });
    
    return {
      shouldAdjust: true,
      recommendedValue: recommended.value,
      message: `Current thickness ${currentThickness}mm is not compatible with ${layers} layers and copper weight configuration. Recommended: ${recommended.label}`,
      availableOptions: availableOptions.map(opt => opt.label).join(', ')
    };
  }
  
  return { shouldAdjust: false };
}

/**
 * 🎯 最小线宽调整建议
 */
export function adjustMinTraceForSpecs([currentTrace, layers, outerCopper, innerCopper]: [string, number, string, string]) {
  const { options: availableOptions } = getMinTraceOptions([layers, outerCopper, innerCopper]);
  
  // 检查当前值是否在可用选项中
  const isCurrentValid = availableOptions.some(opt => opt.value === currentTrace);
  
  if (!isCurrentValid && availableOptions.length > 0) {
    // 推荐第一个（通常是最优的）选项
    const recommended = availableOptions[0];
    
    return {
      shouldAdjust: true,
      recommendedValue: recommended.value,
      message: `Current trace width ${currentTrace}mil is not optimal for ${layers} layers with current copper weight. Recommended: ${recommended.label}`,
      availableOptions: availableOptions.map(opt => opt.label).join(', ')
    };
  }
  
  return { shouldAdjust: false };
}

/**
 * 🎯 最小孔径调整建议
 */
export function adjustMinHoleForSpecs([currentHole, layers, thickness]: [string, number, number]) {
  const { options: availableOptions } = getMinHoleOptions([layers, thickness]);
  
  // 检查当前值是否在可用选项中
  const isCurrentValid = availableOptions.some(opt => opt.value === currentHole);
  
  if (!isCurrentValid && availableOptions.length > 0) {
    // 推荐第一个（通常是最小的）选项
    const recommended = availableOptions[0];
    
    return {
      shouldAdjust: true,
      recommendedValue: recommended.value,
      message: `Current hole size ${currentHole}mm is not optimal for ${layers} layers with ${thickness}mm thickness. Recommended: ${recommended.label}`,
      availableOptions: availableOptions.map(opt => opt.label).join(', ')
    };
  }
  
  return { shouldAdjust: false };
}

/**
 * 🎯 丝印颜色调整建议
 */
export function adjustSilkscreenForMask([currentSilkscreen, solderMask]: [string, string]) {
  const options = getSilkscreenOptions([solderMask]);
  const validValues = options.options.map(opt => opt.value);
  
  if (!validValues.includes(currentSilkscreen)) {
    return validValues[0] || 'white';
  }
  
  return currentSilkscreen;
}

// === 导出所有函数 ===
const formilyHelpers = {
  // 选项生成函数
  getThicknessOptions,
  getThicknessOptionsForFormily,
  getMinTraceOptions,
  getMinHoleOptions,
  getSilkscreenOptions,
  getSurfaceFinishOptions,
  getMaskCoverOptions,
  getEdgeCoverOptions,
  getTestMethodOptions,
  getQualityAttachOptions,
  
  // 智能调整函数
  runSmartAdjustment,
  runSmartAdjustmentWithCheck,
  runSmartAdjustmentSync,
  
  // 自动调整函数
  adjustThicknessForLayers,
  adjustMinTraceForSpecs,
  adjustMinHoleForSpecs,
  adjustSilkscreenForMask,
};

// 导出枚举供 Formily scope 使用
export { PcbType };

export default formilyHelpers;
