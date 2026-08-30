import type { ScanResult } from '../context/LabelGuardContext';

const SCAN_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SCAN_API_URL as string)) ||
  'http://localhost:8001';

/**
 * Local, synchronous structured-text reporter. Used as an instant fallback
 * if the LLM report endpoint is offline. Produces the same line-oriented
 * format the renderer expects (one logical item per line).
 */
export function buildReportText(result: ScanResult): string {
  const lines: string[] = [
    'COMPLIANCE SUMMARY',
    `Score: ${result.compliance.score}/100   |   Risk: ${result.compliance.risk_level}`,
    result.compliance.note || '',
    '',
    'PRODUCT DETAILS',
  ];
  for (const [k, v] of Object.entries(result.product)) {
    lines.push(`- ${k.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}: ${v || 'Not detected'}`);
  }
  lines.push('', 'COMPLIANCE CHECKS');
  for (const c of result.compliance.checks) {
    lines.push(
      `- [${c.status}] ${c.field.replace(/_/g, ' ')}: ${c.value || 'NOT FOUND'} ` +
        `(confidence ${Math.round((c.confidence || 0) * 100)}%)`
    );
    if (c.reason) lines.push(`    ${c.reason}`);
    if (c.law) lines.push(`    Legal basis: ${c.law}`);
    if (c.requirement) lines.push(`    Requirement: ${c.requirement}`);
    if (c.status === 'FAIL' && c.violation) lines.push(`    Violation: ${c.violation}`);
  }
  return lines.join('\n');
}

/**
 * Ask the local LLM (via backend /api/report) to write the report text.
 * On any failure returns the local build so report generation never breaks.
 */
export async function fetchReportText(result: ScanResult): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(`${SCAN_API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan: result }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) throw new Error(`report api ${res.status}`);
    const data = await res.json();
    if (data && typeof data.text === 'string' && data.text.trim()) {
      return data.text.trim();
    }
    return buildReportText(result);
  } catch {
    return buildReportText(result);
  }
}

/**
 * Render a line-oriented report into the supplied jsPDF doc with automatic
 * word-wrap, so long values (e.g. addresses) wrap onto their own lines and
 * never collide with other content. Returns the next usable y for the caller.
 */
export function renderReportText(
  doc: any,
  text: string,
  opts: { pageWidth: number; margin: number; startY: number }
): number {
  const { pageWidth, margin } = opts;
  const contentWidth = pageWidth - 2 * margin;
  const lineH = 13;
  let y = opts.startY;
  const bottom = pageWidth > 600 ? 800 : 740;

  const sectionColor: [number, number, number] = [8, 145, 178];
  const dark: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [90, 95, 105];

  const emit = (rawLine: string) => {
    if (y > bottom - 40) {
      doc.addPage();
      y = margin;
      doc.setFontSize(9);
    }
    const line = rawLine;
    const isSection =
      /^(COMPLIANCE SUMMARY|PRODUCT DETAILS|COMPLIANCE CHECKS|DISCLAIMER)$/.test(line.trim());
    const isBullet = /^\s*- \[(PASS|FAIL|REVIEW)\]/.test(line);
    const isMeta = /^\s+- /.test(line) || /^\s{4}/.test(line);

    let font = 'normal';
    let size = 9;
    let color: [number, number, number] = dark;
    if (isSection) {
      font = 'bold';
      size = 14;
      color = sectionColor;
      y += 4;
    } else if (isBullet) {
      font = 'bold';
      size = 10;
      color = line.includes('[FAIL]') ? [190, 18, 60] : line.includes('[REVIEW]') ? [180, 110, 10] : dark;
    } else if (isMeta) {
      font = 'normal';
      size = 8.5;
      color = muted;
    } else {
      size = 9;
      color = line.startsWith('Score') || line.startsWith('Checks') ? dark : dark;
    }

    doc.setFont('helvetica', font);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * lineH + (isSection ? 2 : 0) + 1.5;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    // Skip empty lines but keep a little vertical rhythm between blocks.
    if (rawLine.trim() === '') {
      y += 4;
      continue;
    }
    emit(rawLine);
  }
  return y;
}
