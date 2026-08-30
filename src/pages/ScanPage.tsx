import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RotateCcw, ChevronDown, ChevronUp, Upload, Camera, QrCode, Image, Video, ArrowRight, X, Link2, Clipboard, Layers, Layout, Sparkles, Zap, Shield, FileText, Download, Check, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useLabelGuard } from '../context/LabelGuardContext';
import { UploadZone } from '../components/ui/UploadZone';
import { ScanningProgress } from '../components/ui/ScanningProgress';
import { ScoreGauge } from '../components/ui/ScoreGauge';
import { RiskIndicator } from '../components/ui/RiskIndicator';
import { ComplianceCard } from '../components/ui/ComplianceCard';
import { ImageWithBoxes } from '../components/ui/ImageWithBoxes';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { CameraCapture } from '../components/ui/CameraCapture';
import { QRScanner } from '../components/ui/QRScanner';
import { VideoScanner } from '../components/ui/VideoScanner';
import { GalleryPicker } from '../components/ui/GalleryPicker';
import { PDFReportModal } from '../components/ui/PDFReportModal';
import { BatchScanner } from '../components/ui/BatchScanner';
import { URLImport } from '../components/ui/URLImport';
import { ClipboardScanner } from '../components/ui/ClipboardScanner';
import { ComparisonView } from '../components/ui/ComparisonView';
import { TemplateScanner, TemplateType } from '../components/ui/TemplateScanner';
import type { ScanResult } from '../context/LabelGuardContext';

type ScanMode = 'upload' | 'camera' | 'qr' | 'gallery' | 'video' | 'batch' | 'url' | 'clipboard' | 'template' | null;

const FIELD_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  manufacturer: 'Manufacturer',
  manufacturer_address: 'Address',
  net_quantity: 'Net Quantity',
  mrp: 'MRP',
  country_of_origin: 'Origin',
  manufacturing_date: 'Mfg Date',
  best_before: 'Best Before',
  consumer_care: 'Consumer Care',
  unit_sale_price: 'Unit Price',
};

const SCAN_OPTIONS = [
  { 
    id: 'camera' as const, 
    label: 'Take Photo', 
    icon: Camera, 
    description: 'Use camera',
    color: 'from-cyan-500 to-blue-500',
    badge: null
  },
  { 
    id: 'qr' as const, 
    label: 'Scan QR Code', 
    icon: QrCode, 
    description: 'Scan product QR',
    color: 'from-blue-500 to-indigo-500',
    badge: null
  },
  { 
    id: 'gallery' as const, 
    label: 'Gallery', 
    icon: Image, 
    description: 'Recent photos',
    color: 'from-indigo-500 to-purple-500',
    badge: null
  },
  { 
    id: 'video' as const, 
    label: 'Video Scan', 
    icon: Video, 
    description: 'Extract frames',
    color: 'from-purple-500 to-pink-500',
    badge: null
  },
];

const ADVANCED_OPTIONS = [
  { 
    id: 'batch' as const, 
    label: 'Batch Scan', 
    icon: Layers, 
    description: 'Multiple products',
    color: 'from-pink-500 to-rose-500',
    badge: 'Pro'
  },
  { 
    id: 'url' as const, 
    label: 'URL Import', 
    icon: Link2, 
    description: 'From web URL',
    color: 'from-amber-500 to-orange-500',
    badge: 'New'
  },
  { 
    id: 'clipboard' as const, 
    label: 'Clipboard', 
    icon: Clipboard, 
    description: 'From clipboard',
    color: 'from-orange-500 to-red-500',
    badge: null
  },
  { 
    id: 'template' as const, 
    label: 'Templates', 
    icon: Layout, 
    description: 'Product category',
    color: 'from-violet-500 to-purple-500',
    badge: 'New'
  },
];

