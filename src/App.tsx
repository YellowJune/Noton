import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  FolderPlus,
  Menu,
  MessageSquare,
  NotebookPen,
  PanelLeftClose,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { Folder, Language, Notebook } from './types';
import { t } from './i18n';
import {
  createFolder,
  createNotebook,
  deleteFolder,
  deleteNotebook,
  getFolders,
  getLanguage,
  getNotebook,
  getNotebooks,
} from './store/noteStore';
import FolderTree from './components/Sidebar/FolderTree';
import NoteEditor from './components/Editor/NoteEditor';
import AIChat from './components/AI/AIChat';
import SettingsPanel from './components/Settings/SettingsPanel';

function App() {
  const [lang, setLang] = useState<Language>(() => getLanguage());
  const [folders, setFolders] = useState<Folder[]>(() => getFolders());
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => getNotebooks());
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const selectedNotebook = selectedNotebookId ? getNotebook(selectedNotebookId) : null;

  // Refresh data from localStorage
  const refresh = useCallback(() => {
    setFolders(getFolders());
    setNotebooks(getNotebooks());
  }, []);

  // Auto-refresh when selectedNotebook changes
  useEffect(() => {
    refresh();
  }, [selectedNotebookId, refresh]);

  const handleCreateFolder = (parentId: string | null) => {
    const name = prompt(t(lang === 'ko' ? 'folder.untitled' : 'folder.untitled', lang));
    if (!name) return;
    createFolder(name, parentId);
    refresh();
  };

  const handleDeleteFolder = (id: string) => {
    if (!confirm(t('confirm.delete', lang))) return;
    deleteFolder(id);
    refresh();
  };

  const handleCreateNotebook = (folderId: string) => {
    const title = prompt(t(lang === 'ko' ? 'notebook.untitled' : 'notebook.untitled', lang));
    if (!title) return;
    const nb = createNotebook(title, folderId);
    refresh();
    setSelectedNotebookId(nb.id);
  };

  const handleDeleteNotebook = (id: string) => {
    if (!confirm(t('confirm.delete', lang))) return;
    deleteNotebook(id);
    if (selectedNotebookId === id) setSelectedNotebookId(null);
    refresh();
  };

  const handleNotebookUpdate = useCallback(
    () => {
      refresh();
    },
    [refresh],
  );

  const handleCreateQuickNotebook = () => {
    const firstFolder = folders[0];
    const title = prompt(t('notebook.untitled', lang)) || t('notebook.untitled', lang);
    const nb = createNotebook(title, firstFolder?.id || '');
    refresh();
    setSelectedNotebookId(nb.id);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <NotebookPen size={22} className="text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-gray-800">{t('app.title', lang)}</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5">{t('app.subtitle', lang)}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
          <button
            onClick={handleCreateQuickNotebook}
            className="flex items-center gap-1.5 flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} />
            {t('sidebar.newNotebook', lang)}
          </button>
          <button
            onClick={() => handleCreateFolder(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            title={t('sidebar.newFolder', lang)}
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Folder/notebook tree */}
        <div className="flex-1 overflow-y-auto">
          <FolderTree
            folders={folders}
            notebooks={notebooks}
            selectedNotebookId={selectedNotebookId}
            onSelectNotebook={setSelectedNotebookId}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onCreateNotebook={handleCreateNotebook}
            onDeleteNotebook={handleDeleteNotebook}
          />
        </div>

        {/* Sidebar Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={14} />
            {t('sidebar.settings', lang)}
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              chatOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={t('ai.chat', lang)}
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Menu size={18} />
            </button>
          )}
          {selectedNotebook && (
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={16} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-700 truncate">
                {selectedNotebook.title}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                {t(`subject.${selectedNotebook.subject}`, lang)}
              </span>
            </div>
          )}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 rounded-lg transition-colors ${
              chatOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={t('ai.chat', lang)}
          >
            <MessageSquare size={18} />
          </button>
        </div>

        {/* Editor or empty state */}
        <div className="flex-1 min-h-0">
          {selectedNotebook ? (
            <NoteEditor
              key={selectedNotebook.id}
              notebook={selectedNotebook}
              onNotebookUpdate={handleNotebookUpdate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <NotebookPen size={64} className="text-gray-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">
                {lang === 'ko' ? '노트북을 선택하세요' : 'Select a Notebook'}
              </h2>
              <p className="text-sm text-gray-300 mb-6 max-w-sm">
                {lang === 'ko'
                  ? '왼쪽 사이드바에서 노트북을 선택하거나 새로 만들어보세요'
                  : 'Choose a notebook from the sidebar or create a new one'}
              </p>
              <button
                onClick={handleCreateQuickNotebook}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium text-sm transition-colors shadow-lg shadow-blue-200"
              >
                <Plus size={16} />
                {t('sidebar.newNotebook', lang)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat panel */}
      <AIChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        domain={selectedNotebook?.subject}
      />

      {/* Settings modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLanguageChange={(newLang: Language) => setLang(newLang)}
      />
    </div>
  );
}

export default App;
