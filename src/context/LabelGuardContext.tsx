import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { fetchReportText, renderReportText } from '../utils/scanPdfReport';

// Where the real LabelGuard Python backend (PaddleOCR + Ollama) listens.
// Run it with:  python backend/app.py  (from the honored-one folder)
const SCAN_API_URL = (import.meta.env?.VITE_SCAN_API_URL as string) || 'http://localhost:8001';

export interface OCRResult {
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
}

export interface ProductFields {
  product_name: string | null;
  manufacturer: string | null;
  manufacturer_address: string | null;
  net_quantity: string | null;
  mrp: string | null;
  country_of_origin: string | null;
  manufacturing_date: string | null;
  best_before: string | null;
  consumer_care: string | null;
  unit_sale_price: string | null;
}

export interface ComplianceCheck {
  field: string;
  status: 'PASS' | 'FAIL' | 'REVIEW';
  value: string | null;
  confidence: number;
  rule_citation: string;
  law?: string;
  requirement?: string;
  violation?: string;
  reason?: string;
  explanation: string;
}

export interface ReadabilityInfo {
  min_font_mm: number;
  avg_font_mm: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  note: string;
  lines: { text: string; font_mm: number; readable: boolean }[];
}

export interface ScanResult {
  id: string;
  image_path: string;
  ocr_raw: OCRResult[];
  product: ProductFields;
  readability: ReadabilityInfo;
  compliance: {
    checks: ComplianceCheck[];
    score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    note: string;
  };
  timestamp: string;
  report_path?: string;
  scan_type?: 'upload' | 'camera' | 'qr' | 'gallery' | 'video';
  barcode?: string;
}

interface LabelGuardContextType {
  scanHistory: ScanResult[];
  currentScan: ScanResult | null;
  isScanning: boolean;
  scanProgress: number;
  scanStage: string;
  performScan: (files: File[], scanType?: string) => Promise<ScanResult[]>;
  performQRScan: (file: File) => Promise<ScanResult>;
  performURLScan: (url: string) => Promise<ScanResult>;
  performTextScan: (text: string) => Promise<ScanResult>;
  performSampleScan: (template: string) => Promise<ScanResult>;
  performBatchScan: (files: File[]) => Promise<ScanResult[]>;
  selectScan: (result: ScanResult) => void;
  deleteScan: (id: string) => void;
  clearCurrentScan: () => void;
  generatePDFReport: (result: ScanResult) => Promise<Blob>;
}

const LabelGuardContext = createContext<LabelGuardContextType | undefined>(undefined);

export const useLabelGuard = () => {
  const context = useContext(LabelGuardContext);
  if (!context) throw new Error('useLabelGuard must be used within LabelGuardProvider');
  return context;
};

const RULE_CITATIONS: Record<string, string> = {
  product_name: 'Legal Metrology Rule 6(1)(a)',
  manufacturer: 'Legal Metrology Rule 6(1)(b)',
  manufacturer_address: 'Legal Metrology Rule 6(1)(b)',
  net_quantity: 'Legal Metrology Rule 6(1)(c)',
  mrp: 'Legal Metrology Rule 6(1)(d)',
  country_of_origin: 'Legal Metrology Rule 6(1)(i)',
  manufacturing_date: 'Legal Metrology Rule 6(1)(e)',
  best_before: 'Legal Metrology Rule 6(1)(f)',
  consumer_care: 'Legal Metrology Rule 6(1)(j)',
  unit_sale_price: 'Legal Metrology Rule 6(1)(d)',
};

const FIELD_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  manufacturer: 'Manufacturer',
  manufacturer_address: 'Manufacturer Address',
  net_quantity: 'Net Quantity',
  mrp: 'MRP (Maximum Retail Price)',
  country_of_origin: 'Country of Origin',
  manufacturing_date: 'Manufacturing Date',
  best_before: 'Best Before / Expiry',
  consumer_care: 'Consumer Care Contact',
  unit_sale_price: 'Unit Sale Price',
};

