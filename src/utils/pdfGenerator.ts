export function generatePDFReport(reportData: any): void {
  const pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 2500 >>
stream
BT
/F1 24 Tf
50 750 Td
(${reportData.title}) Tj
/F1 12 Tf
50 710 Td
(Generated: ${new Date(reportData.generatedAt).toLocaleString()}) Tj
50 690 Td
(Report ID: ${reportData.id}) Tj
/F1 14 Tf
50 650 Td
(SUMMARY) Tj
/F1 12 Tf
50 630 Td
(Total Violations: ${reportData.summary.totalViolations}) Tj
50 610 Td
(High Severity: ${reportData.summary.highSeverity} | Medium: ${reportData.summary.mediumSeverity} | Low: ${reportData.summary.lowSeverity}) Tj
/F1 14 Tf
50 570 Td
(VIOLATIONS FOUND) Tj
/F1 10 Tf
${reportData.violations.map((v: any, i: number) => `50 ${550 - i * 60} Td ([${v.severity.toUpperCase()}] ${v.violationDescription.slice(0, 60)}) Tj 50 ${535 - i * 60} Td (${v.legalReferences.map((r: any) => r.fullCitation).join(', ').slice(0, 80)}) Tj`).join('\n')}
/F1 10 Tf
50 150 Td
(DISCLAIMER: This report is AI-generated for informational purposes.) Tj
50 130 Td
(Consult a qualified legal professional for accurate assessment.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2500
%%EOF
  `.trim();

  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `legal-report-${reportData.id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateTextReport(reportData: any): void {
  const content = `
LEGAL COMPLIANCE ANALYSIS REPORT
================================
Title: ${reportData.title}
Generated: ${new Date(reportData.generatedAt).toLocaleString()}
Report ID: ${reportData.id}

SUMMARY
-------
Total Violations: ${reportData.summary.totalViolations}
High Severity: ${reportData.summary.highSeverity}
Medium Severity: ${reportData.summary.mediumSeverity}
Low Severity: ${reportData.summary.lowSeverity}

CATEGORY BREAKDOWN
-----------------
${Object.entries(reportData.summary.categories)
  .filter(([_, count]) => (count as number) > 0)
  .map(([cat, count]) => `${cat}: ${count}`)
  .join('\n')}

VIOLATIONS
----------
${reportData.violations.map((v: any, i: number) => `
${i + 1}. [${v.severity.toUpperCase()}] ${v.violationDescription}
   Category: ${v.category}
   Legal References: ${v.legalReferences.map((r: any) => r.fullCitation).join(', ')}
   Explanation: ${v.explanation.slice(0, 200)}...
`).join('\n')}

KEY LEGAL REFERENCES
-------------------
${reportData.summary.keyReferences.map((r: any) => `- ${r.fullCitation}: ${r.description}`).join('\n')}

DISCLAIMER
----------
${reportData.disclaimer}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `legal-report-${reportData.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateHTMLReport(reportData: any): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legal Compliance Report - ${reportData.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; }
    .violation { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 15px; }
    .severity-high { border-left: 4px solid #ef4444; }
    .severity-medium { border-left: 4px solid #f97316; }
    .severity-low { border-left: 4px solid #eab308; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-high { background: rgba(239,68,68,0.2); color: #ef4444; }
    .badge-medium { background: rgba(249,115,22,0.2); color: #f97316; }
    .badge-low { background: rgba(234,179,8,0.2); color: #eab308; }
    .legal-ref { background: rgba(20,184,166,0.1); padding: 8px 12px; border-radius: 8px; margin: 5px 0; font-size: 13px; }
    .disclaimer { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportData.title}</h1>
    <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
    <p>Report ID: ${reportData.id}</p>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${reportData.summary.totalViolations}</div>
      <div>Total Violations</div>
    </div>
    <div class="stat" style="color: #ef4444;">
      <div class="stat-value">${reportData.summary.highSeverity}</div>
      <div>High Severity</div>
    </div>
    <div class="stat" style="color: #f97316;">
      <div class="stat-value">${reportData.summary.mediumSeverity}</div>
      <div>Medium Severity</div>
    </div>
    <div class="stat" style="color: #eab308;">
      <div class="stat-value">${reportData.summary.lowSeverity}</div>
      <div>Low Severity</div>
    </div>
  </div>

  <h2>Violations Found</h2>
  ${reportData.violations.map((v: any) => `
  <div class="violation severity-${v.severity}">
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
      <h3 style="margin: 0;">${v.violationDescription}</h3>
      <span class="badge badge-${v.severity}">${v.severity.toUpperCase()}</span>
    </div>
    <p style="color: #888; font-size: 14px; margin: 5px 0;">Category: ${v.category}</p>
    <div style="margin: 10px 0;">
      ${v.legalReferences.map((r: any) => `<div class="legal-ref">${r.fullCitation}</div>`).join('')}
    </div>
    <p style="font-size: 14px; color: #aaa;">${v.explanation}</p>
  </div>
  `).join('')}

  <div class="disclaimer">
    <h4 style="color: #f59e0b; margin-top: 0;">Disclaimer</h4>
    <p style="font-size: 14px; color: #d4d4d4; margin: 0;">${reportData.disclaimer}</p>
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `legal-report-${reportData.id.slice(0, 8)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
