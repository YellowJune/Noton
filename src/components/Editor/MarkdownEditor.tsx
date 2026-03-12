import { useMemo, useState } from 'react';
import { Eye, Pencil } from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

function renderMarkdown(md: string): string {
  let html = md;
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');
  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono">$1</code>');
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
    '<pre class="bg-gray-900 text-green-400 p-4 rounded-lg my-3 overflow-x-auto"><code>$2</code></pre>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank">$1</a>');
  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-1 my-2 text-gray-600 italic">$1</blockquote>');
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-300" />');
  // Line breaks (paragraphs)
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br />');
  html = `<p class="my-2">${html}</p>`;

  return html;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const rendered = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setIsPreview(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
            !isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
            isPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isPreview ? (
          <div
            className="p-4 prose prose-sm max-w-none h-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder="# Write markdown here..."
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