export const ScanPage = () => {
  const navigate = useNavigate();
  const { currentScan, isScanning, scanProgress, scanStage, performScan, performQRScan, performURLScan, performTextScan, performSampleScan, performBatchScan, selectScan, clearCurrentScan, scanHistory } = useLabelGuard();
  const [files, setFiles] = useState<File[]>([]);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showAllFields, setShowAllFields] = useState(true);
  const [activeScanMode, setActiveScanMode] = useState<ScanMode>(null);
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const handleResetRef = useRef<() => void>(() => {});

  // Reset state when component mounts
  useEffect(() => {
    clearCurrentScan();
    setFiles([]);
    setScanResults([]);
    setIsAnalyzing(false);
  }, []);

  // Keep the user on the scan page when pressing Escape or the browser back button.
  // Closes any open scan modal or returns to the scan options instead of leaving the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showPDFReport) {
        setShowPDFReport(false);
      } else if (showComparison) {
        setShowComparison(false);
      } else if (activeScanMode) {
        setActiveScanMode(null);
      } else if (currentScan && !isScanning && !isAnalyzing) {
        handleResetRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPDFReport, showComparison, activeScanMode, currentScan, isScanning, isAnalyzing]);

  // Intercept browser back navigation while a scan modal / results are active so the
  // user returns to the scan options on /scan instead of being sent to the homepage.
  useEffect(() => {
    if (!activeScanMode && !currentScan) return;
    const handlePopState = () => {
      if (activeScanMode) {
        setActiveScanMode(null);
        history.pushState(null, '', '/scan');
      } else if (currentScan) {
        handleResetRef.current();
        history.pushState(null, '', '/scan');
      }
    };
    history.pushState(null, '', '/scan');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeScanMode, currentScan]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    
    setFiles(selectedFiles);
    setIsAnalyzing(true);
    
    try {
      const results = await performScan(selectedFiles, 'upload');
      setScanResults(results);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScanModeSelect = (mode: ScanMode) => {
    setActiveScanMode(mode);
  };

  const handleCameraCapture = async (file: File) => {
    setFiles([file]);
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const results = await performScan([file], 'camera');
      setScanResults(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQRScan = async (file: File) => {
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const result = await performQRScan(file);
      setScanResults([result]);
    } catch (error) {
      console.error('QR scan failed:', error);
      alert('QR scan failed. Make sure the backend is running and the image contains a readable QR code or label.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoFrames = async (frames: File[]) => {
    setFiles(frames);
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const results = await performScan(frames, 'video');
      setScanResults(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGallerySelect = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const results = await performScan(selectedFiles, 'gallery');
      setScanResults(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchProcess = async (files: File[]) => {
    setFiles(files);
    setIsAnalyzing(true);
    try {
      const results = await performBatchScan(files);
      setScanResults(results);
    } catch (error) {
      console.error('Batch scan failed:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenBatchResult = (result: ScanResult) => {
    setActiveScanMode(null);
    setScanResults([result]);
    selectScan(result);
  };

  const handleURLImport = async (url: string) => {
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const result = await performURLScan(url);
      setScanResults([result]);
    } catch (error) {
      console.error('URL scan failed:', error);
      alert('Failed to scan image from URL. Check the URL and that the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClipboardText = async (data: string) => {
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const result = await performTextScan(data);
      setScanResults([result]);
    } catch (error) {
      console.error('Clipboard text scan failed:', error);
      alert('Failed to analyze clipboard text. Check that the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClipboardImage = async (file: File) => {
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const result = await performQRScan(file);
      setScanResults([result]);
    } catch (error) {
      console.error('Clipboard image scan failed:', error);
      alert('Failed to scan clipboard image. Check that the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTemplateSelect = (template: TemplateType) => {
    setSelectedTemplate(template);
    setActiveScanMode(null);
  };

  const handleTemplateSampleScan = async () => {
    if (!selectedTemplate) return;
    setActiveScanMode(null);
    setIsAnalyzing(true);
    try {
      const result = await performSampleScan(selectedTemplate);
      setScanResults([result]);
    } catch (error) {
      console.error('Template sample scan failed:', error);
      alert('Could not generate the sample label. Make sure the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    clearCurrentScan();
    setActiveScanMode(null);
    setScanResults([]);
    setIsAnalyzing(false);
    setSelectedTemplate(null);
  };
  handleResetRef.current = handleReset;

  const handleBack = () => {
    if (currentScan) {
      handleReset();
    } else {
      navigate('/scan');
    }
  };

  const closeAllModals = () => {
    setActiveScanMode(null);
  };

  const downloadJSON = () => {
    if (!currentScan) return;
    const data = JSON.stringify(currentScan, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-scan-${currentScan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    if (!currentScan) return;
    const passed = currentScan.compliance.checks.filter(c => c.status === 'PASS').length;
    const failed = currentScan.compliance.checks.filter(c => c.status === 'FAIL').length;
    const review = currentScan.compliance.checks.filter(c => c.status === 'REVIEW').length;

    const content = `
LABELGUARD AI - COMPLIANCE ASSESSMENT REPORT
============================================
Generated: ${new Date(currentScan.timestamp).toLocaleString()}
Scan ID: ${currentScan.id}
Scan Type: ${currentScan.scan_type || 'upload'}
${currentScan.barcode ? `Barcode/QR: ${currentScan.barcode}` : ''}

COMPLIANCE SUMMARY
------------------
Score: ${currentScan.compliance.score}/100
Risk Level: ${currentScan.compliance.risk_level}

Checks: ${passed} PASS | ${failed} FAIL | ${review} REVIEW

PRODUCT DETAILS
--------------
${Object.entries(currentScan.product)
  .filter(([_, v]) => v)
  .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
  .join('\n')}

COMPLIANCE CHECKS
-----------------
${currentScan.compliance.checks.map(c => 
  `[${c.status}] ${c.field.replace(/_/g,' ').toUpperCase()}${c.value ? `: ${c.value}` : ' - NOT FOUND'} (${(c.confidence * 100).toFixed(0)}% confidence)
   Legal basis: ${c.law || c.rule_citation || 'Legal Metrology Rules, 2011'}
   Reason: ${c.reason || c.explanation}
   Requirement: ${c.requirement || ''}${c.status === 'FAIL' && c.violation ? `\n   Action needed: ${c.violation}` : ''}`
).join('\n')}

DISCLAIMER
----------
This is an AI-assisted compliance assessment for educational purposes.
Final legal determination rests with an authorized officer.

LabelGuard AI - SIH26034: Packaged Commodity Compliance Scanner
Smart India Hackathon 2026
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-report-${currentScan.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!currentScan) return;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LabelGuard AI Report - ${currentScan.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; }
    .header { text-align: center; margin-bottom: 40px; }
    .score { font-size: 48px; font-weight: bold; color: ${currentScan.compliance.score >= 80 ? '#10b981' : currentScan.compliance.score >= 50 ? '#f59e0b' : '#ef4444'}; }
    .check { padding: 10px; margin: 5px 0; border-radius: 8px; }
    .PASS { background: rgba(16,185,129,0.1); border-left: 4px solid #10b981; }
    .FAIL { background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; }
    .REVIEW { background: rgba(245,158,11,0.1); border-left: 4px solid #f59e0b; }
    .disclaimer { background: rgba(245,158,11,0.1); padding: 15px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LabelGuard AI Report</h1>
    <p>Generated: ${new Date(currentScan.timestamp).toLocaleString()}</p>
    <div class="score">${currentScan.compliance.score}/100</div>
    <p>Risk Level: ${currentScan.compliance.risk_level}</p>
  </div>
  <h2>Product Details</h2>
  <ul>
    ${Object.entries(currentScan.product).filter(([_, v]) => v).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}
  </ul>
  <h2>Compliance Checks</h2>
  ${currentScan.compliance.checks.map(c => `<div class="check ${c.status}"><strong>${c.field.replace(/_/g,' ').toUpperCase()}:</strong> ${c.status} (${(c.confidence * 100).toFixed(0)}% confidence)${c.value ? ` — ${c.value}` : ' — NOT FOUND'}<br><span class="law">Legal basis: ${c.law || c.rule_citation || 'Legal Metrology Rules, 2011'}</span><br><span class="law">Reason: ${c.reason || c.explanation}</span>${c.status === 'FAIL' && c.violation ? `<br><span class="law">Action needed: ${c.violation}</span>` : ''}</div>`).join('')}
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This is an AI-assisted compliance assessment. Final legal determination rests with an authorized officer.
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-report-${currentScan.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    if (!currentScan) return;
    const summary = `LabelGuard AI Scan Result:
Score: ${currentScan.compliance.score}/100
Risk: ${currentScan.compliance.risk_level}
${currentScan.compliance.checks.filter(c => c.status === 'PASS').length} PASS, ${currentScan.compliance.checks.filter(c => c.status === 'FAIL').length} FAIL, ${currentScan.compliance.checks.filter(c => c.status === 'REVIEW').length} REVIEW
${currentScan.compliance.note}`;
    
    navigator.clipboard.writeText(summary);
  };

  const speakResult = () => {
    if (!currentScan) return;
    const text = `This product scored ${currentScan.compliance.score} percent, risk level ${currentScan.compliance.risk_level.toLowerCase()}. ${currentScan.compliance.note}`;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'FAIL': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Scan Product Label
            </h1>
            {selectedTemplate && (
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium">
                {selectedTemplate}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose your scan method to check compliance with Indian Legal Metrology Rules
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!currentScan && !isScanning && !isAnalyzing && (
            <motion.div
              key="scan-options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Upload Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <UploadZone onFilesSelected={handleFilesSelected} maxFiles={3} />
              </motion.div>

              {selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        {selectedTemplate} template selected
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Generate a realistic sample label for this category and scan it in real time.
                      </p>
                    </div>
                    <button
                      onClick={handleTemplateSampleScan}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all"
                    >
                      <Zap className="w-5 h-5" />
                      Generate & Scan Sample
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4 my-10">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-gray-500 text-sm font-medium px-4">or choose another method</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Primary Scan Methods */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
                {SCAN_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleScanModeSelect(option.id)}
                    className={`group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all relative overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />
                    <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <option.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center relative z-10">
                      <span className="text-white font-semibold block mb-1">{option.label}</span>
                      <span className="text-gray-500 text-xs">{option.description}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Advanced Options Toggle */}
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Advanced Options</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Advanced Options */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                  >
                    {ADVANCED_OPTIONS.map((option) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleScanModeSelect(option.id)}
                        className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all relative overflow-hidden`}
                      >
                        {option.badge && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold">
                            {option.badge}
                          </span>
                        )}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <option.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center">
                          <span className="text-white font-medium block text-sm">{option.label}</span>
                          <span className="text-gray-500 text-xs">{option.description}</span>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {(isScanning || isAnalyzing) && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-8 animate-pulse">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <ScanningProgress progress={scanProgress} stage={scanStage} />
            </motion.div>
          )}

          {currentScan && !isScanning && !isAnalyzing && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Header with Back Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">Scan Results</h2>
                      <span className="px-3 py-1 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium uppercase tracking-wide">
                        {currentScan.scan_type || 'upload'}
                      </span>
                      {selectedTemplate && (
                        <span className="px-3 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium uppercase tracking-wide">
                          {selectedTemplate}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(currentScan.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {scanResults.length > 1 && (
                    <button
                      onClick={() => setShowComparison(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      Compare
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Scan
                  </button>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Image */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {currentScan.scan_type === 'qr' ? 'QR Code Data' : 'Label Image'}
                    </h3>
                    {currentScan.scan_type !== 'qr' && (
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBoxes}
                          onChange={(e) => setShowBoxes(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 accent-teal-500"
                        />
                        Show detection boxes
                      </label>
                    )}
                  </div>
                  {currentScan.scan_type === 'qr' ? (
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8 text-center">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-12 h-12 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">Barcode / QR Data:</p>
                      <code className="text-teal-400 font-mono text-lg break-all">{currentScan.barcode || 'N/A'}</code>
                    </div>
                  ) : (
                    <ImageWithBoxes
                      src={currentScan.image_path}
                      boxes={currentScan.ocr_raw}
                      showBoxes={showBoxes}
                    />
                  )}
                </div>

                {/* Right: Score & Risk */}
                <div className="space-y-6">
                  {/* Score Gauge */}
                  <div className="flex flex-col items-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                    <ScoreGauge score={currentScan.compliance.score} size={220} />
                    <div className="mt-6 w-full">
                      <RiskIndicator level={currentScan.compliance.risk_level} />
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-4">
                      {currentScan.compliance.note}
                    </p>
                  </div>

                  {/* Readability / Font-size Analysis */}
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Readability Analysis</h3>
                      </div>
                      {currentScan.readability?.status === 'PASS' ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">LEGIBLE</span>
                      ) : currentScan.readability?.status === 'FAIL' ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">NO TEXT</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">REVIEW</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl bg-white/[0.02] p-3 text-center">
                        <p className="text-2xl font-bold text-white">{currentScan.readability?.min_font_mm?.toFixed(2) ?? '—'}</p>
                        <p className="text-xs text-gray-500">Min font (mm)</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.02] p-3 text-center">
                        <p className="text-2xl font-bold text-white">{currentScan.readability?.avg_font_mm?.toFixed(2) ?? '—'}</p>
                        <p className="text-xs text-gray-500">Avg font (mm)</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      {currentScan.readability?.note || 'Legibility analysis not available for this scan.'}
                    </p>
                    {currentScan.readability && currentScan.readability.lines.length > 0 && (
                      <details className="mt-3 group">
                        <summary className="cursor-pointer text-xs text-cyan-400 hover:text-cyan-300 select-none">
                          View per-line sizes ({currentScan.readability.lines.length})
                        </summary>
                        <div className="mt-3 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {currentScan.readability.lines.map((l, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-gray-400 truncate flex-1 min-w-0">{l.text || '(empty line)'}</span>
                              <span className="text-gray-500 whitespace-nowrap">{l.font_mm?.toFixed(2)} mm</span>
                              <span className={`whitespace-nowrap ${l.readable ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {l.readable ? 'OK' : 'small'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Extracted Fields Table with Confidence */}
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    <button
                      onClick={() => setShowAllFields(!showAllFields)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">Extracted Fields</h3>
                        <span className="text-xs text-gray-500">with confidence levels</span>
                      </div>
                      {showAllFields ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {showAllFields && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="p-4 space-y-3">
                            {Object.entries(currentScan.product).map(([field, value]) => {
                              const check = currentScan.compliance.checks.find(c => c.field === field);
                              return (
                                <div key={field} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">{FIELD_LABELS[field]}</span>
                                      {check && getStatusIcon(check.status)}
                                    </div>
                                    <p className="text-white text-sm truncate" title={value || ''}>
                                      {value || <span className="text-gray-600 italic">Not detected</span>}
                                    </p>
                                  </div>
                                  {check && (
                                    <div className="w-32 flex-shrink-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-500">Confidence</span>
                                        <span className="text-xs text-white font-medium">{(check.confidence * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${
                                            check.confidence >= 0.85 ? 'bg-emerald-500' :
                                            check.confidence >= 0.7 ? 'bg-cyan-500' :
                                            check.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${check.confidence * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Export Buttons */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400">Export Results</h3>
                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowPDFReport(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 hover:border-teal-500/50 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">PDF Report</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadJSON}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <Download size={16} />
                        <span className="text-sm font-medium">JSON</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadTXT}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <FileText size={16} />
                        <span className="text-sm font-medium">TXT</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadHTML}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <FileText size={16} />
                        <span className="text-sm font-medium">HTML</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copySummary}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <Check size={16} />
                        <span className="text-sm font-medium">Copy</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={speakResult}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium">🔊 Hear</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Checks */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Compliance Checks ({currentScan.compliance.checks.filter(c => c.status === 'PASS').length}/{currentScan.compliance.checks.length} Passed)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentScan.compliance.checks.map((check, i) => (
                    <ComplianceCard key={check.field} check={check} index={i} />
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                <p className="text-amber-400 text-sm text-center leading-relaxed">
                  <strong>⚠️ Disclaimer:</strong> This is an AI-assisted compliance assessment for educational screening purposes. 
                  The final legal determination rests with an authorized officer under the Legal Metrology Act, 2009.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Renders */}
        <AnimatePresence>
          {activeScanMode === 'camera' && (
            <CameraCapture onCapture={handleCameraCapture} onClose={closeAllModals} />
          )}
          {activeScanMode === 'qr' && (
            <QRScanner onCapture={handleQRScan} onText={handleClipboardText} onClose={closeAllModals} />
          )}
          {activeScanMode === 'video' && (
            <VideoScanner onFramesExtracted={handleVideoFrames} onClose={closeAllModals} />
          )}
          {activeScanMode === 'gallery' && (
            <GalleryPicker onSelect={handleGallerySelect} onClose={closeAllModals} />
          )}
          {activeScanMode === 'batch' && (
            <BatchScanner onProcess={handleBatchProcess} onOpenResult={handleOpenBatchResult} onClose={closeAllModals} />
          )}
          {activeScanMode === 'url' && (
            <URLImport onImport={handleURLImport} onClose={closeAllModals} />
          )}
          {activeScanMode === 'clipboard' && (
            <ClipboardScanner onCapture={handleClipboardImage} onText={handleClipboardText} onClose={closeAllModals} />
          )}
          {activeScanMode === 'template' && (
            <TemplateScanner onSelect={handleTemplateSelect} onClose={closeAllModals} />
          )}
          {showPDFReport && currentScan && (
            <PDFReportModal result={currentScan} onClose={() => setShowPDFReport(false)} />
          )}
          {showComparison && scanResults.length > 1 && (
            <ComparisonView results={scanResults} onClose={() => setShowComparison(false)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
