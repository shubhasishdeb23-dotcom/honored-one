import { v4 as uuidv4 } from 'uuid';
import { ReportData, Violation, LegalReference, LawCategory, SeverityLevel } from '../types/legal';
import { INDIAN_LAWS } from '../data/legalDatabase';

const KEYWORDS_MAP: Record<string, { category: LawCategory; severity: SeverityLevel; legalRefs: LegalReference[] }> = {
  'theft': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['378', '379'].includes(l.section)) },
  'stealing': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['378', '379'].includes(l.section)) },
  'robbery': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['390', '392'].includes(l.section)) },
  'murder': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['299', '300', '302'].includes(l.section)) },
  'killing': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['299', '300'].includes(l.section)) },
  'assault': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['351', '352', '354'].includes(l.section)) },
  'rape': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['375', '376'].includes(l.section)) },
  'sexual assault': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['375', '376'].includes(l.section)) },
  'harassment': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Sexual Harassment of Women at Workplace Act, 2013'] },
  'cheating': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['415', '420'].includes(l.section)) },
  'fraud': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['420'].includes(l.section)).concat(INDIAN_LAWS['Companies Act, 2013'].filter(l => ['447'].includes(l.section))) },
  'forgery': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['463', '464', '467', '468', '471'].includes(l.section)) },
  'fake document': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['467', '468', '471'].includes(l.section)) },
  'extortion': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['383', '384'].includes(l.section)) },
  'blackmail': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['383', '384', '503', '506'].includes(l.section)) },
  'threat': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['503', '506'].includes(l.section)) },
  'criminal intimidation': { category: 'criminal', severity: 'medium', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['503', '506'].includes(l.section)) },
  'hacking': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['43', '66'].includes(l.section)) },
  'data breach': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['43', '66', '72'].includes(l.section)) },
  'identity theft': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['66C'].includes(l.section)) },
  'phishing': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['66C', '66D'].includes(l.section)) },
  'online fraud': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['66', '66D'].includes(l.section)) },
  'cyber crime': { category: 'cyber', severity: 'high', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['66', '66C', '66D'].includes(l.section)) },
  'obscene content': { category: 'cyber', severity: 'medium', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['67', '67A'].includes(l.section)) },
  'privacy violation': { category: 'cyber', severity: 'medium', legalRefs: INDIAN_LAWS['Information Technology Act, 2000'].filter(l => ['66E', '72'].includes(l.section)) },
  'child abuse': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Protection of Children from Sexual Offences Act, 2012'].filter(l => ['3', '4', '7', '8'].includes(l.section)) },
  'child sexual abuse': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Protection of Children from Sexual Offences Act, 2012'] },
  'dowry': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['498A'].includes(l.section)) },
  'domestic violence': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['498A'].includes(l.section)) },
  'defamation': { category: 'civil', severity: 'low', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['499', '500'].includes(l.section)) },
  'consumer fraud': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Consumer Protection Act, 2019'] },
  'misleading advertisement': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Consumer Protection Act, 2019'].filter(l => ['2(34)'].includes(l.section)) },
  'defective product': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Consumer Protection Act, 2019'].filter(l => ['2(47)'].includes(l.section)) },
  'unfair trade practice': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Consumer Protection Act, 2019'].filter(l => ['2(34)'].includes(l.section)) },
  'money laundering': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Prevention of Money Laundering Act, 2002'] },
  'bribery': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Indian Penal Code, 1860'].filter(l => ['171'].includes(l.section)) },
  'corruption': { category: 'criminal', severity: 'high', legalRefs: INDIAN_LAWS['Prevention of Corruption Act, 1988'] || [] },
  'discrimination': { category: 'constitutional', severity: 'medium', legalRefs: INDIAN_LAWS['Constitution of India'].filter(l => ['14', '15', '16'].includes(l.section)) },
  'right to equality': { category: 'constitutional', severity: 'medium', legalRefs: INDIAN_LAWS['Constitution of India'].filter(l => ['14'].includes(l.section)) },
  'freedom of speech': { category: 'constitutional', severity: 'medium', legalRefs: INDIAN_LAWS['Constitution of India'].filter(l => ['19'].includes(l.section)) },
  'right to life': { category: 'constitutional', severity: 'high', legalRefs: INDIAN_LAWS['Constitution of India'].filter(l => ['21'].includes(l.section)) },
  'intellectual property': { category: 'intellectual_property', severity: 'medium', legalRefs: [] },
  'copyright infringement': { category: 'intellectual_property', severity: 'medium', legalRefs: [] },
  'trademark violation': { category: 'intellectual_property', severity: 'medium', legalRefs: [] },
  'patent infringement': { category: 'intellectual_property', severity: 'medium', legalRefs: [] },
  'company fraud': { category: 'corporate', severity: 'high', legalRefs: INDIAN_LAWS['Companies Act, 2013'].filter(l => ['447', '448'].includes(l.section)) },
  'director negligence': { category: 'corporate', severity: 'medium', legalRefs: INDIAN_LAWS['Companies Act, 2013'].filter(l => ['166'].includes(l.section)) },
  'label violation': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Legal Metrology Act, 2009'] },
  'packaging violation': { category: 'consumer', severity: 'medium', legalRefs: INDIAN_LAWS['Legal Metrology Act, 2009'] },
};

