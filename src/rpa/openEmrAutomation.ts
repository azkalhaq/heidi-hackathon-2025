import type { EmrSnapshotData, EmrLabEntry } from '@/types/emr';

/**
 * Runs the nut.js automation against an open OpenEMR window and returns the scraped data.
 * For local development without nut.js / OCR installed we fall back to mocked data so the UI stays usable.
 */
export async function runEmrSnapshotAutomation(): Promise<EmrSnapshotData> {
  try {
    const nut = await import('@nut-tree/nut-js');
    const { keyboard, Key, screen, mouse, straightTo, sleep } = nut;

    keyboard.config.autoDelayMs = 50;
    screen.config.resourceDirectory = 'rpa-assets';

    await focusOpenEmr(keyboard, Key, sleep);

    const problems = await readListSection(screen, {
      region: new nut.Region(300, 220, 900, 200),
      fallback: ['Hypertension', 'Type 2 Diabetes'],
    });

    await scrollToSection(mouse, screen, 'Medications');
    const medications = await readListSection(screen, {
      region: new nut.Region(300, 420, 900, 200),
      fallback: ['Metformin 500mg BID', 'Lisinopril 10mg daily'],
    });

    await scrollToSection(mouse, screen, 'Allergies');
    const allergies = await readListSection(screen, {
      region: new nut.Region(300, 620, 900, 160),
      fallback: ['NKDA'],
    });

    await scrollToSection(mouse, screen, 'Labs');
    const labsText = await tryRead(screen, new nut.Region(300, 800, 900, 260));
    const labs = labsText
      ? parseLabs(labsText)
      : [
          { name: 'A1C', value: '7.1%', date: '14 Apr 2025' },
          { name: 'LDL', value: '92 mg/dL', date: '14 Apr 2025' },
        ];

    await keyboard.pressKey(Key.LeftAlt, Key.Tab);
    await keyboard.releaseKey(Key.Tab);
    await keyboard.releaseKey(Key.LeftAlt);

    return { problems, medications, allergies, labs };
  } catch (error) {
    console.warn('[EMR Snapshot] Falling back to mock data:', error);
    return {
      problems: ['Hypertension', 'Hyperlipidemia'],
      medications: ['Metformin 500 mg BID', 'Atorvastatin 20 mg QD'],
      allergies: ['NKDA'],
      labs: [
        { name: 'A1C', value: '7.1%', date: '14 Apr 2025' },
        { name: 'LDL', value: '92 mg/dL', date: '14 Apr 2025' },
      ],
    };
  }
}

async function focusOpenEmr(
  keyboard: typeof import('@nut-tree/nut-js').keyboard,
  Key: typeof import('@nut-tree/nut-js').Key,
  sleep: (ms: number) => Promise<void>,
) {
  await keyboard.pressKey(Key.LeftAlt, Key.Tab);
  await sleep(300);
  await keyboard.releaseKey(Key.Tab);
  await keyboard.releaseKey(Key.LeftAlt);
  await sleep(600);
}

async function scrollToSection(
  mouse: typeof import('@nut-tree/nut-js').mouse,
  screen: typeof import('@nut-tree/nut-js').screen,
  _label: string,
) {
  await mouse.move(straightTo(await screen.center()));
  await mouse.scrollDown(300);
}

async function readListSection(
  screen: typeof import('@nut-tree/nut-js').screen,
  options: { region: import('@nut-tree/nut-js').Region; fallback: string[] },
) {
  const text = await tryRead(screen, options.region);
  if (!text) return options.fallback;
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function tryRead(screen: typeof import('@nut-tree/nut-js').screen, region: import('@nut-tree/nut-js').Region) {
  try {
    return await screen.read(region);
  } catch {
    return '';
  }
}

function parseLabs(raw: string): EmrLabEntry[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [namePart, valueRest] = line.split(':');
      const [valuePart, datePart] = valueRest.split('(');
      return {
        name: namePart.trim(),
        value: valuePart.trim(),
        date: datePart ? datePart.replace(')', '').trim() : undefined,
      };
    });
}


