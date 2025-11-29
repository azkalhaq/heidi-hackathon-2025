export interface PreVisitFormData {
  id?: string;
  sessionId?: string;
  sessionCode?: string;
  appointmentId?: string;
  submittedAt?: string;
  
  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    visitDateTime?: string;
  };
  
  // Medical Information
  medicalInfo: {
    reasonForVisit: string;
    currentSymptoms?: string;
    medicalHistory?: string;
    currentMedications?: string;
    allergies?: string;
    additionalNotes?: string;
  };
  
  // Uploads
  uploads: {
    images: Array<{
      id: string;
      url: string;
      filename: string;
      type: 'mri' | 'scan' | 'document' | 'other';
      uploadedAt: string;
    }>;
    ocrResults: Array<{
      imageId: string;
      extractedText: string;
      structuredData?: {
        impression?: string;
        findings?: string;
        measurements?: string;
        radiologistComments?: string;
      };
    }>;
  };
  
  // Verification
  verificationMethod?: 'sessionCode' | 'appointmentId' | 'dobPhone';
  verified?: boolean;
}

export interface OCRResult {
  imageId: string;
  extractedText: string;
  structuredData: {
    impression?: string;
    findings?: string;
    measurements?: string;
    radiologistComments?: string;
  };
  confidence?: number;
}

