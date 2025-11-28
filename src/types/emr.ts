export interface EmrProblem {
  name: string;
  onsetDate?: string | null;
}

export interface EmrMedication {
  name: string;
  dose?: string | null;
  frequency?: string | null;
}

export interface EmrAllergy {
  substance: string;
  reaction?: string | null;
}

export interface EmrLabEntry {
  test: string;
  value: string;
  unit?: string | null;
  date?: string | null;
}

export interface EmrSnapshotData {
  problems: EmrProblem[];
  medications: EmrMedication[];
  allergies: EmrAllergy[];
  labs: EmrLabEntry[];
  metadata?: {
    source: 'automation' | 'mock';
    message?: string;
  };
}


