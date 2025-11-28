export interface PrechartDemographics {
  name: string;
  dob?: string | null;
  sex?: string | null;
}

export interface PrechartEncounter {
  date: string;
  summary: string;
}

export interface PrechartVital {
  label: string;
  value: string;
}

export interface PrechartData {
  demographics: PrechartDemographics;
  reasonForVisit?: string | null;
  pastEncounters: PrechartEncounter[];
  vitals: PrechartVital[];
  flags: string[];
}


