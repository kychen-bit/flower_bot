import React, { useState, useRef, useEffect } from 'react';
import { Sun, Compass } from 'lucide-react';

interface RadialControlProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  sunAngle?: number; 
}

export const RadialControl: React.FC<RadialControlProps> = ({ value, onChange, label, sunAngle }) => {
  const [isDragging, setIsDragging] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  const calculateAngle = (clientX: number, clientY: number) => {
    if (!controlRef.current) return;
    const rect = controlRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let angleRad = Math.atan2(deltaY, deltaX);
    
    let angleDeg = angleRad * (180 / Math.PI) + 90; 
    if (angleDeg < 0) angleDeg += 360;
    
    onChange(Math.round(angleDeg));
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    calculateAngle(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div 
        ref={controlRef}
        className="relative w-56 h-56 rounded-full flex items-center justify-center cursor-pointer select-none touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Background Dial UI */}
        <div className="absolute inset-0 rounded-full bg-slate-50 border border-slate-200 shadow-inner-soft"></div>
        
        {/* Degree Ticks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-slate-300"
            style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-106px)` }}
          ></div>
        ))}

        {/* Center Information */}
        <div className="absolute flex flex-col items-center z-10 bg-white w-24 h-24 rounded-full shadow-soft justify-center border border-slate-100">
            <span className="text-2xl font-bold text-nature-text">{value}°</span>
            <div className="flex items-center gap-1 text-nature-muted text-[10px] uppercase font-bold tracking-wide mt-1">
                <Compass size={10} />
                <span>{label}</span>
            </div>
        </div>

        {/* Robot Platform Indicator (The Green Knob) */}
        <div 
            className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
             style={{ transform: `translate(-50%, -50%) rotate(${value}deg)` }}
        >   
            {/* The Pointer */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-nature-primary rounded-full shadow-lg border-2 border-white z-20 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            {/* Connection Line */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-nature-primary to-transparent opacity-50"></div>
        </div>

        {/* Sun Indicator (Orbiting) */}
        {sunAngle !== undefined && (
             <div 
                className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none z-0"
                style={{ transform: `translate(-50%, -50%) rotate(${sunAngle}deg)` }}
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                     <div className="bg-yellow-50 p-1.5 rounded-full border border-yellow-200 shadow-sm animate-pulse">
                        <Sun size={20} className="text-yellow-500 fill-yellow-500" />
                     </div>
                     <span className="text-[9px] font-medium text-yellow-600 bg-white px-1.5 py-0.5 rounded-full shadow-sm mt-1 border border-yellow-100">阳光</span>
                </div>
            </div>
        )}
      </div>
      
      <p className="text-xs text-nature-muted mt-4 font-medium bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
        拖动绿色旋钮调整平台朝向
      </p>
    </div>
  );
};