"use client";

import React from 'react';
import * as FormilyHelpers from '../schema/formilyHelpers';

export default function DebugOptions() {
  // 测试各种选项函数
  const testThicknessOptions = FormilyHelpers.getThicknessOptions([2, '1', '0.5']);
  const testMinTraceOptions = FormilyHelpers.getMinTraceOptions([2, '1', '0.5']);
  const testMinHoleOptions = FormilyHelpers.getMinHoleOptions([2, 1.6]);
  const testSilkscreenOptions = FormilyHelpers.getSilkscreenOptions(['Green']);
  const testSurfaceFinishOptions = FormilyHelpers.getSurfaceFinishOptions([2, 1.6]);
  const testMaskCoverOptions = FormilyHelpers.getMaskCoverOptions([2]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">选项函数调试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">厚度选项 (2层, 1oz, 0.5oz)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testThicknessOptions, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">最小线宽选项 (2层, 1oz, 0.5oz)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testMinTraceOptions, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">最小孔径选项 (2层, 1.6mm)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testMinHoleOptions, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">丝印选项 (绿色阻焊)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testSilkscreenOptions, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">表面处理选项 (2层, 1.6mm)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testSurfaceFinishOptions, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-3">过孔处理选项 (2层)</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testMaskCoverOptions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 