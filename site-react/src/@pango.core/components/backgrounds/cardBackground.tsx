import type React from 'react';
import { useMemo } from 'react';

interface AnnotationBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

const AnnotationBackground: React.FC<AnnotationBackgroundProps> = ({
  primaryColor = '#4338ca',
  secondaryColor = '#6366f1',
  className = '',
}) => {
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  // Generate random curve path
  const generateCurve = () => {
    const startX = random(-20, 0);
    const startY = random(0, 100);
    const endX = random(100, 120);
    const endY = random(0, 100);
    const cp1x = random(20, 40);
    const cp1y = random(0, 100);
    const cp2x = random(60, 80);
    const cp2y = random(0, 100);

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  // Generate random blob path
  const generateBlob = () => {
    const cx = random(30, 70);
    const cy = random(30, 70);
    const points = [];
    const numPoints = Math.floor(random(5, 8));
    const angleStep = (Math.PI * 2) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const radius = random(10, 25);
      const wobble = random(0.8, 1.2); // Random variation in radius
      const x = cx + Math.cos(angle) * radius * wobble;
      const y = cy + Math.sin(angle) * radius * wobble;
      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }

    return `${points.join(' ')}Z`;
  };

  const elements = useMemo(() => {
    const curves = Array.from({ length: 8 }, () => ({
      path: generateCurve(),
      duration: random(15, 25),
      delay: random(0, 10),
      opacity: random(0.1, 0.3),
      thickness: random(1, 3),
    }));

    const blobs = Array.from({ length: 4 }, () => ({
      path: generateBlob(),
      duration: random(20, 30),
      delay: random(0, 10),
      opacity: random(0.1, 0.2),
      scale: random(0.8, 1.2),
    }));

    return { curves, blobs };
  }, []);

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Gradient definitions */}
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>

        {/* Animated gradient for lines */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white">
            <animate
              attributeName="offset"
              values="-1;2"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="rgba(255,255,255,0.5)">
            <animate
              attributeName="offset"
              values="-0.5;2.5"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="white">
            <animate
              attributeName="offset"
              values="0;3"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Blur filter */}
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Base background */}
      <rect x="0" y="0" width="100%" height="100%" fill="url(#baseGradient)" />

      {/* Curves */}
      <g className="curves">
        {elements.curves.map((curve, index) => (
          <path
            key={`curve-${index}`}
            d={curve.path}
            fill="none"
            stroke="white"
            strokeWidth={curve.thickness}
            strokeOpacity={curve.opacity}
            filter="url(#blur)"
          >
            <animate
              attributeName="strokeOpacity"
              values={`${curve.opacity};${curve.opacity * 1.5};${curve.opacity}`}
              dur={`${curve.duration}s`}
              begin={`${curve.delay}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </g>

      {/* Blobs */}
      <g className="blobs">
        {elements.blobs.map((blob, index) => (
          <g key={`blob-${index}`}>
            <path
              d={blob.path}
              fill="white"
              fillOpacity={blob.opacity}
              filter="url(#blur)"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 2,-2; 0,0"
                dur={`${blob.duration}s`}
                begin={`${blob.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="fillOpacity"
                values={`${blob.opacity};${blob.opacity * 1.5};${blob.opacity}`}
                dur={`${blob.duration}s`}
                begin={`${blob.delay}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}
      </g>

      {/* Overlay gradient for better text contrast */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#overlayGradient)"
      >
        <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </linearGradient>
      </rect>
    </svg>
  );
};

export default AnnotationBackground;