const PUNISHMENTS: Record<string, string> = {
  '420': 'Imprisonment up to 7 years and fine',
  '376': 'Imprisonment for not less than 10 years, may extend to life imprisonment',
  '302': 'Death penalty or life imprisonment',
  '498A': 'Imprisonment up to 3 years and fine',
  '506': 'Imprisonment up to 2 years, or fine, or both',
  '66': 'Imprisonment up to 3 years and fine up to ₹5 lakh',
  '66C': 'Imprisonment up to 3 years and fine up to ₹1 lakh',
  '66D': 'Imprisonment up to 3 years and fine up to ₹1 lakh',
  '67': 'Imprisonment up to 5 years and fine up to ₹10 lakh',
  '447': 'Imprisonment from 6 months to 10 years and fine',
};

function findViolations(example: string): Violation[] {
  const violations: Violation[] = [];
  const lowerExample = example.toLowerCase();
  
  for (const [keyword, data] of Object.entries(KEYWORDS_MAP)) {
    if (lowerExample.includes(keyword)) {
      const violation: Violation = {
        id: uuidv4(),
        example: example.slice(0, 200) + (example.length > 200 ? '...' : ''),
        violationDescription: getViolationDescription(keyword, example),
        legalReferences: data.legalRefs.length > 0 ? data.legalRefs : [{
          act: 'Indian Penal Code, 1860',
          section: 'N/A',
          description: 'General provision',
          fullCitation: 'IPC - General provision',
        }],
        category: data.category,
        severity: data.severity,
        explanation: getExplanation(keyword, example),
        punishment: PUNISHMENTS[data.legalRefs[0]?.section || ''] || 'As per applicable law',
      };
      
      if (!violations.some(v => v.violationDescription === violation.violationDescription)) {
        violations.push(violation);
      }
    }
  }
  
  if (violations.length === 0) {
    violations.push({
      id: uuidv4(),
      example: example.slice(0, 200) + (example.length > 200 ? '...' : ''),
      violationDescription: 'Potential legal issue requiring further analysis',
      legalReferences: [{
        act: 'General Legal Framework',
        section: 'N/A',
        description: 'Requires detailed legal analysis',
        fullCitation: 'General Legal Framework - Review Required',
      }],
      category: 'civil',
      severity: 'low',
      explanation: 'The provided example may have legal implications that require detailed analysis by a legal professional. The content should be reviewed in context of applicable Indian laws.',
    });
  }
  
  return violations;
}

function getViolationDescription(keyword: string, example: string): string {
  const descriptions: Record<string, string> = {
    'theft': 'Theft of property as defined under IPC Section 378',
    'robbery': 'Robbery involving use of force or threat during theft',
    'murder': 'Murder or culpable homicide amounting to murder under IPC',
    'assault': 'Criminal assault causing hurt or grievous hurt',
    'rape': 'Sexual assault or rape under IPC Section 375/376',
    'harassment': 'Harassment potentially violating workplace safety laws',
    'cheating': 'Cheating and fraud under IPC Section 420',
    'fraud': 'Fraudulent activity causing wrongful loss or gain',
    'forgery': 'Forgery of documents under IPC Sections 463-471',
    'extortion': 'Extortion involving threat and property extraction',
    'hacking': 'Unauthorized access to computer systems under IT Act',
    'data breach': 'Data breach compromising personal information',
    'identity theft': 'Identity theft under IT Act Section 66C',
    'phishing': 'Phishing and online fraud under IT Act',
    'child abuse': 'Child abuse under POCSO Act',
    'dowry': 'Dowry-related harassment under IPC Section 498A',
    'consumer fraud': 'Consumer fraud under Consumer Protection Act 2019',
    'defamation': 'Defamation causing harm to reputation',
    'discrimination': 'Discrimination violating constitutional rights',
  };
  
  return descriptions[keyword] || `Potential violation related to: ${keyword}`;
}

