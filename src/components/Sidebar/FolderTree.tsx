import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderIcon, FolderOpen, MoreVertical, Plus, Trash2 } from 'lucide-react';
import type { Folder, Notebook } from '../../types';
import { t } from '../../i18n';
import { getLanguage } from '../../store/noteStore';

interface FolderTreeProps {
  folders: Folder[];
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  onSelectNotebook: (id: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onCreateNotebook: (folderId: string) => void;
  onDeleteNotebook: (id: string) => void;
}

interface FolderNodeProps {
  folder: Folder;
  folders: Folder[];
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  depth: number;
  onSelectNotebook: (id: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onCreateNotebook: (folderId: string) => void;
  onDeleteNotebook: (id: string) => void;
}

function FolderNode({
  folder,
  folders,
  notebooks,
  selectedNotebookId,
  depth,
  onSelectNotebook,
  onCreateFolder,
  onDeleteFolder,
  onCreateNotebook,
  onDeleteNotebook,
}: FolderNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const children = folders.filter((f) => f.parentId === folder.id);
  const folderNotebooks = notebooks.filter((n) => n.folderId === folder.id);

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button onClick={() => setIsOpen(!isOpen)} className="p-0.5">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen ? (
          <FolderOpen size={16} style={{ color: folder.color }} />
        ) : (
          <FolderIcon size={16} style={{ color: folder.color }} />
        )}
        <span className="text-sm flex-1 truncate ml-1">{folder.name}</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-40">
                <button
                  onClick={() => { onCreateNotebook(folder.id); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
                >
                  <Plus size={14} /> New Notebook
                </button>
                <button
                  onClick={() => { onCreateFolder(folder.id); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
                >
                  <FolderIcon size={14} /> New Subfolder
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { onDeleteFolder(folder.id); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              notebooks={notebooks}
              selectedNotebookId={selectedNotebookId}
              depth={depth + 1}
              onSelectNotebook={onSelectNotebook}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateNotebook={onCreateNotebook}
              onDeleteNotebook={onDeleteNotebook}
            />
          ))}
          {folderNotebooks.map((nb) => (
            <div
              key={nb.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group ${
                selectedNotebookId === nb.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
              onClick={() => onSelectNotebook(nb.id)}
            >
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm flex-1 truncate">{nb.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteNotebook(nb.id); }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-red-500 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  notebooks,
  selectedNotebookId,
  onSelectNotebook,
  onCreateFolder,
  onDeleteFolder,
  onCreateNotebook,
  onDeleteNotebook,
}: FolderTreeProps) {
  const lang = getLanguage();
  const rootFolders = folders.filter((f) => f.parentId === null);
  const rootNotebooks = notebooks.filter(
    (n) => !n.folderId || !folders.some((f) => f.id === n.folderId),
  );

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t('sidebar.folders', lang)}
        </span>
        <button
          onClick={() => onCreateFolder(null)}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          title={t('sidebar.newFolder', lang)}
        >
          <Plus size={14} />
        </button>
      </div>

      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          folders={folders}
          notebooks={notebooks}
          selectedNotebookId={selectedNotebookId}
          depth={0}
          onSelectNotebook={onSelectNotebook}
          onCreateFolder={onCreateFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateNotebook={onCreateNotebook}
          onDeleteNotebook={onDeleteNotebook}
        />
      ))}

      {/* Root-level notebooks (not in any folder) */}
      {rootNotebooks.map((nb) => (
        <div
          key={nb.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer group ${
            selectedNotebookId === nb.id
              ? 'bg-blue-50 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelectNotebook(nb.id)}
        >
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-sm flex-1 truncate">{nb.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteNotebook(nb.id); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-red-500 transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      {rootFolders.length === 0 && rootNotebooks.length === 0 && (
        <p className="px-3 py-4 text-sm text-gray-400 text-center">
          {lang === 'ko' ? '폴더나 노트북을 만들어보세요' : 'Create a folder or notebook to get started'}
        </p>
      )}
    </div>
  );
}
