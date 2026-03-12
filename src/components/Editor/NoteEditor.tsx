import { useCallback, useState } from 'react';
import { BookOpen, Code2, PenTool } from 'lucide-react';
import type { CanvasSettings, Notebook, Page, Stroke } from '../../types';
import { t } from '../../i18n';
import { addPage, addStroke, clearStrokes, getLanguage, removeLastStroke, updatePage } from '../../store/noteStore';
import DrawingCanvas from '../Canvas/DrawingCanvas';
import CanvasToolbar from '../Canvas/CanvasToolbar';
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

  return (
    <div className="flex flex-col h-full">
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
      </div>
    </div>
  );
}
