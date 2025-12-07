import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-red-500 rounded-full transition-all duration-300 ${
            isActive ? 'animate-pulse' : 'h-2 opacity-30'
          }`}
          style={{
            height: isActive ? `${Math.max(20, Math.random() * 40)}px` : '8px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
