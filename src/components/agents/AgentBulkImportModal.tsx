'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Agent } from '@/types';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  existingAgents: Agent[];
}

interface ParsedAgentRow {
  rowNumber: number;
  name: string;
  rawMobile: string;
  cleanMobile: string;
  isValid: boolean;
  error?: string;
}

export function AgentBulkImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingAgents,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAgentRow[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── All hooks must be declared before any early return ──────────────────
  const validRows = useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const errorRows = useMemo(() => parsedRows.filter(r => !r.isValid), [parsedRows]);

  const displayedRows = useMemo(() => {
    if (filterMode === 'valid') return validRows;
    if (filterMode === 'errors') return errorRows;
    return parsedRows;
  }, [filterMode, parsedRows, validRows, errorRows]);

  // Helper to normalize mobile to +91XXXXXXXXXX
  const normalizeMobile = (mobile: string): string => {
    const digits = mobile.trim().replace(/\D/g, '');
    if (digits.length < 10) {
      throw new Error('Valid 10-digit mobile number is required');
    }
    return `+91${digits.slice(-10)}`;
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent = [
      'Agent Name,WhatsApp Mobile Number',
      'Vikram Sharma,9820123456',
      'Priya Patel,9876543210',
      'Rajesh Gupta,9123456789',
    ].join('\r\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Royal_Services_Agent_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV Content
  const parseCSVText = (csvText: string): ParsedAgentRow[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    // Parse a CSV line into cells supporting quotes
    const parseLine = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const firstLineCells = parseLine(lines[0]).map(c => c.toLowerCase());
    let startIndex = 0;
    let nameCol = 0;
    let mobileCol = 1;

    // Detect header row
    const isHeader =
      firstLineCells.some(c => c.includes('name') || c.includes('agent')) ||
      firstLineCells.some(c => c.includes('mobile') || c.includes('phone') || c.includes('whatsapp') || c.includes('number'));

    if (isHeader) {
      startIndex = 1;
      const foundName = firstLineCells.findIndex(c => c.includes('name') || c.includes('agent'));
      const foundMobile = firstLineCells.findIndex(
        c => c.includes('mobile') || c.includes('phone') || c.includes('whatsapp') || c.includes('number')
      );
      if (foundName !== -1) nameCol = foundName;
      if (foundMobile !== -1) mobileCol = foundMobile;
    }

    const rows: ParsedAgentRow[] = [];
    const seenNumbersInBatch = new Set<string>();

    for (let i = startIndex; i < lines.length; i++) {
      const rawLine = lines[i];
      if (!rawLine.trim()) continue;

      const cells = parseLine(rawLine);
      const rawName = cells[nameCol] ? cells[nameCol].replace(/^["']|["']$/g, '').trim() : '';
      const rawMobile = cells[mobileCol] ? cells[mobileCol].replace(/^["']|["']$/g, '').trim() : '';

      const rowNum = i + 1;

      // Validation
      if (!rawName) {
        rows.push({
          rowNumber: rowNum,
          name: '',
          rawMobile,
          cleanMobile: '',
          isValid: false,
          error: 'Agent name is required',
        });
        continue;
      }

      let cleanMobile = '';
      try {
        cleanMobile = normalizeMobile(rawMobile);
      } catch {
        rows.push({
          rowNumber: rowNum,
          name: rawName,
          rawMobile,
          cleanMobile: '',
          isValid: false,
          error: 'Invalid 10-digit mobile number',
        });
        continue;
      }

      // Check duplicate within the uploaded CSV batch
      if (seenNumbersInBatch.has(cleanMobile)) {
        rows.push({
          rowNumber: rowNum,
          name: rawName,
          rawMobile,
          cleanMobile,
          isValid: false,
          error: 'number already entered',
        });
        continue;
      }

      // Check duplicate in existing database directory
      const existsInDB = existingAgents.some(a => a.mobile === cleanMobile);
      if (existsInDB) {
        rows.push({
          rowNumber: rowNum,
          name: rawName,
          rawMobile,
          cleanMobile,
          isValid: false,
          error: 'number already entered',
        });
        continue;
      }

      // Valid Row
      seenNumbersInBatch.add(cleanMobile);
      rows.push({
        rowNumber: rowNum,
        name: rawName,
        rawMobile,
        cleanMobile,
        isValid: true,
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setGeneralError('Please upload a valid .csv file.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVText(text);
        if (parsed.length === 0) {
          setGeneralError('The uploaded CSV file is empty or contains no agent data.');
        }
        setParsedRows(parsed);
      } catch (err) {
        console.error('CSV Parsing error', err);
        setGeneralError('Failed to parse CSV file. Please check format.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setGeneralError('');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      setGeneralError('No valid agents to import.');
      return;
    }

    setSubmitting(true);
    setGeneralError('');

    try {
      const payload = validRows.map(r => ({
        name: r.name,
        mobile: r.cleanMobile,
      }));

      const res = await fetch('/api/agents/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk import failed.');
      }

      setImportResult({
        importedCount: data.importedCount,
        skippedCount: data.skippedCount + errorRows.length,
      });

      onSuccess(data.importedCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import agents';
      setGeneralError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Conditionally render nothing when modal is not open
  // (done here AFTER all hooks so Rules of Hooks is satisfied)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">
                Bulk Import Agents via CSV
              </h3>
              <p className="text-xs text-slate-500">
                Quickly register associates into the agent directory from a spreadsheet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Post-Import Success State */}
          {importResult ? (
            <div className="p-6 text-center space-y-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950">
                  Import Completed Successfully!
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Registered <strong>{importResult.importedCount}</strong> new agent(s) into the directory.
                  {importResult.skippedCount > 0 && (
                    <span className="block mt-0.5 text-amber-800">
                      ({importResult.skippedCount} duplicate/invalid rows were automatically skipped)
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Close & View Agent Directory
              </button>
            </div>
          ) : (
            <>
              {/* Instructions & Template Download Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">CSV Formatting Requirements</p>
                  <p className="text-slate-500 text-[11px]">
                    Columns required: <strong>Agent Name</strong> and <strong>WhatsApp Mobile Number</strong> (10 digits).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* General Error Banner */}
              {generalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-700 text-slate-500 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">
                      Click to choose CSV file or drag & drop here
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Supports .csv spreadsheets up to 500 rows</p>
                  </div>
                </div>
              ) : (
                /* Parsed Preview Section */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                      <span className="font-semibold text-slate-800">{file.name}</span>
                      <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Choose Different File</span>
                    </button>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        filterMode === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-lg font-bold">{parsedRows.length}</div>
                      <div className="text-[11px] opacity-80">Total Rows</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('valid')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        filterMode === 'valid'
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <div className="text-lg font-bold text-inherit">{validRows.length}</div>
                      <div className="text-[11px] opacity-90">Ready to Import</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('errors')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        filterMode === 'errors'
                          ? 'bg-rose-700 text-white border-rose-700 font-bold'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <div className="text-lg font-bold text-inherit">{errorRows.length}</div>
                      <div className="text-[11px] opacity-90">Duplicate / Errors</div>
                    </button>
                  </div>

                  {/* Interactive Table Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2 w-12">#</th>
                          <th className="px-3 py-2">Agent Name</th>
                          <th className="px-3 py-2">Mobile Number</th>
                          <th className="px-3 py-2">Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                              No rows match the selected filter.
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map(row => (
                            <tr
                              key={row.rowNumber}
                              className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/50'}
                            >
                              <td className="px-3 py-2 font-mono text-slate-400">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {row.name || <span className="text-rose-400 italic">Empty</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-700">
                                {row.cleanMobile || row.rawMobile}
                              </td>
                              <td className="px-3 py-2">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    {row.error}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Warning on Duplicates */}
                  {errorRows.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        <strong>Note:</strong> Rows flagged with{' '}
                        <code className="px-1 py-0.5 bg-amber-100 rounded text-amber-900 font-mono font-bold">
                          number already entered
                        </code>{' '}
                        will be automatically excluded so you can safely import the remaining{' '}
                        <strong>{validRows.length}</strong> valid agent(s).
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>

            {file && validRows.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#161E42] hover:bg-[#0A192F] rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>
                  {submitting
                    ? 'Importing Agents...'
                    : `Import ${validRows.length} Valid Agent${validRows.length > 1 ? 's' : ''}`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
