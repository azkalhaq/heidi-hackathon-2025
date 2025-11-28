import { NextResponse } from 'next/server';
import type {
  EmrSnapshotData,
  EmrProblem,
  EmrMedication,
  EmrAllergy,
  EmrLabEntry,
} from '@/types/emr';

export const runtime = 'nodejs';

/**
 * Bridge endpoint between Heidi and the local computer_use_ootb desktop RPA agent.
 *
 * Assumes a controller like showlab/computer_use_ootb is running locally and exposes
 * an HTTP API. By default we call http://localhost:8000/api/task but this can be
 * overridden via the COMPUTER_USE_ENDPOINT env var.
 */
export async function POST(request: Request) {
  try {
    let noteContent = '';
    let patientName = '';

    try {
      const body = await request.json();
      if (body && typeof body.noteContent === 'string') {
        noteContent = body.noteContent;
      }
      if (body && typeof body.patientName === 'string') {
        patientName = body.patientName;
      }
    } catch {
      // No or invalid JSON body – treat as no additional context.
    }

    const controllerEndpoint =
      process.env.COMPUTER_USE_ENDPOINT ?? 'http://localhost:8000/api/task';

    const taskPrompt = buildEmrTaskPrompt({ noteContent, patientName });

    const controllerResponse = await fetch(controllerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskPrompt,
        output_format: 'json',
      }),
    });

    if (!controllerResponse.ok) {
      const text = await controllerResponse.text().catch(() => '');
      throw new Error(
        `Desktop agent request failed (${controllerResponse.status}): ${text || 'No response body'}`,
      );
    }

    const raw = await controllerResponse.json();
    const normalized = normalizeEmrSnapshot(raw);

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('[EMR SNAPSHOT API]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Automation failed while fetching EMR snapshot',
      },
      { status: 500 },
    );
  }
}

function buildEmrTaskPrompt(input: { noteContent: string; patientName: string }) {
  const parts: string[] = [];

  parts.push(
    'You are a careful clinical desktop automation agent controlling OpenEMR on the clinician’s computer.',
  );
  parts.push(
    'The clinician already has OpenEMR open and is logged in, with the correct demo patient selected.',
  );

  if (input.patientName) {
    parts.push(
      `The patient name (from Heidi) is: "${input.patientName}". Use this only as a hint to confirm you are on the right chart.`,
    );
  }

  if (input.noteContent) {
    parts.push(
      'Here is the current clinical note content from Heidi. Use it as additional clinical context only; do NOT try to re-generate it:',
    );
    parts.push('--- NOTE CONTENT START ---');
    parts.push(truncate(input.noteContent, 1500));
    parts.push('--- NOTE CONTENT END ---');
  }

  parts.push(
    [
      'TASK:',
      '1. Ensure the main OpenEMR window is focused.',
      '2. For the currently open patient, navigate to the summary/overview page.',
      '3. Extract the following information from the EMR UI:',
      '   - Active problem list / diagnoses: problem name and onset date (if visible).',
      '   - Current medications: medication name, dose, and frequency.',
      '   - Allergies: substance and reaction (if documented).',
      '   - Recent labs: at least the 3 most recent lab test results with test name, value, unit, and date.',
      '4. DO NOT change, delete, or edit any EMR data. Read-only access only.',
      '5. When you are finished, return the result strictly as JSON with keys:',
      '   "problems", "medications", "allergies", "labs".',
      '   - "problems": [{ "name": string, "onsetDate"?: string }]',
      '   - "medications": [{ "name": string, "dose"?: string, "frequency"?: string }]',
      '   - "allergies": [{ "substance": string, "reaction"?: string }]',
      '   - "labs": [{ "test": string, "value": string, "unit"?: string, "date"?: string }]',
      '6. If a section has no data, return an empty array for that key.',
      '7. Do not wrap the JSON in markdown, text, or any additional explanation.',
    ].join('\n'),
  );

  return parts.join('\n\n');
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function normalizeEmrSnapshot(raw: any): EmrSnapshotData {
  const problems: EmrProblem[] = normalizeProblems(raw?.problems);
  const medications: EmrMedication[] = normalizeMedications(raw?.medications);
  const allergies: EmrAllergy[] = normalizeAllergies(raw?.allergies);
  const labs: EmrLabEntry[] = normalizeLabs(raw?.labs);

  return {
    problems,
    medications,
    allergies,
    labs,
    metadata: {
      source: 'automation',
    },
  };
}

function normalizeProblems(input: any): EmrProblem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { name: item } as EmrProblem;
      }
      const name = typeof item.name === 'string' ? item.name : String(item.name ?? '').trim();
      if (!name) return null;
      const onsetDate =
        typeof item.onsetDate === 'string'
          ? item.onsetDate
          : typeof item.onset_date === 'string'
          ? item.onset_date
          : undefined;
      return { name, onsetDate };
    })
    .filter((p): p is EmrProblem => Boolean(p));
}

function normalizeMedications(input: any): EmrMedication[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { name: item } as EmrMedication;
      }
      const name = typeof item.name === 'string' ? item.name : String(item.name ?? '').trim();
      if (!name) return null;
      const dose =
        typeof item.dose === 'string'
          ? item.dose
          : typeof item.dosage === 'string'
          ? item.dosage
          : undefined;
      const frequency =
        typeof item.frequency === 'string'
          ? item.frequency
          : typeof item.freq === 'string'
          ? item.freq
          : undefined;
      return { name, dose, frequency };
    })
    .filter((m): m is EmrMedication => Boolean(m));
}

function normalizeAllergies(input: any): EmrAllergy[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { substance: item } as EmrAllergy;
      }
      const substance =
        typeof item.substance === 'string'
          ? item.substance
          : typeof item.agent === 'string'
          ? item.agent
          : String(item.substance ?? item.agent ?? '').trim();
      if (!substance) return null;
      const reaction =
        typeof item.reaction === 'string'
          ? item.reaction
          : typeof item.reaction_text === 'string'
          ? item.reaction_text
          : undefined;
      return { substance, reaction };
    })
    .filter((a): a is EmrAllergy => Boolean(a));
}

function normalizeLabs(input: any): EmrLabEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        // Best-effort split like "A1C: 7.1% (2025-04-14)"
        const [namePart, rest] = item.split(':');
        const name = namePart?.trim();
        if (!name) return null;
        const valueMatch = rest?.match(/([0-9.]+[^()]*)(?:\(([^)]+)\))?/);
        const value = valueMatch?.[1]?.trim() || rest?.trim() || '';
        const date = valueMatch?.[2]?.trim();
        return { test: name, value, date } as EmrLabEntry;
      }
      const test =
        typeof item.test === 'string'
          ? item.test
          : typeof item.name === 'string'
          ? item.name
          : String(item.test ?? item.name ?? '').trim();
      if (!test) return null;
      const value =
        typeof item.value === 'string'
          ? item.value
          : item.value != null
          ? String(item.value)
          : '';
      const unit =
        typeof item.unit === 'string'
          ? item.unit
          : typeof item.units === 'string'
          ? item.units
          : undefined;
      const date =
        typeof item.date === 'string'
          ? item.date
          : typeof item.collectedAt === 'string'
          ? item.collectedAt
          : undefined;
      return { test, value, unit, date };
    })
    .filter((l): l is EmrLabEntry => Boolean(l && l.test && l.value));
}
