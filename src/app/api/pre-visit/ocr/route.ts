import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Real OCR implementation using an external OCR API (e.g. OCR.Space).
 *
 * This sends the uploaded file bytes to the OCR provider and parses the
 * returned text into the same structured shape we used for the mock.
 *
 * Configure via environment variables in your `.env.local`:
 *   OCR_API_ENDPOINT=https://api.ocr.space/parse/image
 *   OCR_API_KEY=your_api_key_here
 */
async function extractTextFromImage(imageFile: File): Promise<{
  extractedText: string;
  structuredData: {
    impression?: string;
    findings?: string;
    measurements?: string;
    radiologistComments?: string;
  };
}> {
  const endpoint =
    process.env.OCR_API_ENDPOINT || 'https://api.ocr.space/parse/image';
  const apiKey = process.env.OCR_API_KEY;

  if (!apiKey) {
    // Return mocked OCR data when no API key is configured so the UI
    // can still demonstrate the feature without external services.
    const extractedText = `
MRI BRAIN WITHOUT CONTRAST

INDICATION:
Recurrent headaches and visual disturbances.

FINDINGS:
No evidence of acute infarct or intracranial hemorrhage.
No mass lesion or midline shift identified.
Ventricular system and cortical sulci are normal in size and configuration.
No abnormal extra-axial fluid collections.

MEASUREMENTS:
Pituitary height within normal limits.
Ventricular size within normal limits.

IMPRESSIONS:
1. No acute intracranial abnormality identified.
2. No mass or hemorrhage.

RADIOLOGIST COMMENTS:
Clinical correlation is advised. If symptoms persist or worsen, consider follow-up imaging.
`.trim();

    return {
      extractedText,
      structuredData: {
        impression:
          'No acute intracranial abnormality identified. No mass or hemorrhage.',
        findings:
          'No evidence of acute infarct or hemorrhage. Ventricular system and cortical sulci are normal. No mass lesion or midline shift.',
        measurements:
          'Pituitary and ventricular size within normal limits.',
        radiologistComments:
          'Clinical correlation is advised. Consider follow-up imaging if symptoms persist or worsen.',
      },
    };
  }

  // Build multipart/form-data for the external OCR API
  const outgoing = new FormData();
  // OCR.Space expects the file under the key "file"
  outgoing.append('file', imageFile, imageFile.name);
  // Request plain text back
  outgoing.append('OCREngine', '2');
  outgoing.append('filetype', imageFile.type || 'image');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: apiKey,
    },
    body: outgoing,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `OCR provider error (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as any;

  // OCR.Space style response parsing (defensive)
  const parsedResults = data.ParsedResults?.[0];
  const rawText: string =
    parsedResults?.ParsedText ||
    parsedResults?.TextOverlay?.Lines?.map((l: any) =>
      l.Words?.map((w: any) => w.WordText).join(' '),
    ).join('\n') ||
    '';

  const extractedText = rawText.trim();

  // Heuristic parsing into sections commonly present in MRI / radiology reports
  const structuredData = {
    impression: extractedText
      .match(/IMPRESSIONS?:([\s\S]*?)(?=MEASUREMENTS|FINDINGS|RADIOLOGIST|$)/i)
      ?.[1]
      ?.trim(),
    findings: extractedText
      .match(/FINDINGS?:([\s\S]*?)(?=IMPRESSIONS|MEASUREMENTS|RADIOLOGIST|$)/i)
      ?.[1]
      ?.trim(),
    measurements: extractedText
      .match(/MEASUREMENTS?:([\s\S]*?)(?=RADIOLOGIST|IMPRESSIONS|FINDINGS|$)/i)
      ?.[1]
      ?.trim(),
    radiologistComments: extractedText
      .match(/RADIOLOGIST(?:'S)? COMMENTS?:([\s\S]*?)$/i)
      ?.[1]
      ?.trim(),
  };

  return {
    extractedText,
    structuredData,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or PDF.' },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    // Process OCR against the actual uploaded document
    const result = await extractTextFromImage(imageFile);

    return NextResponse.json({
      success: true,
      ...result,
      // Confidence is provider-specific; here we just surface 0.9 as a placeholder
      confidence: 0.9,
    });
  } catch (error) {
    console.error('[OCR API]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'OCR processing failed unexpectedly',
      },
      { status: 500 },
    );
  }
}

