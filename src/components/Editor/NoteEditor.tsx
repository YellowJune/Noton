import { useCallback, useState } from 'react';
import { BookOpen, Code2, Loader2, PanelRightOpen, PenTool, Sparkles } from 'lucide-react';
import type { AIResult, CanvasSettings, Notebook, Page, Stroke, TextBlock } from '../../types';
import { t } from '../../i18n';
import { addPage, addStroke, addTextBlock, clearStrokes, getLanguage, removeLastStroke, updatePage } from '../../store/noteStore';
import { analyzeDispatch } from '../../services/api';
import DrawingCanvas from '../Canvas/DrawingCanvas';
import CanvasToolbar from '../Canvas/CanvasToolbar';
import AIResultsPanel from '../AI/AIResultsPanel';
import CodeEditor from './CodeEditor';
import MarkdownEditor from './MarkdownEditor';

interface NoteEditorProps {
  notebook: Notebook;
  onNotebookUpdate: (notebook: Notebook) => void;
}

type EditorMode = 'canvas' | 'markdown' | 'code';

export default function NoteEditor({ notebook, onNotebookUpdate }: NoteEditorProps) {
  const lang = getLanguage();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editorMode, setEditorMode] = useState<EditorMode>('canvas');
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    tool: 'pen',
    color: '#000000',
    width: 2,
    opacity: 1,
  });
  const [undoneStrokes, setUndoneStrokes] = useState<Stroke[]>([]);
  const [markdownContent, setMarkdownContent] = useState('');
  const [aiResults, setAiResults] = useState<AIResult[]>(() => currentPage?.aiResults ?? []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsPanelOpen, setResultsPanelOpen] = useState(false);

  const currentPage: Page | undefined = notebook.pages[currentPageIndex];

  const handleStrokeComplete = useCallback(
    (stroke: Stroke) => {
      if (!currentPage) return;
      addStroke(notebook.id, currentPage.id, stroke);
      setUndoneStrokes([]);
      // Refresh
      const updated = { ...notebook };
      updated.pages = [...notebook.pages];
      updated.pages[currentPageIndex] = {
        ...currentPage,
        strokes: [...currentPage.strokes, stroke],
      };
      onNotebookUpdate(updated);
    },
    [notebook, currentPage, currentPageIndex, onNotebookUpdate],
  );

  const handleUndo = useCallback(() => {
    if (!currentPage || currentPage.strokes.length === 0) return;
    const removed = removeLastStroke(notebook.id, currentPage.id);
    if (removed) {
      setUndoneStrokes((prev) => [...prev, removed]);
      const updated = { ...notebook };
      updated.pages = [...notebook.pages];
      updated.pages[currentPageIndex] = {
        ...currentPage,
        strokes: currentPage.strokes.slice(0, -1),
      };
      onNotebookUpdate(updated);
    }
  }, [notebook, currentPage, currentPageIndex, onNotebookUpdate]);

  const handleRedo = useCallback(() => {
    if (undoneStrokes.length === 0 || !currentPage) return;
    const stroke = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, -1));
    addStroke(notebook.id, currentPage.id, stroke);
    const updated = { ...notebook };
    updated.pages = [...notebook.pages];
    updated.pages[currentPageIndex] = {
      ...currentPage,
      strokes: [...currentPage.strokes, stroke],
    };
    onNotebookUpdate(updated);
  }, [notebook, currentPage, currentPageIndex, undoneStrokes, onNotebookUpdate]);

  const handleClear = useCallback(() => {
    if (!currentPage) return;
    clearStrokes(notebook.id, currentPage.id);
    setUndoneStrokes([]);
    const updated = { ...notebook };
    updated.pages = [...notebook.pages];
    updated.pages[currentPageIndex] = { ...currentPage, strokes: [] };
    onNotebookUpdate(updated);
  }, [notebook, currentPage, currentPageIndex, onNotebookUpdate]);

  const handleAddPage = () => {
    const newPage = addPage(notebook.id);
    if (newPage) {
      const updated = { ...notebook, pages: [...notebook.pages, newPage] };
      onNotebookUpdate(updated);
      setCurrentPageIndex(updated.pages.length - 1);
    }
  };

  const handleMarkdownChange = (content: string) => {
    setMarkdownContent(content);
    if (currentPage) {
      const blocks = currentPage.textBlocks.length > 0
        ? currentPage.textBlocks.map((b, i) => i === 0 ? { ...b, content } : b)
        : [{ id: `tb-${Date.now()}`, x: 0, y: 0, width: 800, height: 600, content, isMarkdown: true }];
      updatePage(notebook.id, currentPage.id, { textBlocks: blocks });
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!currentPage || isAnalyzing) return;

    // Gather content from the page
    const textContent = currentPage.textBlocks.map((b) => b.content).join('\n');
    const codeContent = currentPage.codeBlocks.map((b) => b.code).join('\n');
    const content = [textContent, codeContent, markdownContent].filter(Boolean).join('\n\n');

    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeDispatch(content, notebook.subject, 'text', lang);
      if (result.success) {
        const aiResult: AIResult = {
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: result.result_type,
          content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2),
          data: result.result,
          domain: result.domain,
          timestamp: Date.now(),
        };
        setAiResults((prev) => [...prev, aiResult]);
        // Save to page
        updatePage(notebook.id, currentPage.id, { aiResults: [...aiResults, aiResult] });
        setResultsPanelOpen(true);
      }
    } catch {
      // silently handle - user will see no result added
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentPage, isAnalyzing, markdownContent, notebook, lang, aiResults]);

  const handleInsertAiResult = useCallback((result: AIResult) => {
    if (!currentPage) return;
    // Insert as a text block on the page
    const newBlock: TextBlock = {
      id: `tb-ai-${Date.now()}`,
      x: 20,
      y: 20 + currentPage.textBlocks.length * 120,
      width: 760,
      height: 100,
      content: `[AI - ${t(`subject.${result.domain}`, lang)}]\n${result.content}`,
      isMarkdown: false,
    };
    addTextBlock(notebook.id, currentPage.id, newBlock);
    const updated = { ...notebook };
    updated.pages = [...notebook.pages];
    updated.pages[currentPageIndex] = {
      ...currentPage,
      textBlocks: [...currentPage.textBlocks, newBlock],
    };
    onNotebookUpdate(updated);
  }, [currentPage, notebook, currentPageIndex, onNotebookUpdate, lang]);

  const handleRemoveAiResult = useCallback((resultId: string) => {
    const newResults = aiResults.filter((r) => r.id !== resultId);
    setAiResults(newResults);
    if (currentPage) {
      updatePage(notebook.id, currentPage.id, { aiResults: newResults });
    }
  }, [aiResults, currentPage, notebook]);

  return (
    <div className="flex h-full">
    <div className="flex flex-col flex-1 min-w-0">
      {/* Mode tabs & page navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditorMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              editorMode === 'canvas' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PenTool size={14} />
            {t('editor.canvas', lang)}
          </button>
          <button
            onClick={() => setEditorMode('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              editorMode === 'markdown' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={14} />
            {t('editor.markdown', lang)}
          </button>
          <button
            onClick={() => setEditorMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              editorMode === 'code' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code2 size={14} />
            {t('editor.code', lang)}
          </button>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          {notebook.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPageIndex(i)}
              className={`w-7 h-7 text-xs rounded-md transition-colors ${
                i === currentPageIndex
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={handleAddPage}
            className="w-7 h-7 text-xs rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold"
            title="Add page"
          >
            +
          </button>
        </div>

        {/* AI & Results buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            title={t('ai.analyzeContent', lang)}
          >
            {isAnalyzing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {t('ai.analyzeContent', lang)}
          </button>
          <button
            onClick={() => setResultsPanelOpen(!resultsPanelOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              resultsPanelOpen
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={t('ai.results', lang)}
          >
            <PanelRightOpen size={16} />
            {aiResults.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-purple-500 text-white rounded-full flex items-center justify-center">
                {aiResults.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Canvas toolbar (only in canvas mode) */}
      {editorMode === 'canvas' && (
        <CanvasToolbar
          settings={canvasSettings}
          onSettingsChange={(updates) => setCanvasSettings((prev) => ({ ...prev, ...updates }))}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          canUndo={currentPage ? currentPage.strokes.length > 0 : false}
          canRedo={undoneStrokes.length > 0}
        />
      )}

      {/* Editor content */}
      <div className="flex-1 min-h-0 p-2">
        {editorMode === 'canvas' && currentPage && (
          <DrawingCanvas
            strokes={currentPage.strokes}
            canvasSettings={canvasSettings}
            onStrokeComplete={handleStrokeComplete}
            onUndo={handleUndo}
          />
        )}
        {editorMode === 'markdown' && (
          <MarkdownEditor
            content={markdownContent}
            onChange={handleMarkdownChange}
          />
        )}
        {editorMode === 'code' && (
          <CodeEditor />
        )}

        {/* Inline AI results on canvas */}
        {editorMode === 'canvas' && currentPage && currentPage.textBlocks.filter(b => b.id.startsWith('tb-ai-')).length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 max-h-40 overflow-y-auto space-y-2 pointer-events-auto">
            {currentPage.textBlocks.filter(b => b.id.startsWith('tb-ai-')).map((block) => (
              <div key={block.id} className="bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 shadow-sm">
                <p className="whitespace-pre-wrap line-clamp-3">{block.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* AI Results Panel */}
    <AIResultsPanel
      results={aiResults}
      isOpen={resultsPanelOpen}
      onClose={() => setResultsPanelOpen(false)}
      onInsertToNote={handleInsertAiResult}
      onRemoveResult={handleRemoveAiResult}
      lang={lang}
    />
    </div>
  );
}