interface BackendCheck {
  field: string;
  status: string;
  value: string | null;
  confidence: number;
  rule_citation?: string;
  law?: string;
  requirement?: string;
  violation?: string;
  reason?: string;
  explanation?: string;
}

// Map the real backend JSON payload onto the ScanResult shape the UI expects.
export const mapScanResponse = (
  data: any,
  id: string,
  imageUrl: string,
  scanType: string = 'upload',
  extra?: Partial<ScanResult>,
): ScanResult => {
  const ocrRaw: OCRResult[] = (data.ocr_raw || []).map((o: { text: string; bbox: number[]; confidence: number }) => ({
    text: o.text,
    bbox: [o.bbox[0], o.bbox[1], o.bbox[2], o.bbox[3]] as [number, number, number, number],
    confidence: o.confidence,
  }));

  const product = data.product as ProductFields;

  const rb = data.readability;
  const readability: ReadabilityInfo = rb && typeof rb === 'object'
    ? {
        min_font_mm: typeof rb.min_font_mm === 'number' ? rb.min_font_mm : 0,
        avg_font_mm: typeof rb.avg_font_mm === 'number' ? rb.avg_font_mm : 0,
        status: (['PASS', 'REVIEW', 'FAIL'].includes(rb.status) ? rb.status : 'REVIEW') as 'PASS' | 'REVIEW' | 'FAIL',
        note: typeof rb.note === 'string' ? rb.note : '',
        lines: Array.isArray(rb.lines) ? rb.lines : [],
      }
    : {
        min_font_mm: 0,
        avg_font_mm: 0,
        status: 'REVIEW' as const,
        note: 'Legibility analysis not available for this scan.',
        lines: [],
      };

  const checks: ComplianceCheck[] = (data.compliance?.checks || []).map((c: BackendCheck) => ({
    field: c.field,
    status: (['PASS', 'FAIL', 'REVIEW'].includes(c.status) ? c.status : 'REVIEW') as 'PASS' | 'FAIL' | 'REVIEW',
    value: c.value ?? null,
    confidence: typeof c.confidence === 'number' ? c.confidence : 0,
    rule_citation: c.rule_citation || RULE_CITATIONS[c.field] || 'Legal Metrology Rules',
    law: c.law || RULE_CITATIONS[c.field] || 'Legal Metrology (Packaged Commodities) Rules, 2011',
    requirement: c.requirement || '',
    violation: c.violation || '',
    reason: c.reason || '',
    explanation: c.explanation || (c.status === 'PASS'
      ? `${FIELD_LABELS[c.field] || c.field} clearly visible and readable.`
      : `${FIELD_LABELS[c.field] || c.field} requires attention.`),
  }));

  return {
    id,
    image_path: imageUrl,
    ocr_raw: ocrRaw,
    product,
    readability,
    compliance: {
      checks,
      score: typeof data.compliance?.score === 'number' ? data.compliance.score : 0,
      risk_level: (['LOW', 'MEDIUM', 'HIGH'].includes(data.compliance?.risk_level) ? data.compliance.risk_level : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      note: data.compliance?.note || 'AI-Assisted Compliance Assessment.',
    },
    timestamp: new Date().toISOString(),
    scan_type: scanType as any,
    ...extra,
  };
};

// Scans are persisted to localStorage so history survives page reloads.
const HISTORY_KEY = 'labelguard_scan_history';
const MAX_HISTORY = 40;

const loadStoredHistory = (): ScanResult[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: Partial<ScanResult>) => ({
      ...(s as ScanResult),
      readability: s.readability
        ? s.readability
        : { min_font_mm: 0, avg_font_mm: 0, status: 'REVIEW' as const, note: 'Legibility analysis not available for this scan.', lines: [] },
    }));
  } catch {
    return [];
  }
};

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Prepend new scans to history and keep only the newest MAX_HISTORY entries, so
// the in-session history and the persisted history stay consistent.
const prependHistory = (prev: ScanResult[], added: ScanResult[]): ScanResult[] =>
  [...added, ...prev].slice(0, MAX_HISTORY);

