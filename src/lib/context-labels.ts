const CONTEXT_LABELS: Record<string, string> = {
  'resume-cv': '📄 Resume / CV',
  'legal-contract': '📜 Legal Contract',
  'medical-record': '⚕️ Medical Record',
  'financial-statement': '💰 Financial Statement',
  'invoice-receipt': '🧾 Invoice / Receipt',
  'general-document': '📁 General Document',
};

export function friendlyContextLabel(context?: string): string {
  if (!context) return CONTEXT_LABELS['general-document'];
  return CONTEXT_LABELS[context] || context;
}
