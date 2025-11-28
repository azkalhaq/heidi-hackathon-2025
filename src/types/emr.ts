export interface EmrLabEntry {
  name: string;
  value: string;
  date?: string;
}

export interface EmrSnapshotData {
  problems: string[];
  medications: string[];
  allergies: string[];
  labs: EmrLabEntry[];
}


