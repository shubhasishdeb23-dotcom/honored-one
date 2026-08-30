export type SeverityLevel = 'high' | 'medium' | 'low';

export type LawCategory = 'criminal' | 'civil' | 'corporate' | 'constitutional' | 'consumer' | 'cyber' | 'environmental' | 'labor' | 'taxation' | 'intellectual_property';

export interface LegalReference {
  act: string;
  section: string;
  article?: string;
  description: string;
  fullCitation: string;
}

export interface Violation {
  id: string;
  example: string;
  violationDescription: string;
  legalReferences: LegalReference[];
  category: LawCategory;
  severity: SeverityLevel;
  explanation: string;
  precedent?: string;
  punishment?: string;
}

export interface ReportData {
  id: string;
  title: string;
  generatedAt: string;
  examples: string[];
  violations: Violation[];
  summary: {
    totalViolations: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    categories: Record<LawCategory, number>;
    keyReferences: LegalReference[];
  };
  disclaimer: string;
}

export interface ReportFormInput {
  examples: string;
  reportTitle: string;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}
