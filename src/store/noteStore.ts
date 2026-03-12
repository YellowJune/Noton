import type {
  AppSettings,
  ChatMessage,
  CodeBlock,
  Folder,
  Language,
  Notebook,
  Page,
  Stroke,
  SubjectDomain,
  TextBlock,
} from '../types';

// ── Default Settings ────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  apiServerUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  language: 'ko',
  penPressureSensitivity: 0.5,
  penTiltEnabled: true,
  penHoverEnabled: true,
  defaultSubject: 'general',
  autoSaveInterval: 30,
};

// ── Storage Keys ────────────────────────────────────────────────────────────

const KEYS = {
  notebooks: 'noton_notebooks',
  folders: 'noton_folders',
  settings: 'noton_settings',
  chatHistory: 'noton_chat_history',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Folder Operations ───────────────────────────────────────────────────────

export function getFolders(): Folder[] {
  return loadJson<Folder[]>(KEYS.folders, []);
}

export function createFolder(name: string, parentId: string | null = null, color = '#6B8AFF'): Folder {
  const folders = getFolders();
  const folder: Folder = {
    id: generateId(),
    name,
    parentId,
    color,
    createdAt: Date.now(),
  };
  folders.push(folder);
  saveJson(KEYS.folders, folders);
  return folder;
}

export function updateFolder(id: string, updates: Partial<Folder>): Folder | null {
  const folders = getFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  folders[idx] = { ...folders[idx], ...updates };
  saveJson(KEYS.folders, folders);
  return folders[idx];
}

export function deleteFolder(id: string): void {
  let folders = getFolders();
  // Delete folder and children
  const toDelete = new Set<string>();
  const collectChildren = (parentId: string) => {
    toDelete.add(parentId);
    folders.filter((f) => f.parentId === parentId).forEach((f) => collectChildren(f.id));
  };
  collectChildren(id);
  folders = folders.filter((f) => !toDelete.has(f.id));
  saveJson(KEYS.folders, folders);

  // Delete notebooks in deleted folders
  let notebooks = getNotebooks();
  notebooks = notebooks.filter((n) => !toDelete.has(n.folderId));
  saveJson(KEYS.notebooks, notebooks);
}

// ── Notebook Operations ─────────────────────────────────────────────────────

export function getNotebooks(): Notebook[] {
  return loadJson<Notebook[]>(KEYS.notebooks, []);
}

export function getNotebook(id: string): Notebook | null {
  return getNotebooks().find((n) => n.id === id) ?? null;
}

export function createNotebook(
  title: string,
  folderId: string,
  subject: SubjectDomain = 'general',
): Notebook {
  const notebooks = getNotebooks();
  const firstPage: Page = {
    id: generateId(),
    notebookId: '',
    pageNumber: 1,
    strokes: [],
    textBlocks: [],
    codeBlocks: [],
    aiResults: [],
  };
  const notebook: Notebook = {
    id: generateId(),
    title,
    folderId,
    subject,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: [{ ...firstPage, notebookId: '' }],
  };
  notebook.pages[0].notebookId = notebook.id;
  notebooks.push(notebook);
  saveJson(KEYS.notebooks, notebooks);
  return notebook;
}

export function updateNotebook(id: string, updates: Partial<Notebook>): Notebook | null {
  const notebooks = getNotebooks();
  const idx = notebooks.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notebooks[idx] = { ...notebooks[idx], ...updates, updatedAt: Date.now() };
  saveJson(KEYS.notebooks, notebooks);
  return notebooks[idx];
}

export function deleteNotebook(id: string): void {
  const notebooks = getNotebooks().filter((n) => n.id !== id);
  saveJson(KEYS.notebooks, notebooks);
}

// ── Page Operations ─────────────────────────────────────────────────────────

export function addPage(notebookId: string): Page | null {
  const notebooks = getNotebooks();
  const idx = notebooks.findIndex((n) => n.id === notebookId);
  if (idx === -1) return null;
  const page: Page = {
    id: generateId(),
    notebookId,
    pageNumber: notebooks[idx].pages.length + 1,
    strokes: [],
    textBlocks: [],
    codeBlocks: [],
    aiResults: [],
  };
  notebooks[idx].pages.push(page);
  notebooks[idx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
  return page;
}

export function updatePage(notebookId: string, pageId: string, updates: Partial<Page>): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx] = { ...notebooks[nbIdx].pages[pgIdx], ...updates };
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function addStroke(notebookId: string, pageId: string, stroke: Stroke): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].strokes.push(stroke);
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function clearStrokes(notebookId: string, pageId: string): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].strokes = [];
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function removeLastStroke(notebookId: string, pageId: string): Stroke | undefined {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return undefined;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return undefined;
  const removed = notebooks[nbIdx].pages[pgIdx].strokes.pop();
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
  return removed;
}

export function addTextBlock(notebookId: string, pageId: string, block: TextBlock): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].textBlocks.push(block);
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function updateTextBlock(notebookId: string, pageId: string, blockId: string, content: string): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  const bIdx = notebooks[nbIdx].pages[pgIdx].textBlocks.findIndex((b) => b.id === blockId);
  if (bIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].textBlocks[bIdx].content = content;
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function addCodeBlock(notebookId: string, pageId: string, block: CodeBlock): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].codeBlocks.push(block);
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

export function updateCodeBlock(notebookId: string, pageId: string, blockId: string, updates: Partial<CodeBlock>): void {
  const notebooks = getNotebooks();
  const nbIdx = notebooks.findIndex((n) => n.id === notebookId);
  if (nbIdx === -1) return;
  const pgIdx = notebooks[nbIdx].pages.findIndex((p) => p.id === pageId);
  if (pgIdx === -1) return;
  const bIdx = notebooks[nbIdx].pages[pgIdx].codeBlocks.findIndex((b) => b.id === blockId);
  if (bIdx === -1) return;
  notebooks[nbIdx].pages[pgIdx].codeBlocks[bIdx] = {
    ...notebooks[nbIdx].pages[pgIdx].codeBlocks[bIdx],
    ...updates,
  };
  notebooks[nbIdx].updatedAt = Date.now();
  saveJson(KEYS.notebooks, notebooks);
}

// ── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return loadJson<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const settings = { ...getSettings(), ...updates };
  saveJson(KEYS.settings, settings);
  return settings;
}

export function resetSettings(): AppSettings {
  saveJson(KEYS.settings, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// ── Chat History ────────────────────────────────────────────────────────────

export function getChatHistory(): ChatMessage[] {
  return loadJson<ChatMessage[]>(KEYS.chatHistory, []);
}

export function addChatMessage(msg: ChatMessage): void {
  const history = getChatHistory();
  history.push(msg);
  // Keep last 100 messages
  if (history.length > 100) history.splice(0, history.length - 100);
  saveJson(KEYS.chatHistory, history);
}

export function clearChatHistory(): void {
  saveJson(KEYS.chatHistory, []);
}

// ── Language Helper ─────────────────────────────────────────────────────────

export function getLanguage(): Language {
  return getSettings().language;
}