export const LabelGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(() => loadStoredHistory());
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');

  // Persist scan history to localStorage. Blob image URLs only live for the
  // current session, so they are converted to data URLs before saving so the
  // thumbnails still render after a reload.
  useEffect(() => {
    let cancelled = false;
    const persist = async () => {
      const persisted = await Promise.all(
        scanHistory.slice(0, MAX_HISTORY).map(async (scan) => {
          if (scan.image_path.startsWith('blob:')) {
            try {
              const blob = await (await fetch(scan.image_path)).blob();
              const dataUrl = await blobToDataURL(blob);
              return { ...scan, image_path: dataUrl };
            } catch {
              return { ...scan, image_path: '' };
            }
          }
          return scan;
        }),
      );
      if (cancelled) return;
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(persisted));
      } catch (e) {
        console.error('Failed to persist scan history', e);
      }
    };
    if (scanHistory.length > 0) {
      persist();
    } else {
      localStorage.removeItem(HISTORY_KEY);
    }
    return () => { cancelled = true; };
  }, [scanHistory]);
  const fetchAndMapScan = useCallback(async (file: File, scanType: string = 'upload'): Promise<ScanResult> => {
    const id = faker.string.uuid();
    const imageUrl = URL.createObjectURL(file);

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${SCAN_API_URL}/api/scan`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Scan API error: ${res.status}`);
    }
    const data = await res.json();

    return mapScanResponse(data, id, imageUrl, scanType);
  }, []);

  const performScan = useCallback(async (files: File[], scanType: string = 'upload'): Promise<ScanResult[]> => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentScan(null);
    
    const stages = [
      'Initializing OCR engine...',
      'Reading label text...',
      'Extracting product fields...',
      'Running compliance rules...',
      'Generating report...',
    ];

    const results: ScanResult[] = [];

    for (let i = 0; i < files.length; i++) {
      for (let j = 0; j < stages.length; j++) {
        setScanStage(stages[j]);
        setScanProgress(((i * stages.length + j + 1) / (files.length * stages.length)) * 100);
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
      }
      
      const result = await fetchAndMapScan(files[i], scanType);
      results.push(result);
      
      if (i === 0) {
        setCurrentScan(result);
      }
    }

    setScanHistory(prev => prependHistory(prev, results));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    
    return results;
  }, [fetchAndMapScan]);

  const performQRScan = useCallback(async (file: File): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentScan(null);

    const stages = [
      'Decoding QR code...',
      'Reading label text...',
      'Extracting product fields...',
      'Running compliance rules...',
      'Generating report...',
    ];
    for (let i = 0; i < stages.length; i++) {
      setScanStage(stages[i]);
      setScanProgress(((i + 1) / stages.length) * 85);
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    const id = faker.string.uuid();
    const imageUrl = URL.createObjectURL(file);
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${SCAN_API_URL}/api/scan/qr`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`QR scan API error: ${res.status}`);
    const data = await res.json();

    const result = mapScanResponse(data, id, imageUrl, 'qr', {
      barcode: data.barcode || '',
    });

    setCurrentScan(result);
    setScanHistory(prev => prependHistory(prev, [result]));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    return result;
  }, []);

  const performURLScan = useCallback(async (url: string): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(10);
    setCurrentScan(null);
    setScanStage('Downloading image from URL...');

    const id = faker.string.uuid();
    const res = await fetch(`${SCAN_API_URL}/api/scan/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(`URL scan API error: ${res.status}`);
    const data = await res.json();

    const result = mapScanResponse(data, id, '', 'upload', { scan_type: 'upload' });

    setCurrentScan(result);
    setScanHistory(prev => prependHistory(prev, [result]));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    return result;
  }, []);

  const performTextScan = useCallback(async (text: string): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(10);
    setCurrentScan(null);
    setScanStage('Analyzing text content...');

    const id = faker.string.uuid();
    const res = await fetch(`${SCAN_API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Analyze API error: ${res.status}`);
    const data = await res.json();

    const result = mapScanResponse(data, id, '', 'qr', { scan_type: 'qr', barcode: text });

    setCurrentScan(result);
    setScanHistory(prev => prependHistory(prev, [result]));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    return result;
  }, []);

  const performSampleScan = useCallback(async (template: string): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(10);
    setCurrentScan(null);
    setScanStage(`Generating sample ${template} label...`);

    const id = faker.string.uuid();
    const res = await fetch(`${SCAN_API_URL}/api/sample/${encodeURIComponent(template)}`);
    if (!res.ok) throw new Error(`Sample API error: ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], `sample-${template}.png`, { type: 'image/png' });
    const imageUrl = URL.createObjectURL(file);

    const form = new FormData();
    form.append('file', file);
    const scanRes = await fetch(`${SCAN_API_URL}/api/scan`, { method: 'POST', body: form });
    if (!scanRes.ok) throw new Error(`Scan API error: ${scanRes.status}`);
    const data = await scanRes.json();

    const result = mapScanResponse(data, id, imageUrl, 'upload');

    setCurrentScan(result);
    setScanHistory(prev => prependHistory(prev, [result]));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    return result;
  }, []);

  const performBatchScan = useCallback(async (files: File[]): Promise<ScanResult[]> => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStage('Processing batch...');

    const results: ScanResult[] = [];
    for (let i = 0; i < files.length; i++) {
      setScanStage(`Scanning ${files[i].name}...`);
      setScanProgress(((i + 1) / files.length) * 100);
      results.push(await fetchAndMapScan(files[i], 'upload'));
    }
    setScanHistory(prev => prependHistory(prev, results));
    setIsScanning(false);
    setScanProgress(100);
    setScanStage('Complete!');
    return results;
  }, [fetchAndMapScan]);

  const generatePDFReport = useCallback(async (result: ScanResult): Promise<Blob> => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 56;

    const teal: [number, number, number] = [20, 184, 166];

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 4, 'F');
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 4, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...teal);
    doc.text('LabelGuard AI - Compliance Report', margin, y);
    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(85, 90, 100);
    doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}   |   Scan ID: ${result.id}`, margin, y);
    y += 30;

    // Let the local LLM write the report; fall back to a local build if offline.
    const reportText = await fetchReportText(result);
    y = renderReportText(doc, reportText, { pageWidth, margin, startY: y });

    // Disclaimer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    y += 10;
    doc.text('DISCLAIMER: AI-Assisted Assessment', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 70, 10);
    doc.text(
      'This report is generated by an AI-assisted compliance screening tool for educational purposes only. ' +
      'The final legal determination rests with an authorized officer under the Legal Metrology Act, 2009. ' +
      'This assessment does not constitute legal advice.',
      margin, y, { maxWidth: pageWidth - 2 * margin }
    );

    return doc.output('blob');
  }, []);

  const deleteScan = useCallback((id: string) => {
    setScanHistory(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearCurrentScan = useCallback(() => {
    setCurrentScan(null);
    setScanProgress(0);
    setScanStage('');
  }, []);

  const selectScan = useCallback((result: ScanResult) => {
    setCurrentScan(result);
    setScanProgress(100);
    setScanStage('Complete!');
  }, []);

  return (
    <LabelGuardContext.Provider value={{
      scanHistory,
      currentScan,
      isScanning,
      scanProgress,
      scanStage,
      performScan,
      performQRScan,
      performURLScan,
      performTextScan,
      performSampleScan,
      performBatchScan,
      selectScan,
      deleteScan,
      clearCurrentScan,
      generatePDFReport,
    }}>
      {children}
    </LabelGuardContext.Provider>
  );
};