function getExplanation(keyword: string, example: string): string {
  const explanations: Record<string, string> = {
    'theft': 'The example describes an act of theft, which is defined under Section 378 of the Indian Penal Code, 1860 as the dishonest taking of movable property out of the possession of any person without that person\'s consent. This constitutes a criminal offense punishable under Section 379 IPC with imprisonment up to 3 years, or fine, or both.',
    'robbery': 'The example indicates robbery, which under Section 390 IPC is either theft or extortion where the offender voluntarily causes or attempts to cause death, hurt, or wrongful restraint. Robbery is a serious non-bailable offense punishable under Section 392 IPC with imprisonment up to 10 years.',
    'murder': 'The example suggests murder or culpable homicide, defined under Sections 299-300 IPC. Murder is the most serious offense under Indian law, punishable under Section 302 IPC with death penalty or life imprisonment.',
    'fraud': 'The example describes fraudulent activity, which may constitute cheating under Section 420 IPC. Cheating involves deceiving any person to deliver property or valuable security. This is a non-bailable offense punishable with imprisonment up to 7 years and fine.',
    'hacking': 'The example indicates hacking or unauthorized access to computer systems, which is punishable under Section 66 of the Information Technology Act, 2000. This includes accessing or securing access to a computer without permission and causing damage.',
    'harassment': 'The example describes harassment, which may violate the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013. It may also constitute criminal intimidation under Section 506 IPC.',
    'child abuse': 'The example indicates potential child abuse, which is a serious offense under the Protection of Children from Sexual Offences (POCSO) Act, 2012. The Act provides stringent punishments for sexual offenses against children.',
    'consumer fraud': 'The example describes potential consumer fraud, which violates the Consumer Protection Act, 2019. This includes unfair trade practices, misleading advertisements, and deficiency in services.',
  };
  
  return explanations[keyword] || `The provided example may constitute a violation under Indian law related to "${keyword}". A detailed legal analysis is recommended to determine the exact nature and extent of the violation, applicable sections, and potential remedies. The content should be reviewed by a qualified legal professional for proper assessment.`;
}

export function generateReport(examples: string[], reportTitle: string): ReportData {
  const allViolations: Violation[] = [];
  
  examples.forEach(example => {
    if (example.trim()) {
      const violations = findViolations(example);
      allViolations.push(...violations);
    }
  });
  
  const categories: Record<LawCategory, number> = {
    criminal: 0,
    civil: 0,
    corporate: 0,
    constitutional: 0,
    consumer: 0,
    cyber: 0,
    environmental: 0,
    labor: 0,
    taxation: 0,
    intellectual_property: 0,
  };
  
  allViolations.forEach(v => {
    categories[v.category]++;
  });
  
  const keyReferences: LegalReference[] = [];
  const seenCitations = new Set<string>();
  
  allViolations.forEach(v => {
    v.legalReferences.forEach(ref => {
      if (!seenCitations.has(ref.fullCitation)) {
        seenCitations.add(ref.fullCitation);
        keyReferences.push(ref);
      }
    });
  });
  
  return {
    id: uuidv4(),
    title: reportTitle || 'Legal Compliance Analysis Report',
    generatedAt: new Date().toISOString(),
    examples,
    violations: allViolations,
    summary: {
      totalViolations: allViolations.length,
      highSeverity: allViolations.filter(v => v.severity === 'high').length,
      mediumSeverity: allViolations.filter(v => v.severity === 'medium').length,
      lowSeverity: allViolations.filter(v => v.severity === 'low').length,
      categories,
      keyReferences: keyReferences.slice(0, 10),
    },
    disclaimer: 'This report is generated by an AI system for informational purposes only and does not constitute legal advice. The analysis is based on pattern matching and may not capture all nuances of Indian law. For accurate legal assessment, please consult a qualified legal professional.',
  };
}
