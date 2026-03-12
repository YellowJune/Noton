import type {
  AnalysisResponse,
  ChatResponse,
  CodeExecuteResponse,
  CodeLanguage,
  GraphResponse,
  GraphType,
  MathSolveResponse,
  ResponseFormat,
  SubjectDomain,
} from '../types';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getApiUrl(): string {
  try {
    const stored = localStorage.getItem('noton_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.apiServerUrl) return settings.apiServerUrl;
    }
  } catch {
    // ignore
  }
  return DEFAULT_API_URL;
}

async function apiRequest<T>(path: string, body?: unknown): Promise<T> {
  const url = `${getApiUrl()}${path}`;
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Math ────────────────────────────────────────────────────────────────────

export async function solveMath(
  expression: string,
  solveFor?: string,
  language = 'ko',
): Promise<MathSolveResponse> {
  return apiRequest('/v1/math/solve', {
    expression,
    solve_for: solveFor,
    step_by_step: true,
    language,
  });
}

export async function drawGraph(
  expression?: string,
  data?: Record<string, unknown[]>,
  graphType: GraphType = 'line',
  title = '',
  xRange?: number[],
): Promise<GraphResponse> {
  return apiRequest('/v1/math/graph', {
    expression,
    data,
    graph_type: graphType,
    title,
    x_range: xRange,
  });
}

// ── Code ────────────────────────────────────────────────────────────────────

export async function executeCode(
  code: string,
  language: CodeLanguage = 'python',
  stdin = '',
  timeout = 10,
): Promise<CodeExecuteResponse> {
  return apiRequest('/v1/code/execute', {
    code,
    language,
    stdin,
    timeout,
  });
}

export async function getLanguages(): Promise<{
  languages: { id: string; name: string; extension: string }[];
}> {
  return apiRequest('/v1/code/languages');
}

// ── Analysis ────────────────────────────────────────────────────────────────

export async function analyzeDispatch(
  content: string,
  domainHint?: SubjectDomain,
  responseFormat: ResponseFormat = 'text',
  language = 'ko',
): Promise<AnalysisResponse> {
  return apiRequest('/v1/analyze/dispatch', {
    content,
    domain_hint: domainHint,
    response_format: responseFormat,
    language,
  });
}

export async function analyzeText(
  text: string,
  analysisType = 'summary',
  targetLanguage = 'ko',
): Promise<AnalysisResponse> {
  return apiRequest('/v1/analyze/text', {
    text,
    analysis_type: analysisType,
    target_language: targetLanguage,
  });
}

export async function analyzeData(
  data: Record<string, unknown[]>,
  operation = 'summary',
  outputFormat: ResponseFormat = 'table',
  language = 'ko',
): Promise<{ success: boolean; result: unknown; result_type: string; summary: string; error: string | null }> {
  return apiRequest('/v1/analyze/data', {
    data,
    operation,
    output_format: outputFormat,
    language,
  });
}

// ── Chat ────────────────────────────────────────────────────────────────────

export async function chatContextual(
  message: string,
  context = '',
  domain: SubjectDomain = 'general',
  language = 'ko',
  responseFormat: ResponseFormat = 'text',
): Promise<ChatResponse> {
  return apiRequest('/v1/chat/contextual', {
    message,
    context,
    domain,
    language,
    response_format: responseFormat,
  });
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{
  status: string;
  version: string;
  services: Record<string, string>;
}> {
  return apiRequest('/health');
}

// ── WebSocket ───────────────────────────────────────────────────────────────

export function createWebSocket(
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
): WebSocket | null {
  try {
    const apiUrl = getApiUrl();
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/v1/chat/ws/stream';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data);
      }
    };

    ws.onerror = (err) => {
      if (onError) onError(err);
    };

    return ws;
  } catch {
    return null;
  }
}
