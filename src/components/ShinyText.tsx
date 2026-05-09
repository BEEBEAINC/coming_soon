import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  delay?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
}) => {
  const animationDuration = `${speed}s`;
  const animationDelay = `${delay}s`;
  const animationDirection = direction === 'left' ? 'normal' : 'reverse';
  const animationName = yoyo ? 'shiny-yoyo' : 'shiny-sweep';

  return (
    <span
      className={`inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: disabled
          ? 'none'
          : `${animationName} ${animationDuration} ${animationDelay} linear infinite ${animationDirection}`,
        animationPlayState: 'running',
      }}
      onMouseEnter={(e) => {
        if (pauseOnHover) {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'paused';
        }
      }}
      onMouseLeave={(e) => {
        if (pauseOnHover) {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'running';
        }
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
