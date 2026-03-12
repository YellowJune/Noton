import { useCallback, useRef, useState } from 'react';
import { Bot, Download, Loader2, Send, Sparkles, Trash2, X } from 'lucide-react';
import type { ChatMessage, SubjectDomain } from '../../types';
import { chatContextual, solveMath, drawGraph } from '../../services/api';
import { addChatMessage, clearChatHistory, getChatHistory, getLanguage } from '../../store/noteStore';
import { t } from '../../i18n';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  domain?: SubjectDomain;
  onInsertToNote?: (content: string, imageBase64?: string) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AIChat({ isOpen, onClose, context = '', domain = 'general', onInsertToNote }: AIChatProps) {
  const lang = getLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatHistory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphImage, setGraphImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);
    setGraphImage(null);

    try {
      // Check if user wants a graph
      const wantsGraph = /그래프|graph|plot|그려/i.test(userMsg.content);
      // Check if user wants math solving
      const wantsMath = /풀어|solve|계산|calculate|=|방정식|equation/i.test(userMsg.content);

      let reply = '';
      let extraData: unknown = null;

      if (wantsMath) {
        // Try math solving first
        const mathResult = await solveMath(userMsg.content, undefined, lang);
        if (mathResult.success) {
          reply = mathResult.steps.join('\n\n');
          if (mathResult.solution) {
            reply += `\n\n${lang === 'ko' ? '답' : 'Answer'}: ${
              Array.isArray(mathResult.solution) ? mathResult.solution.join(', ') : mathResult.solution
            }`;
          }
          if (mathResult.graph_base64) {
            setGraphImage(mathResult.graph_base64);
          }
          extraData = mathResult;
        }
      }

      if (wantsGraph && !graphImage) {
        // Extract expression from message
        const exprMatch = userMsg.content.match(/(?:y\s*=\s*)?([x\d\s+\-*/^()sincostan.]+)/i);
        if (exprMatch) {
          const graphResult = await drawGraph(exprMatch[1]);
          if (graphResult.success && graphResult.image_base64) {
            setGraphImage(graphResult.image_base64);
          }
        }
      }

      if (!reply) {
        // Fall back to contextual chat
        const chatResult = await chatContextual(userMsg.content, context, domain, lang);
        reply = chatResult.reply;
        extraData = chatResult.data;

        // If there are suggestions, append them
        if (chatResult.suggestions?.length) {
          reply += `\n\n${lang === 'ko' ? '추천 질문:' : 'Suggestions:'}\n${chatResult.suggestions.map((s) => `- ${s}`).join('\n')}`;
        }
      }

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        data: extraData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      addChatMessage(assistantMsg);
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: lang === 'ko'
          ? 'API 서버에 연결할 수 없습니다. 설정에서 API 서버 주소를 확인해주세요.'
          : 'Cannot connect to API server. Please check the API server URL in settings.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      addChatMessage(errorMsg);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [input, isLoading, context, domain, lang, graphImage]);

  const handleClear = () => {
    setMessages([]);
    clearChatHistory();
    setGraphImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <span className="font-semibold">{t('ai.chat', lang)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              {lang === 'ko' ? 'AI에게 질문해보세요!' : 'Ask AI a question!'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="px-3 py-2 whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && onInsertToNote && (
                <button
                  onClick={() => onInsertToNote(msg.content)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 w-full border-t border-gray-200 rounded-b-xl transition-colors"
                >
                  <Download size={10} />
                  {t('ai.insertToNote', lang)}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Graph image */}
        {graphImage && (
          <div className="flex justify-start">
            <div className="max-w-[90%] p-2 bg-gray-100 rounded-xl">
              <img
                src={`data:image/png;base64,${graphImage}`}
                alt="Graph"
                className="rounded-lg max-w-full"
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-gray-100 rounded-xl rounded-bl-md">
              <Loader2 size={16} className="animate-spin text-blue-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.askPlaceholder', lang)}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-24"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
