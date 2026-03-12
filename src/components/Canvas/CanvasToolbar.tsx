import {
  Eraser,
  Highlighter,
  MousePointer2,
  Pen,
  Redo2,
  SquareDashedBottom,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import type { CanvasSettings, ToolType } from '../../types';
import { t } from '../../i18n';
import { getLanguage } from '../../store/noteStore';
import ColorPalette from '../ColorPalette';

interface CanvasToolbarProps {
  settings: CanvasSettings;
  onSettingsChange: (settings: Partial<CanvasSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { type: ToolType; icon: typeof Pen; labelKey: string }[] = [
  { type: 'pen', icon: Pen, labelKey: 'toolbar.pen' },
  { type: 'highlighter', icon: Highlighter, labelKey: 'toolbar.highlighter' },
  { type: 'eraser', icon: Eraser, labelKey: 'toolbar.eraser' },
  { type: 'select', icon: MousePointer2, labelKey: 'toolbar.select' },
  { type: 'text', icon: Type, labelKey: 'toolbar.text' },
  { type: 'shape', icon: SquareDashedBottom, labelKey: 'toolbar.shape' },
];

const WIDTH_PRESETS = [1, 2, 4, 6, 8, 12];

export default function CanvasToolbar({
  settings,
  onSettingsChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
  const lang = getLanguage();

  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b border-gray-200 flex-wrap">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
        {TOOLS.map(({ type, icon: Icon, labelKey }) => (
          <button
            key={type}
            onClick={() => onSettingsChange({ tool: type })}
            className={`p-2 rounded-lg transition-colors ${
              settings.tool === type
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={t(labelKey, lang)}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      {/* Color palette */}
      <div className="border-r border-gray-200 pr-2 mr-1">
        <ColorPalette
          color={settings.color}
          onChange={(color) => onSettingsChange({ color })}
        />
      </div>

      {/* Width selector */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
        {WIDTH_PRESETS.map((w) => (
          <button
            key={w}
            onClick={() => onSettingsChange({ width: w })}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              settings.width === w ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'
            }`}
            title={`${w}px`}
          >
            <div
              className="rounded-full bg-current"
              style={{
                width: Math.min(w * 2, 20),
                height: Math.min(w * 2, 20),
                color: settings.color,
              }}
            />
          </button>
        ))}
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-2 mr-1">
        <span className="text-xs text-gray-500">
          {Math.round(settings.opacity * 100)}%
        </span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={settings.opacity}
          onChange={(e) => onSettingsChange({ opacity: parseFloat(e.target.value) })}
          className="w-20 h-1.5 accent-blue-500"
        />
      </div>

      {/* Undo/Redo/Clear */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('toolbar.undo', lang)}
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('toolbar.redo', lang)}
        >
          <Redo2 size={18} />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
          title={t('toolbar.clear', lang)}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
