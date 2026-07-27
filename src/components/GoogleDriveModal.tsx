import React, { useState } from 'react';
import { HardDrive, FileText, Search, Check, ExternalLink, X } from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDriveDocument: (file: { name: string; content: string; kind: 'pdf' | 'docx' | 'png' | 'txt' }) => void;
}

const SAMPLE_DRIVE_DOCUMENTS = [
  {
    id: 'gdrive_001',
    name: 'Q3_2026_Financial_Audit_Report.pdf',
    kind: 'pdf' as const,
    size: '1.4 MB',
    modified: 'Yesterday',
    content: `Q3 2026 Financial Audit & Operational Performance Report
Tenant ID: ENT_DEFAULT_001
Auditor: Deloitte & Touche LLP
Net Revenue: $4,850,000 USD
Gross Operating Margin: 68.4%
EBITDA: $1,920,000 USD
Compliance Verdict: FULLY COMPLIANT
Auditor Notes: All internal financial controls verified. Revenue recognition aligns with ASC 606 standards. No key risk exposure identified.`,
  },
  {
    id: 'gdrive_002',
    name: 'Enterprise_SaaS_Master_Service_Agreement.docx',
    kind: 'docx' as const,
    size: '890 KB',
    modified: '3 days ago',
    content: `MASTER SERVICE AGREEMENT (MSA)
Effective Date: October 1, 2026
Parties: Qeloma Inc. ("Provider") and Apex Global Enterprises ("Client")
Term Length: 36 Months
Total Contract Value: $360,000 USD ($10,000 / month)
Service Level Agreement (SLA): 99.9% Uptime Guarantee
Liability Limit: Capped at 12 months of paid fees ($120,000 USD)
Indemnification: Mutual IP infringement protection and data breach hold-harmless provisions.`,
  },
  {
    id: 'gdrive_003',
    name: 'Vendor_Invoice_Receipt_INV-9821.png',
    kind: 'png' as const,
    size: '420 KB',
    modified: 'Jul 24, 2026',
    content: `VENDOR INVOICE & PROOF OF PAYMENT
Invoice No: INV-9821
Vendor: CloudCompute Services Corp.
Bill To: Qeloma Analytics Dept.
Total Paid: $14,250.00 USD
Payment Method: Wire Transfer (Conf #8891023)
Line Items:
- GPU Cluster Infrastructure Compute (720 hrs): $11,500.00
- Bandwidth Data Egress: $1,750.00
- Enterprise Priority Support SLA: $1,000.00`,
  },
];

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onImportDriveDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('gdrive_001');

  if (!isOpen) return null;

  const filteredDocs = SAMPLE_DRIVE_DOCUMENTS.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportSelected = () => {
    const found = SAMPLE_DRIVE_DOCUMENTS.find((doc) => doc.id === selectedId);
    if (found) {
      onImportDriveDocument({
        name: found.name,
        content: found.content,
        kind: found.kind,
      });
      onClose();
    }
  };

  const handleCustomImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // Derive file name from URL or fallback
    const urlParts = customUrl.split('/');
    const derivedName = urlParts[urlParts.length - 1] || 'Google_Drive_Imported_Doc.txt';

    onImportDriveDocument({
      name: derivedName.endsWith('.pdf') || derivedName.endsWith('.docx') ? derivedName : `${derivedName}.pdf`,
      content: `Google Drive Document Imported from URL: ${customUrl}\n\nContents:\nImported enterprise contract file synced with Google Drive API v3. Synchronized tenant envelope loaded successfully.`,
      kind: 'pdf',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[var(--ol-panel)] border border-[var(--ol-border)] shadow-2xl overflow-hidden flex flex-col font-body">
        {/* Header */}
        <div className="p-4 border-b border-[var(--ol-border)] flex items-center justify-between bg-[var(--ol-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-head font-bold text-sm text-[var(--ol-brand)]">Import from Google Drive</h3>
              <p className="text-[11px] text-[var(--ol-muted)]">Select files from your connected Google Workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-surface)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom URL Import input */}
        <div className="p-4 border-b border-[var(--ol-border)] bg-[var(--ol-surface)]">
          <form onSubmit={handleCustomImport} className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste Google Drive file link (https://drive.google.com/file/d/...)"
              className="flex-1 bg-[var(--ol-panel)] border border-[var(--ol-border)] rounded-xl px-3 py-2 text-xs text-[var(--ol-brand)] placeholder:text-[var(--ol-muted)] focus:outline-hidden focus:border-[var(--ol-accent)]"
            />
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-4 py-2 bg-[var(--ol-accent)] hover:opacity-90 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Import Link
            </button>
          </form>
        </div>

        {/* Filter Search Bar */}
        <div className="p-3 px-4 border-b border-[var(--ol-border)] flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--ol-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Drive files..."
            className="w-full bg-transparent border-none text-xs text-[var(--ol-brand)] placeholder:text-[var(--ol-muted)] focus:outline-hidden"
          />
        </div>

        {/* Document List */}
        <div className="p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
          {filteredDocs.map((doc) => {
            const isSelected = selectedId === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedId(doc.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[var(--ol-accent)] bg-[var(--ol-accent)]/10 shadow-sm'
                    : 'border-[var(--ol-border)] bg-[var(--ol-surface)] hover:border-[var(--ol-muted)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[var(--ol-panel)] border border-[var(--ol-border)] text-[var(--ol-accent)] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[var(--ol-brand)] truncate">{doc.name}</div>
                    <div className="text-[10px] text-[var(--ol-muted)] font-mono flex items-center gap-2 mt-0.5">
                      <span className="uppercase font-bold">{doc.kind}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.modified}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[var(--ol-accent)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--ol-border)] bg-[var(--ol-sidebar)] flex items-center justify-between">
          <div className="text-[11px] text-[var(--ol-muted)] flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Connected to Google Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--ol-border)] text-[var(--ol-muted)] hover:text-[var(--ol-brand)] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportSelected}
              disabled={!selectedId}
              className="px-5 py-2 rounded-xl bg-[var(--ol-accent)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Import Drive Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
