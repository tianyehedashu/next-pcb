import type { GerberAnalysisResult } from '../types/gerber';

// 动态导入 libarchive.js 以支持 RAR 文件
let libarchive: typeof import('libarchive.js/dist/libarchive.js') | null = null;

// 初始化 libarchive
export async function initLibarchive() {
  if (!libarchive) {
    try {
      const lib = await import('libarchive.js/dist/libarchive.js');
      
      // 尝试多个可能的 worker 路径
      const workerPaths = [
        '/worker-bundle.js',
        '/libarchive.js/dist/worker-bundle.js',
        '/node_modules/libarchive.js/dist/worker-bundle.js',
        'https://unpkg.com/libarchive.js@1.3.0/dist/worker-bundle.js'
      ];
      
      let workerUrl = workerPaths[0]; // 默认使用第一个
      
      // 尝试检测哪个路径可用
      for (const path of workerPaths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          if (response.ok) {
            workerUrl = path;
            console.log(`Found worker at: ${workerUrl}`);
            break;
          }
        } catch {
          // 继续尝试下一个路径
        }
      }
      
      console.log(`Initializing libarchive with worker: ${workerUrl}`);
      lib.Archive.init({
        workerUrl: workerUrl
      });
      libarchive = lib;
    } catch (error) {
      console.error('Failed to initialize libarchive:', error);
      throw new Error('RAR support is not available');
    }
  }
  return libarchive;
}

