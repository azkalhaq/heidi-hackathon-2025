// In-memory store for referrals (in production, use a database)
export const referralStore = new Map<string, {
  referralLetter: string;
  emrSnapshot: any;
  patientName: string;
  service: string;
  notePreview: string;
  password: string;
  createdAt: Date;
  timelineSummary?: string | null;
}>();

