import type React from 'react';
interface CircuitBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CircuitBackground: React.FC<CircuitBackgroundProps> = ({
  primaryColor = '#4338ca',
  secondaryColor = '#6366f1',
  className = '',
  style,
}) => {
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  // Generate a circuit path between two points with right angles
  const generateCircuitPath = (startX: number, startY: number, endX: number, endY: number): string => {
    const midX = startX + (endX - startX) * random(0.25, 0.75);
    return `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
  };

  // Generate nodes positions
  const nodes = Array.from({ length: 8 }, () => ({
    x: random(10, 90),
    y: random(10, 90),
    size: random(2, 4)
  }));

  // Generate connecting paths
  const paths = nodes.flatMap((node, i) => {
    return Array.from({ length: 2 }, (_, j) => {
      const nextNode = nodes[(i + j + 1) % nodes.length];
      const path = generateCircuitPath(
        node.x,
        node.y,
        nextNode.x,
        nextNode.y
      );

      const dx = Math.abs(nextNode.x - node.x);
      const dy = Math.abs(nextNode.y - node.y);
      const length = dx + dy;

      return { path, length };
    });
  });

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`baseGradient-${primaryColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>

        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#baseGradient-${primaryColor})`} />

      {/* Circuit paths */}
      <g className="circuit-paths" style={{ opacity: 0.5 }}>
        {paths.map((path, index) => (
          <g key={`path-${index}`}>
            {/* Base path */}
            <path
              d={path.path}
              fill="none"
              stroke={primaryColor}
              strokeWidth="0.7"
              strokeOpacity="0.3"
            />
            {/* Animated overlay */}
            <path
              d={path.path}
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.5"
              strokeDasharray={`${path.length / 4} ${path.length * 3 / 4}`}
            >
              <animate
                attributeName="stroke-dashoffset"
                values={`${path.length};-${path.length}`}
                dur={`${random(2, 4)}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}
      </g>

      {/* Circuit nodes */}
      <g className="circuit-nodes">
        {nodes.map((node, index) => (
          <g key={`node-${index}`}>
            {/* Outer glow */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size * 1.5}
              fill={primaryColor}
              fillOpacity="0.3"
              filter="url(#glow)"
            >
              <animate
                attributeName="r"
                values={`${node.size * 1.5};${node.size * 2};${node.size * 1.5}`}
                dur={`${random(2, 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Main node */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size * 0.5}
              fill="white"
              fillOpacity="0.8"
            >
              <animate
                attributeName="fillOpacity"
                values="0.8;1;0.8"
                dur={`${random(1, 2)}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </g>

      {/* Additional small dots for texture */}
      {Array.from({ length: 20 }).map((_, index) => (
        <circle
          key={`dot-${index}`}
          cx={random(0, 100)}
          cy={random(0, 100)}
          r={0.5}
          fill="white"
          fillOpacity={0.3}
        >
          <animate
            attributeName="fillOpacity"
            values="0.3;0.5;0.3"
            dur={`${random(2, 4)}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Gradient overlay for text contrast */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill={`url(#overlay-${primaryColor})`}
      >
        <linearGradient id={`overlay-${primaryColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="black" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.4" />
        </linearGradient>
      </rect>
    </svg>
  );
};

export default CircuitBackground;