// 模拟文件上传API
export async function uploadFileToServer(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string; analysisResult?: GerberAnalysisResult }> {
  try {
    onProgress(0); // 开始上传，进度设为0

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/quote/gerber-analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    onProgress(100); // 上传完成，进度设为100

    return result;
  } catch (error) {
    console.error('File upload to server failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function detectGerberFileType(filename: string, content: string): string {
  // 内部辅助函数：获取文件扩展名
  const getFileExtension = (fname: string): string => {
    const lastDot = fname.lastIndexOf('.');
    return lastDot !== -1 ? fname.substring(lastDot + 1).toLowerCase() : '';
  };

  // 内部辅助函数：获取不带扩展名的文件名
  const getBaseName = (fname: string): string => {
    const lastDot = fname.lastIndexOf('.');
    return lastDot !== -1 ? fname.substring(0, lastDot) : fname;
  };

  const ext = getFileExtension(filename);
  const baseName = getBaseName(filename).toLowerCase();
  const fullName = filename.toLowerCase();
  
  // 首先检查文件内容特征
  const contentLines = content.split('\n').slice(0, 50); // 只检查前50行
  let hasGerberStart = false;
  let hasDrillStart = false;
  let hasExcellonFormat = false;
  let hasPickAndPlace = false;
  let hasBOM = false;
  
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('G04') || trimmed.startsWith('%TA') || trimmed.startsWith('%TF')) {
      hasGerberStart = true;
    }
    if (trimmed.includes('INCH') || trimmed.includes('METRIC')) {
      if (trimmed.startsWith('M') || trimmed.startsWith('T')) {
        hasDrillStart = true;
      }
    }
    if (trimmed.startsWith('T') && trimmed.includes('C') && /T\d+C[\d.]+/.test(trimmed)) {
      hasExcellonFormat = true;
    }
    // Pick and Place 文件检测
    if (trimmed.includes('RefDes') || trimmed.includes('Footprint') || trimmed.includes('Mid X') || trimmed.includes('Mid Y')) {
      hasPickAndPlace = true;
    }
    // BOM 文件检测
    if (trimmed.includes('Part Number') || trimmed.includes('Description') || trimmed.includes('Quantity') || trimmed.includes('Designator')) {
      hasBOM = true;
    }
  }

  // Pick and Place 文件检测
  if (hasPickAndPlace || ['pnp', 'xy', 'pos', 'pick', 'place', 'placement'].includes(ext) ||
      baseName.includes('pick') || baseName.includes('place') || baseName.includes('assembly') ||
      baseName.includes('position') || baseName.includes('xy') || baseName.includes('centroid')) {
    return 'Pick and Place File';
  }

  // BOM 文件检测
  if (hasBOM || ['bom', 'cpl', 'cmp_list'].includes(ext) ||
      baseName.includes('bom') || baseName.includes('component') || baseName.includes('parts')) {
    return 'Bill of Materials (BOM)';
  }

  // 报告文件检测
  if (['rep', 'rul', 'ldp', 'extrep', 'reports'].includes(ext) ||
      baseName.includes('report') || baseName.includes('rules') || baseName.includes('extract') ||
      fullName.includes('extrep') || fullName.includes('edgerout')) {
    return 'Report/Rules File';
  }

  // Aperture 文件检测
  if (['apr', 'apr_lib'].includes(ext) || 
      baseName.includes('aperture') || baseName.includes('macro')) {
    return 'Aperture/Macro File';
  }

  // 文档文件检测
  if (['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8', 'tx9', 'tx10', 'doc', 'readme', 'notes'].includes(ext) ||
      baseName.includes('note') || baseName.includes('readme') || baseName.includes('doc')) {
    return 'Documentation File';
  }

  // 钻孔文件检测
  if (hasExcellonFormat || hasDrillStart || 
      ['drl', 'drr', 'xln', 'txt', 'nc', 'tap', 'exc', 'drill'].includes(ext) ||
      baseName.includes('drill') || baseName.includes('hole') || baseName.includes('excellon')) {
    return 'Drill File';
  }

  // 路由/铣削文件检测
  if (['route', 'edgerout', 'slots', 'cutout', 'mill', 'rout'].includes(ext) ||
      baseName.includes('route') || baseName.includes('mill') || baseName.includes('slot') ||
      baseName.includes('cutout') || baseName.includes('edge') || fullName.includes('edgerout')) {
    return 'Routing/Milling File';
  }

  // 机械层/外形文件检测
  if (['gko', 'gml', 'gbr', 'outline', 'oln'].includes(ext) || 
      ['gm1', 'gm2', 'gm3', 'gm4', 'gm5', 'gm6', 'gm7', 'gm8', 'gm9', 'gm10',
       'gm11', 'gm12', 'gm13', 'gm14', 'gm15', 'gm16'].includes(ext) ||
      baseName.includes('outline') || baseName.includes('border') ||
      baseName.includes('mechanical') || baseName.includes('keepout') ||
      baseName.includes('fab') || baseName.includes('assembly')) {
    return 'Mechanical/Outline Layer';
  }

  // Gerber文件类型检测
  if (hasGerberStart || ['gbr', 'ger', 'art', 'pho', 'ph'].includes(ext)) {
    
    // 顶层铜箔 (包括 Altium/Eagle/KiCad/PADS 格式)
    if (['gtl', 'cmp', 'top', 'f_cu'].includes(ext) || 
        baseName.includes('top') || baseName.includes('copper') ||
        baseName.includes('f_cu') || baseName.includes('front') ||
        baseName.includes('component') || baseName.includes('cmp')) {
      return 'Top Copper Layer';
    }
    
    // 底层铜箔
    if (['gbl', 'sol', 'bot', 'bottom', 'b_cu'].includes(ext) || 
        baseName.includes('bottom') || baseName.includes('back') ||
        baseName.includes('b_cu') || baseName.includes('solder')) {
      return 'Bottom Copper Layer';
    }
    
    // 内层铜箔 (支持 G1-G32)
    if (['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10',
         'g11', 'g12', 'g13', 'g14', 'g15', 'g16', 'g17', 'g18', 'g19', 'g20',
         'g21', 'g22', 'g23', 'g24', 'g25', 'g26', 'g27', 'g28', 'g29', 'g30',
         'g31', 'g32'].includes(ext) ||
        ['g1l', 'g2l', 'g3l', 'g4l', 'g5l', 'g6l'].includes(ext) ||
        baseName.includes('inner') || baseName.includes('in') ||
        /l\d+|inner\d+|gp\d+/.test(baseName)) {
      return 'Inner Copper Layer';
    }
    
    // 阻焊层
    if (['gts', 'stc', 'tsm', 'smt', 'sst', 'f_mask'].includes(ext) || 
        ['g1s', 'g2s', 'g3s', 'g4s', 'g5s', 'g6s'].includes(ext) ||
        baseName.includes('soldermask') || baseName.includes('mask') ||
        baseName.includes('f_mask') || baseName.includes('top') && baseName.includes('mask')) {
      return 'Top Solder Mask';
    }
    
    if (['gbs', 'sts', 'bsm', 'smb', 'ssb', 'b_mask'].includes(ext) || 
        baseName.includes('b_mask') || baseName.includes('bottom') && baseName.includes('mask')) {
      return 'Bottom Solder Mask';
    }
    
    // 助焊层
    if (['gtp', 'crc', 'tsp', 'spt', 'f_paste'].includes(ext) || 
        ['g1p', 'g2p', 'g3p', 'g4p', 'g5p', 'g6p'].includes(ext) ||
        baseName.includes('paste') || baseName.includes('f_paste') ||
        baseName.includes('top') && baseName.includes('paste')) {
      return 'Top Solder Paste';
    }
    
    if (['gbp', 'crs', 'bsp', 'spb', 'b_paste'].includes(ext) || 
        baseName.includes('b_paste') || baseName.includes('bottom') && baseName.includes('paste')) {
      return 'Bottom Solder Paste';
    }
    
    // 丝印层
    if (['gto', 'plc', 'tsk', 'f_silks'].includes(ext) || 
        ['g1o', 'g2o', 'g3o', 'g4o', 'g5o', 'g6o'].includes(ext) ||
        baseName.includes('silkscreen') || baseName.includes('silk') ||
        baseName.includes('f_silks') || baseName.includes('legend') ||
        baseName.includes('top') && baseName.includes('silk')) {
      return 'Top Silkscreen';
    }
    
    if (['gbo', 'pls', 'bsk', 'b_silks'].includes(ext) || 
        baseName.includes('b_silks') || baseName.includes('bottom') && baseName.includes('silk')) {
      return 'Bottom Silkscreen';
    }
    
    // 默认Gerber文件
    return 'Gerber File';
  }
  
  // 测试文件
  if (['tst', 'test', 'fab', 'assembly'].includes(ext) ||
      baseName.includes('test') || baseName.includes('fab') || baseName.includes('assembly')) {
    return 'Test/Fabrication File';
  }

  // KiCad 特殊文件
  if (['edge_cuts', 'margin', 'eco1_user', 'eco2_user', 'dwgs_user', 'cmts_user'].includes(ext)) {
    return 'KiCad Special Layer';
  }
  
  // 如果都不匹配，返回通用类型
  return 'CAD Output File';
} 