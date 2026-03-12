import { useState } from 'react';
import { Check, RefreshCw, Server, X } from 'lucide-react';
import type { AppSettings, Language, SubjectDomain } from '../../types';
import { getSettings, resetSettings, updateSettings } from '../../store/noteStore';
import { t } from '../../i18n';
import { checkHealth } from '../../services/api';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
}

const SUBJECTS: { id: SubjectDomain; labelKey: string }[] = [
  { id: 'general', labelKey: 'subject.general' },
  { id: 'math', labelKey: 'subject.math' },
  { id: 'science', labelKey: 'subject.science' },
  { id: 'korean', labelKey: 'subject.korean' },
  { id: 'english', labelKey: 'subject.english' },
  { id: 'history', labelKey: 'subject.history' },
  { id: 'social', labelKey: 'subject.social' },
  { id: 'programming', labelKey: 'subject.programming' },
];

export default function SettingsPanel({ isOpen, onClose, onLanguageChange }: SettingsPanelProps) {
  const [settings, setLocalSettings] = useState<AppSettings>(() => getSettings());
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [saved, setSaved] = useState(false);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(settings);
    if (settings.language) {
      onLanguageChange(settings.language);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = resetSettings();
    setLocalSettings(defaults);
    onLanguageChange(defaults.language);
  };

  const handleCheckApi = async () => {
    setApiStatus('checking');
    try {
      // Temporarily save settings so API URL is used
      updateSettings({ apiServerUrl: settings.apiServerUrl });
      const result = await checkHealth();
      setApiStatus(result.status === 'ok' ? 'ok' : 'error');
    } catch {
      setApiStatus('error');
    }
  };

  if (!isOpen) return null;

  const lang = settings.language;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">{t('settings.title', lang)}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Server URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Server size={14} className="inline mr-1" />
              {t('settings.apiServer', lang)}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={settings.apiServerUrl}
                onChange={(e) => handleChange('apiServerUrl', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="http://localhost:8000"
              />
              <button
                onClick={handleCheckApi}
                disabled={apiStatus === 'checking'}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  apiStatus === 'ok'
                    ? 'bg-green-100 text-green-700'
                    : apiStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {apiStatus === 'checking' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : apiStatus === 'ok' ? (
                  <Check size={16} />
                ) : (
                  'Test'
                )}
              </button>
            </div>
            {apiStatus === 'error' && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ko' ? 'API 서버에 연결할 수 없습니다' : 'Cannot connect to API server'}
              </p>
            )}
            {apiStatus === 'ok' && (
              <p className="text-xs text-green-600 mt-1">
                {lang === 'ko' ? '연결 성공!' : 'Connected successfully!'}
              </p>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.language', lang)}
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value as Language)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Default Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.defaultSubject', lang)}
            </label>
            <select
              value={settings.defaultSubject}
              onChange={(e) => handleChange('defaultSubject', e.target.value as SubjectDomain)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>{t(s.labelKey, lang)}</option>
              ))}
            </select>
          </div>

          {/* Pen Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              S-Pen
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.penPressure', lang)}: {Math.round(settings.penPressureSensitivity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.penPressureSensitivity}
                onChange={(e) => handleChange('penPressureSensitivity', parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{t('settings.penTilt', lang)}</span>
              <button
                onClick={() => handleChange('penTiltEnabled', !settings.penTiltEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.penTiltEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.penTiltEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{t('settings.penHover', lang)}</span>
              <button
                onClick={() => handleChange('penHoverEnabled', !settings.penHoverEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.penHoverEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.penHoverEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto-save */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.autoSave', lang)}
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={settings.autoSaveInterval}
              onChange={(e) => handleChange('autoSaveInterval', parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('settings.reset', lang)}
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {saved ? (
              <span className="flex items-center gap-1"><Check size={14} /> {lang === 'ko' ? '저장됨' : 'Saved'}</span>
            ) : (
              t('settings.save', lang)
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
