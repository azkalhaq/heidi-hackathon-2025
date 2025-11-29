import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Generates a referral letter by filling in the generic template with information
 * extracted from the consult note using an LLM (OpenAI).
 *
 * Requires OPENAI_API_KEY in environment variables.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noteContent, patientName, service, prechart, emrSnapshot } = body;

    if (!noteContent || typeof noteContent !== 'string') {
      return NextResponse.json(
        { error: 'noteContent is required and must be a string' },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENAI_API_KEY is not configured. Please set it in your .env.local file.',
        },
        { status: 500 },
      );
    }

    const template = `[Today's Date]

Dear [Name and title of clinician the letter is addressed to], (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

Re: [Patient's full name] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

"Thank you for seeing the patient below."

I am writing to refer my patient, [Patient's full name] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely), who is known with [Known medical conditions including past diagnoses, chronic diseases or relevant background medical history] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely) and is currently using [Medications, including prescription medications, over-the-counter medications, supplements] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely).

[He/She/They] (Only include gender-specific pronouns if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise use gender-neutral pronouns by default) presented to me today with the following problem which includes [History of presenting complaint, current concerns or symptoms, clinical context, relevant background to the issue, and discussion topics covered] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely. Write in full sentences.)

Your expertise would be greatly appreciated in assisting with further management strategies for this patient.

"Thank you for your attention to this matter."

Yours sincerely,

[Clinician's title, full name and surname] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)
[Clinician type or specialty] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)
[Clinician's contact details or registration number] (Only include if explicitly mentioned in the transcript, contextual notes or clinical note; otherwise omit completely)

(Never come up with your own patient details, medical history, symptoms, diagnosis, assessment, management plan or clinician information—use only what is explicitly provided in the transcript, contextual notes or clinical note. If information related to a placeholder has not been mentioned, omit that section or placeholder entirely. Do not insert generic statements, summaries, or assumptions in place of missing data. Maintain the letter's structure and tone, ensuring the final document is clinically accurate.)`;

    const systemPrompt = `You are a medical assistant helping to draft referral letters. Your task is to fill in a referral letter template using ONLY information explicitly mentioned in the provided consult note. 

CRITICAL RULES:
1. Use ONLY information that is explicitly stated in the consult note. Never invent, assume, or infer details.
2. If a placeholder section has no corresponding information in the note, OMIT that entire section or placeholder.
3. Replace placeholders like [Patient's full name] with actual data from the note, or remove the line if not available.
4. For dates, use today's date in the format: [Today's Date] → replace with actual date like "January 15, 2025".
5. Maintain the professional, clinical tone of the template.
6. Keep the structure of the letter intact.
7. Do not add generic statements or summaries where specific information is missing.
8. For gender pronouns, use "they/their" by default unless explicitly stated in the note.

Return the completed referral letter with all available information filled in, and sections without data removed.`;

    const userPrompt = `Fill in the following referral letter template using information from this consult note:

CONSULT NOTE:
${noteContent}

${prechart ? `\nADDITIONAL CONTEXT FROM EMR (Pre-chart):\n${JSON.stringify(prechart, null, 2)}\n` : ''}

${emrSnapshot ? `\nCURRENT EMR SNAPSHOT DATA:\n${JSON.stringify(emrSnapshot, null, 2)}\n` : ''}

${patientName ? `\nPatient name (for reference): ${patientName}\n` : ''}
${service ? `\nReferral service: ${service}\n` : ''}

TEMPLATE TO FILL:
${template}

Please fill in the template with information from the consult note. Omit any sections or placeholders that don't have corresponding information in the note.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[OPENAI API ERROR]', openaiResponse.status, errorText);
      return NextResponse.json(
        {
          error: `OpenAI API request failed (${openaiResponse.status}). Check your API key and try again.`,
        },
        { status: 500 },
      );
    }

    const openaiData = await openaiResponse.json();
    const generatedText =
      openaiData.choices?.[0]?.message?.content?.trim() || template;

    return NextResponse.json({ 
      referralLetter: generatedText,
      emrSnapshot: emrSnapshot || null,
    });
  } catch (error) {
    console.error('[GENERATE REFERRAL API]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate referral letter',
      },
      { status: 500 },
    );
  }
}

