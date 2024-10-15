import React, { useState, useRef, useEffect } from 'react';

interface Strike {
  strike: number;
  delta: number;
}

interface StrikeRuleProps {
  strikes: Strike[];
  initialStrike?: number;
  onStrikeChange: (strike: Strike) => void;
  leftValues?: number;
  rightValues?: number;
}

const StrikeRule: React.FC<StrikeRuleProps> = ({
  strikes,
  initialStrike,
  onStrikeChange,
  leftValues = 14,
  rightValues = 14,
}) => {
  const [selectedStrike, setSelectedStrike] = useState(
    initialStrike || strikes[0].strike,
  );
  const [tempSelectedStrike, setTempSelectedStrike] = useState(selectedStrike);
  const ruleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialStrike && strikes.some((s) => s.strike === initialStrike)) {
      setSelectedStrike(initialStrike);
      setTempSelectedStrike(initialStrike);
    }
  }, [initialStrike, strikes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ruleRef.current && (isDragging || e.type === 'click')) {
      const rect = ruleRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const index = Math.round(percentage * (strikes.length - 1));
      const newStrike = strikes[index].strike;
      setTempSelectedStrike(newStrike);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove as any);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [isDragging]);

  const handleConfirm = () => {
    const selectedStrikeObject = strikes.find(
      (s) => s.strike === tempSelectedStrike,
    )!;
    setSelectedStrike(tempSelectedStrike);
    onStrikeChange(selectedStrikeObject);
  };

  const getVisibleStrikes = () => {
    const selectedIndex = strikes.findIndex(
      (s) => s.strike === tempSelectedStrike,
    );
    const start = Math.max(0, selectedIndex - leftValues);
    const end = Math.min(strikes.length - 1, selectedIndex + rightValues);
    return strikes.slice(start, end + 1);
  };

  const visibleStrikes = getVisibleStrikes();

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="relative w-full h-16 bg-gray-100 rounded-md cursor-pointer"
        ref={ruleRef}
        onClick={handleMouseMove}
        onMouseDown={handleMouseDown}
      >
        <div className="flex justify-between h-full px-2">
          {visibleStrikes.map(({ strike }) => (
            <div
              key={strike}
              className="flex flex-col items-center justify-end"
            >
              {strike % 10 === 0 && (
                <div className="text-xs mb-1">{strike}</div>
              )}
              <div className={`w-0.5 ${strike % 10 === 0 ? 'h-4' : 'h-2'} bg-gray-400`}></div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative w-full h-12">
        <div
          className="absolute top-4 w-1 h-full bg-blue-500 transform -translate-x-1/2 flex items-start justify-center text-white font-bold cursor-grab active:cursor-grabbing"
          style={{
            left: `${
              (visibleStrikes.findIndex(
                (s) => s.strike === tempSelectedStrike,
              ) /
                (visibleStrikes.length - 1)) *
              100
            }%`,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-blue-500 text-2xl">
            ▲
          </div>
          <div className="w-16 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            {tempSelectedStrike.toFixed(2)}
          </div>
        </div>
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        onClick={handleConfirm}
      >
        Confirm
      </button>
    </div>
  );
};

export default StrikeRule;
