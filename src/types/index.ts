// ── Core Types ──────────────────────────────────────────────────────────────

export type SubjectDomain =
  | 'math' | 'science' | 'physics' | 'chemistry' | 'biology'
  | 'earth_science' | 'korean' | 'english' | 'history'
  | 'social' | 'programming' | 'general';

export type CodeLanguage = 'python' | 'javascript' | 'cpp' | 'c' | 'java';

export type ResponseFormat = 'text' | 'table' | 'graph' | 'json' | 'latex' | 'html';

export type GraphType = 'line' | 'bar' | 'scatter' | 'pie' | 'histogram' | 'area' | 'function';

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'select' | 'text' | 'shape';

export type Language = 'ko' | 'en';

// ── Note & Folder ───────────────────────────────────────────────────────────

export interface Notebook {
  id: string;
  title: string;
  folderId: string;
  subject: SubjectDomain;
  createdAt: number;
  updatedAt: number;
  pages: Page[];
}

export interface Page {
  id: string;
  notebookId: string;
  pageNumber: number;
  strokes: Stroke[];
  textBlocks: TextBlock[];
  codeBlocks: CodeBlock[];
  aiResults: AIResult[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: number;
}

// ── Drawing ─────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: ToolType;
  opacity: number;
}

export interface CanvasSettings {
  tool: ToolType;
  color: string;
  width: number;
  opacity: number;
}

// ── Text & Code ─────────────────────────────────────────────────────────────

export interface TextBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  isMarkdown: boolean;
}

export interface CodeBlock {
  id: string;
  code: string;
  language: CodeLanguage;
  output: string;
  isRunning: boolean;
}

// ── AI ──────────────────────────────────────────────────────────────────────

export interface AIResult {
  id: string;
  type: ResponseFormat;
  content: string;
  data: unknown;
  domain: SubjectDomain;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: unknown;
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  apiServerUrl: string;
  language: Language;
  penPressureSensitivity: number;
  penTiltEnabled: boolean;
  penHoverEnabled: boolean;
  defaultSubject: SubjectDomain;
  autoSaveInterval: number;
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface MathSolveResponse {
  success: boolean;
  expression: string;
  latex: string;
  solution: string | string[] | Record<string, string> | null;
  steps: string[];
  graph_base64: string | null;
  error: string | null;
}

export interface GraphResponse {
  success: boolean;
  image_base64: string;
  image_format: string;
  error: string | null;
}

export interface CodeExecuteResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  return_code: number;
  execution_time_ms: number;
  error: string | null;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  suggestions: string[];
  result_type: ResponseFormat;
  data: unknown;
  error: string | null;
}

export interface AnalysisResponse {
  success: boolean;
  domain: SubjectDomain;
  result: unknown;
  result_type: ResponseFormat;
  error: string | null;
  metadata: Record<string, unknown>;
}
