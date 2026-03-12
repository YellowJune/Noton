import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasSettings, Point, Stroke, ToolType } from '../../types';

interface DrawingCanvasProps {
  strokes: Stroke[];
  canvasSettings: CanvasSettings;
  onStrokeComplete: (stroke: Stroke) => void;
  onUndo: () => void;
  width?: number;
  height?: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DrawingCanvas({
  strokes,
  canvasSettings,
  onStrokeComplete,
  onUndo,
  width = 1200,
  height = 800,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Redraw all strokes
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw strokes
    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
  }, [strokes]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
      ctx.globalCompositeOperation = 'multiply';
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = stroke.opacity;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const pressure = curr.pressure || 0.5;
      const baseWidth = stroke.tool === 'highlighter' ? stroke.width * 3 : stroke.width;
      ctx.lineWidth = baseWidth * pressure;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawCurrentStroke = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const points = currentPointsRef.current;
    if (points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (canvasSettings.tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
      ctx.globalCompositeOperation = 'multiply';
    } else if (canvasSettings.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = canvasSettings.opacity;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.strokeStyle = canvasSettings.tool === 'eraser' ? '#ffffff' : canvasSettings.color;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const pressure = curr.pressure || 0.5;
      const baseWidth = canvasSettings.tool === 'highlighter'
        ? canvasSettings.width * 3
        : canvasSettings.width;
      ctx.lineWidth = baseWidth * pressure;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [canvasSettings]);

  const getCanvasPoint = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, tiltX: 0, tiltY: 0, timestamp: Date.now() };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      timestamp: Date.now(),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (canvasSettings.tool === 'select' || canvasSettings.tool === 'text' || canvasSettings.tool === 'shape') return;
    e.preventDefault();
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    currentPointsRef.current = [point];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [canvasSettings.tool, getCanvasPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setCursorPos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });

    if (!isDrawingRef.current) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    currentPointsRef.current.push(point);
    drawCurrentStroke();
  }, [getCanvasPoint, drawCurrentStroke]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    const points = [...currentPointsRef.current];
    currentPointsRef.current = [];

    // Clear overlay
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }

    if (points.length >= 2) {
      const stroke: Stroke = {
        id: generateId(),
        points,
        color: canvasSettings.color,
        width: canvasSettings.width,
        tool: canvasSettings.tool as ToolType,
        opacity: canvasSettings.opacity,
      };
      onStrokeComplete(stroke);
    }
  }, [canvasSettings, onStrokeComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo]);

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden border border-gray-200">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setCursorPos(null)}
      />
      {/* Hover cursor indicator */}
      {cursorPos && !isDrawingRef.current && (
        <div
          className="absolute rounded-full border border-gray-400 pointer-events-none opacity-50"
          style={{
            left: `${(cursorPos.x / width) * 100}%`,
            top: `${(cursorPos.y / height) * 100}%`,
            width: canvasSettings.width * 2,
            height: canvasSettings.width * 2,
            transform: 'translate(-50%, -50%)',
            backgroundColor: canvasSettings.tool === 'eraser' ? '#fff' : canvasSettings.color,
          }}
        />
      )}
    </div>
  );
}
