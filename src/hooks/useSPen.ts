import { useCallback, useRef, useState } from 'react';
import type { Point } from '../types';
import { getSettings } from '../store/noteStore';

export interface SPenState {
  isDrawing: boolean;
  isHovering: boolean;
  isPenInput: boolean;
  pressure: number;
  tiltX: number;
  tiltY: number;
  buttonPressed: boolean;
}

export function useSPen() {
  const [spenState, setSpenState] = useState<SPenState>({
    isDrawing: false,
    isHovering: false,
    isPenInput: false,
    pressure: 0,
    tiltX: 0,
    tiltY: 0,
    buttonPressed: false,
  });

  const currentStrokeRef = useRef<Point[]>([]);
  const settings = getSettings();

  const extractPoint = useCallback(
    (e: PointerEvent | React.PointerEvent): Point => {
      const sensitivity = settings.penPressureSensitivity;
      const rawPressure = e.pressure || 0.5;
      const adjustedPressure = Math.min(1, rawPressure * (1 + sensitivity));

      return {
        x: e.clientX,
        y: e.clientY,
        pressure: adjustedPressure,
        tiltX: settings.penTiltEnabled ? (e.tiltX || 0) : 0,
        tiltY: settings.penTiltEnabled ? (e.tiltY || 0) : 0,
        timestamp: Date.now(),
      };
    },
    [settings.penPressureSensitivity, settings.penTiltEnabled],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const isPen = e.pointerType === 'pen';
      const point = extractPoint(e);
      currentStrokeRef.current = [point];

      setSpenState((prev) => ({
        ...prev,
        isDrawing: true,
        isPenInput: isPen,
        pressure: point.pressure,
        tiltX: point.tiltX,
        tiltY: point.tiltY,
        buttonPressed: (e.buttons & 32) !== 0, // S-Pen button
      }));

      return point;
    },
    [extractPoint],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const point = extractPoint(e);

      if (spenState.isDrawing) {
        currentStrokeRef.current.push(point);
      }

      setSpenState((prev) => ({
        ...prev,
        isHovering: !prev.isDrawing && e.pointerType === 'pen',
        pressure: point.pressure,
        tiltX: point.tiltX,
        tiltY: point.tiltY,
        buttonPressed: (e.buttons & 32) !== 0,
      }));

      return point;
    },
    [extractPoint, spenState.isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    const points = [...currentStrokeRef.current];
    currentStrokeRef.current = [];

    setSpenState((prev) => ({
      ...prev,
      isDrawing: false,
      isHovering: false,
      pressure: 0,
      buttonPressed: false,
    }));

    return points;
  }, []);

  return {
    spenState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    currentStrokeRef,
  };
}
