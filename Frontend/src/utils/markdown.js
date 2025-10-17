// --- MARKDOWN PARSER ---
export const parseMarkdown = (text) => {
  // First, split by code blocks to isolate them from other markdown parsing
  const parts = text.split(/(```[\s\S]*?```)/g);

  const processedParts = parts.map(part => {
    // If the part is a code block, format it as a styled container
    if (part.startsWith('```')) {
      const lang = part.match(/```(\w*)/)?.[1] || 'code';
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
      const escapedCode = code.replace(/</g, '<').replace(/>/g, '>');
      
      const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

      return `
        <div class="code-block-container bg-gray-800 rounded-lg overflow-hidden my-4 border border-gray-600 shadow-sm">
          <div class="code-header px-4 py-3 flex justify-between items-center text-xs bg-gray-850 border-b border-gray-600">
            <span class="text-gray-300 font-medium">${lang}</span>
            <button class="copy-code-btn flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors bg-transparent border-none cursor-pointer p-1 rounded">
              ${copyIconSVG}
              <span class="copy-text text-xs font-medium">Copy code</span>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-sm leading-6 bg-gray-850"><code class="language-${lang} font-mono text-gray-100">${escapedCode.trim()}</code></pre>
        </div>
      `;
    }

    // For non-code parts, apply other markdown rules
    let html = part
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3 text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold my-3 text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-semibold my-3 text-white">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-red-300 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br />');

    return html;
  });

  return processedParts.join('');
};
