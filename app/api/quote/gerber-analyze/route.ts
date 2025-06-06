import { NextRequest, NextResponse } from 'next/server';
import { analyzeGerberFilesBackend } from './backend-gerber-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    // 这里将是实际调用 Gerber 解析逻辑的地方
    const analysisResult = await analyzeGerberFilesBackend(file);

    // 模拟文件存储（在实际应用中，您会存储文件到S3或其他存储服务）
    const fileUrl = `/temp-storage/${file.name}-${Date.now()}`; // 模拟一个URL

    return NextResponse.json({
      success: true,
      url: fileUrl,
      analysisResult: analysisResult,
    });

  } catch (error) {
    console.error('Gerber analysis API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 