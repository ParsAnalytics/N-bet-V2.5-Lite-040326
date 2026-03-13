
import React, { useRef, useEffect, useState } from 'react';
import { PenTool } from 'lucide-react';
import { Stroke, Point } from '../types';

interface SignaturePadProps {
  onSave: (dataUrl: string, strokes: Stroke[]) => void;
  onClose: () => void;
}

interface PointWithTime extends Point {
  t: number;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<PointWithTime[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // High-end signature logic refs
  const lastPointRef = useRef<PointWithTime | null>(null);
  const lastMidPointRef = useRef<Point | null>(null);
  const lastWidthRef = useRef<number>(2.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Use the measured dimensions from rect
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.fillStyle = '#f9fafb';
          ctx.fillRect(0, 0, rect.width, rect.height);
          ctx.strokeStyle = '#000044';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctxRef.current = ctx;
        }
      }
    };

    // Small timeout to ensure modal animations are finished and layout is settled
    const timeoutId = setTimeout(initCanvas, 100);
    
    window.addEventListener('resize', initCanvas);
    
    const getPos = (e: MouseEvent | TouchEvent): PointWithTime => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        t: Date.now()
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      isDrawingRef.current = true;
      lastPointRef.current = pos;
      lastMidPointRef.current = { x: pos.x, y: pos.y };
      lastWidthRef.current = 3.0;
      currentStrokeRef.current = [pos];
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || !ctxRef.current || !lastPointRef.current || !lastMidPointRef.current) return;
      e.preventDefault();
      
      const pos = getPos(e);
      const ctx = ctxRef.current;

      // 1. Calculate Velocity & Distance
      const dist = Math.sqrt(Math.pow(pos.x - lastPointRef.current.x, 2) + Math.pow(pos.y - lastPointRef.current.y, 2));
      const time = pos.t - lastPointRef.current.t;
      const velocity = time > 0 ? dist / time : 0;

      // 2. Velocity-Based Width (Variable thickness)
      // Faster = Thinner, Slower = Thicker
      const targetWidth = Math.max(0.8, Math.min(4.5, 4.5 - velocity * 1.5));
      // Smooth width transition to avoid jitters in thickness
      const currentWidth = lastWidthRef.current * 0.7 + targetWidth * 0.3;
      
      // 3. Midpoint Quadratic Bezier Smoothing
      const midPoint = {
        x: (lastPointRef.current.x + pos.x) / 2,
        y: (lastPointRef.current.y + pos.y) / 2
      };

      ctx.beginPath();
      ctx.lineWidth = currentWidth;
      // Start from the last midpoint, curve through the last point, end at the current midpoint
      ctx.moveTo(lastMidPointRef.current.x, lastMidPointRef.current.y);
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midPoint.x, midPoint.y);
      ctx.stroke();

      // Update refs for next segment
      lastPointRef.current = pos;
      lastMidPointRef.current = midPoint;
      lastWidthRef.current = currentWidth;
      currentStrokeRef.current.push(pos);
    };

    const handleEnd = () => {
      if (isDrawingRef.current) {
        const storageStroke: Point[] = currentStrokeRef.current.map(p => ({ x: p.x, y: p.y }));
        setStrokes(prev => [...prev, storageStroke]);
      }
      isDrawingRef.current = false;
      lastPointRef.current = null;
      lastMidPointRef.current = null;
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', initCanvas);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      const rect = canvas.getBoundingClientRect();
      ctxRef.current.fillStyle = '#f9fafb';
      ctxRef.current.fillRect(0, 0, rect.width, rect.height);
      setStrokes([]);
      currentStrokeRef.current = [];
      lastWidthRef.current = 3.0;
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas && strokes.length > 0) {
      // Export at original resolution for better quality in documents
      onSave(canvas.toDataURL('image/png'), strokes);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-1 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl w-full max-w-4xl p-2 sm:p-6 border border-gray-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-2 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
            <PenTool size={20} className="text-blue-600 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest text-gray-800">Islak İmza Paneli</h3>
            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Bézier & Velocity Stabilizer V2</p>
          </div>
        </div>
        
        <div className="relative border-2 sm:border-4 border-gray-100 rounded-[20px] sm:rounded-[28px] bg-gray-50 mb-3 h-[50vh] sm:h-[550px] overflow-hidden shadow-inner group touch-none">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair w-full h-full touch-none"
          />
          <div className="absolute bottom-3 right-4 text-[8px] sm:text-[9px] font-black text-gray-300 uppercase pointer-events-none select-none group-hover:opacity-50 transition-opacity">
            İmza Alanı
          </div>
        </div>

        <div className="flex justify-between gap-2 sm:gap-3">
          <button 
            onClick={clear} 
            className="px-4 sm:px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Temizle
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 sm:px-6 py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-500 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
            >
              İptal
            </button>
            <button 
              onClick={save} 
              className="px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center gap-2"
            >
              Tamamla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
