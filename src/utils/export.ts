import { ChatMessage, DocumentInfo } from '../types.js';

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportChatAsJson(messages: ChatMessage[], activeDoc?: DocumentInfo | null) {
  const docName = activeDoc ? activeDoc.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'conversation';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `qelomalens_chat_${docName}_${timestamp}.json`;

  const exportData = {
    title: 'QelomaLens Conversation Export',
    exportedAt: new Date().toISOString(),
    document: activeDoc
      ? {
          name: activeDoc.name,
          kind: activeDoc.kind,
          context: activeDoc.detectedContext,
        }
      : null,
    messagesCount: messages.length,
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      source: msg.source,
      confidence: msg.confidence,
      capabilityId: msg.capabilityId,
      citedFacts: msg.citedFacts,
      structuredOutput: msg.structuredOutput,
    })),
  };

  downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
}

export function exportChatAsMarkdown(messages: ChatMessage[], activeDoc?: DocumentInfo | null) {
  const docName = activeDoc ? activeDoc.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'conversation';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `qelomalens_chat_${docName}_${timestamp}.md`;

  let md = `# QelomaLens Conversation Export\n\n`;
  md += `- **Document:** ${activeDoc ? activeDoc.name : 'General Conversation'}\n`;
  if (activeDoc?.detectedContext) {
    md += `- **Context:** ${activeDoc.detectedContext}\n`;
  }
  md += `- **Export Date:** ${new Date().toLocaleString()}\n`;
  md += `- **Total Messages:** ${messages.length}\n\n`;
  md += `---\n\n`;

  messages.forEach((msg, idx) => {
    const roleLabel =
      msg.role === 'user' ? '👤 User' : msg.role === 'ai' ? '🤖 QelomaLens AI' : '⚙️ System';
    md += `### ${idx + 1}. ${roleLabel} _(${msg.timestamp})_\n\n`;
    if (msg.capabilityId) {
      md += `> **Capability Executed:** \`${msg.capabilityId}\`\n\n`;
    }
    md += `${msg.content}\n\n`;

    if (msg.citedFacts && msg.citedFacts.length > 0) {
      md += `**Cited Grounded Facts:**\n`;
      msg.citedFacts.forEach((fact) => {
        md += `- ${fact}\n`;
      });
      md += `\n`;
    }

    if (msg.structuredOutput) {
      md += `<details>\n<summary>Structured Output (JSON)</summary>\n\n\`\`\`json\n${JSON.stringify(
        msg.structuredOutput,
        null,
        2
      )}\n\`\`\`\n</details>\n\n`;
    }

    md += `---\n\n`;
  });

  downloadFile(md, filename, 'text/markdown');
}
