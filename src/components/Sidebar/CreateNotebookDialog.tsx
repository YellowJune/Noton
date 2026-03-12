import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Language, SubjectDomain } from '../../types';
import { t } from '../../i18n';

interface CreateNotebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, subject: SubjectDomain) => void;
  lang: Language;
}

const SUBJECTS: { id: SubjectDomain; icon: string }[] = [
  { id: 'general', icon: '📓' },
  { id: 'math', icon: '📐' },
  { id: 'science', icon: '🔬' },
  { id: 'physics', icon: '⚛️' },
  { id: 'chemistry', icon: '🧪' },
  { id: 'biology', icon: '🧬' },
  { id: 'earth_science', icon: '🌍' },
  { id: 'korean', icon: '📝' },
  { id: 'english', icon: '🔤' },
  { id: 'history', icon: '📜' },
  { id: 'social', icon: '📊' },
  { id: 'programming', icon: '💻' },
];

export default function CreateNotebookDialog({
  isOpen,
  onClose,
  onCreate,
  lang,
}: CreateNotebookDialogProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectDomain>('general');

  if (!isOpen) return null;

  const handleCreate = () => {
    const name = title.trim() || t('notebook.untitled', lang);
    onCreate(name, subject);
    setTitle('');
    setSubject('general');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" />
            <h3 className="text-base font-semibold text-gray-800">
              {t('sidebar.newNotebook', lang)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('notebook.enterTitle', lang)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Subject selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t('notebook.selectSubject', lang)}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SUBJECTS.map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => setSubject(id)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs transition-all ${
                    subject === id
                      ? 'bg-blue-50 border-2 border-blue-400 text-blue-700 font-medium shadow-sm'
                      : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="truncate w-full text-center">
                    {t(`subject.${id}`, lang)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('notebook.cancel', lang)}
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
          >
            {t('notebook.create', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
