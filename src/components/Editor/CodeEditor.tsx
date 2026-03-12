import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import type { CodeLanguage } from '../../types';
import { executeCode } from '../../services/api';
import { t } from '../../i18n';
import { getLanguage } from '../../store/noteStore';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: CodeLanguage;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (lang: CodeLanguage) => void;
}

const LANGUAGES: { id: CodeLanguage; name: string }[] = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'java', name: 'Java' },
];

export default function CodeEditor({
  initialCode = '',
  initialLanguage = 'python',
  onCodeChange,
  onLanguageChange,
}: CodeEditorProps) {
  const lang = getLanguage();
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<CodeLanguage>(initialLanguage);
  const [output, setOutput] = useState('');
  const [stderr, setStderr] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);

  const handleCodeChange = (value: string) => {
    setCode(value);
    onCodeChange?.(value);
  };

  const handleLanguageChange = (newLang: CodeLanguage) => {
    setLanguage(newLang);
    onLanguageChange?.(newLang);
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setOutput('');
    setStderr('');
    setExecTime(null);

    try {
      const result = await executeCode(code, language);
      setOutput(result.stdout || '');
      setStderr(result.stderr || '');
      setExecTime(result.execution_time_ms);
    } catch (err) {
      setStderr(err instanceof Error ? err.message : 'Failed to execute code. Check API server connection.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      handleCodeChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as CodeLanguage)}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <button
          onClick={handleRun}
          disabled={isRunning || !code.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {t('editor.run', lang)}
        </button>

        <span className="text-xs text-gray-400 ml-auto">Ctrl+Enter to run</span>
      </div>

      {/* Code area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 relative">
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
            placeholder={language === 'python' ? 'print("Hello, Noton!")' : '// Write your code here...'}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="border-t border-gray-700 bg-gray-950">
          <div className="flex items-center px-3 py-1.5 bg-gray-800 text-xs text-gray-400">
            <span>Output</span>
            {execTime !== null && (
              <span className="ml-auto">{execTime}ms</span>
            )}
          </div>
          <div className="p-3 max-h-40 overflow-auto">
            {output && (
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{output}</pre>
            )}
            {stderr && (
              <pre className="text-sm font-mono text-red-400 whitespace-pre-wrap">{stderr}</pre>
            )}
            {!output && !stderr && !isRunning && (
              <span className="text-sm text-gray-600 italic">No output yet</span>
            )}
            {isRunning && (
              <span className="text-sm text-blue-400 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Running...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
