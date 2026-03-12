import { Download, Sparkles, Trash2, X } from 'lucide-react';
import type { AIResult, Language } from '../../types';
import { t } from '../../i18n';

interface AIResultsPanelProps {
  results: AIResult[];
  isOpen: boolean;
  onClose: () => void;
  onInsertToNote: (result: AIResult) => void;
  onRemoveResult: (resultId: string) => void;
  lang: Language;
}

export default function AIResultsPanel({
  results,
  isOpen,
  onClose,
  onInsertToNote,
  onRemoveResult,
  lang,
}: AIResultsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <span className="font-semibold text-sm">{t('ai.results', lang)}</span>
          {results.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">
              {results.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {results.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-xs text-gray-400">{t('ai.noResults', lang)}</p>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.id}
              className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Result header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {t(`subject.${result.domain}`, lang)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {result.type}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveResult(result.id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title={t('ai.remove', lang)}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Result content */}
              <div className="px-3 py-2">
                {result.type === 'graph' && result.data && typeof result.data === 'string' ? (
                  <img
                    src={`data:image/png;base64,${result.data}`}
                    alt="Graph"
                    className="rounded-lg w-full"
                  />
                ) : (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-6">
                    {result.content}
                  </p>
                )}
              </div>

              {/* Insert button */}
              <div className="px-3 py-2 border-t border-gray-200">
                <button
                  onClick={() => onInsertToNote(result)}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors justify-center"
                >
                  <Download size={12} />
                  {t('ai.insertToNote', lang)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
