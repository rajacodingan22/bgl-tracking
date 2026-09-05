import React from "react";

type R = [number, number, number, number];

function Px({ rects, className, size = 16 }: { rects: R[]; className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill="currentColor" />
      ))}
    </svg>
  );
}

/* Gembok + gem (logo) */
export const IGemLock = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [5, 1, 6, 1],
      [4, 2, 1, 3],
      [11, 2, 1, 3],
      [3, 5, 10, 1],
      [3, 6, 1, 8],
      [12, 6, 1, 8],
      [3, 14, 10, 1],
      [7, 8, 2, 1],
      [6, 9, 4, 1],
      [7, 10, 2, 1],
      [7, 11, 2, 1],
    ]}
  />
);

export const IRadar = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [5, 2, 6, 1],
      [3, 3, 2, 2],
      [11, 3, 2, 2],
      [2, 5, 1, 6],
      [13, 5, 1, 6],
      [3, 11, 2, 2],
      [11, 11, 2, 2],
      [5, 13, 6, 1],
      [7, 7, 2, 2],
      [9, 6, 2, 1],
      [11, 5, 2, 1],
    ]}
  />
);

export const IPulse = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [1, 7, 3, 1],
      [4, 6, 1, 1],
      [5, 2, 1, 5],
      [6, 6, 1, 4],
      [7, 9, 2, 1],
      [9, 8, 1, 1],
      [10, 8, 5, 1],
    ]}
  />
);

export const IBot = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [4, 4, 8, 8],
      [6, 2, 1, 2],
      [9, 2, 1, 2],
      [6, 12, 1, 2],
      [9, 12, 1, 2],
      [2, 6, 2, 1],
      [2, 9, 2, 1],
      [12, 6, 2, 1],
      [12, 9, 2, 1],
    ]}
  />
);

export const IBell = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [6, 2, 4, 1],
      [5, 3, 6, 1],
      [4, 4, 8, 4],
      [3, 8, 10, 1],
      [7, 10, 2, 1],
    ]}
  />
);

export const IGear = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [7, 2, 2, 2],
      [7, 12, 2, 2],
      [2, 7, 2, 2],
      [12, 7, 2, 2],
      [5, 5, 6, 6],
      [4, 4, 2, 2],
      [10, 4, 2, 2],
      [4, 10, 2, 2],
      [10, 10, 2, 2],
    ]}
  />
);

export const IUp = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [2, 11, 2, 2],
      [5, 9, 2, 2],
      [8, 7, 2, 2],
      [11, 2, 3, 1],
      [12, 3, 2, 1],
      [13, 4, 1, 1],
      [11, 3, 1, 4],
    ]}
  />
);

export const IDown = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [2, 3, 2, 2],
      [5, 5, 2, 2],
      [8, 7, 2, 2],
      [11, 13, 3, 1],
      [12, 12, 2, 1],
      [13, 11, 1, 1],
      [11, 9, 1, 4],
    ]}
  />
);

export const ICart = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [1, 2, 3, 1],
      [3, 3, 2, 1],
      [4, 4, 10, 1],
      [4, 5, 1, 3],
      [13, 5, 1, 3],
      [5, 8, 9, 1],
      [5, 11, 2, 2],
      [10, 11, 2, 2],
    ]}
  />
);

export const IClock = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [6, 2, 4, 1],
      [4, 3, 2, 1],
      [10, 3, 2, 1],
      [3, 4, 1, 8],
      [12, 4, 1, 8],
      [4, 12, 2, 1],
      [10, 12, 2, 1],
      [6, 13, 4, 1],
      [7, 5, 1, 4],
      [8, 7, 3, 1],
    ]}
  />
);

export const IDiamond = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [7, 5, 2, 2],
      [6, 7, 4, 2],
      [7, 9, 2, 2],
    ]}
  />
);

export const IFlame = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [7, 2, 2, 1],
      [6, 3, 4, 1],
      [5, 4, 6, 3],
      [5, 7, 6, 4],
      [6, 11, 4, 2],
    ]}
  />
);

export const ILinkOut = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [2, 6, 5, 1],
      [2, 6, 1, 8],
      [2, 13, 7, 1],
      [8, 7, 2, 2],
      [10, 5, 2, 2],
      [12, 3, 2, 2],
      [12, 2, 2, 1],
      [13, 3, 1, 2],
    ]}
  />
);

export const ISend = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [2, 7, 9, 2],
      [11, 5, 1, 6],
      [12, 6, 1, 4],
      [13, 7, 1, 2],
    ]}
  />
);

export const IX = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [3, 3, 2, 2],
      [5, 5, 2, 2],
      [7, 7, 2, 2],
      [9, 9, 2, 2],
      [11, 11, 2, 2],
      [11, 3, 2, 2],
      [9, 5, 2, 2],
      [5, 9, 2, 2],
      [3, 11, 2, 2],
    ]}
  />
);

export const ICheck = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [2, 8, 2, 2],
      [4, 10, 2, 2],
      [6, 8, 2, 2],
      [8, 6, 2, 2],
      [10, 4, 2, 2],
      [12, 2, 2, 2],
    ]}
  />
);

export const IPlus = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [7, 3, 2, 10],
      [3, 7, 10, 2],
    ]}
  />
);

export const ITrash = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [6, 2, 4, 1],
      [4, 3, 8, 1],
      [5, 5, 6, 1],
      [5, 6, 1, 6],
      [10, 6, 1, 6],
      [5, 12, 6, 1],
      [7, 7, 1, 4],
      [9, 7, 1, 4],
    ]}
  />
);

export const IZap = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [9, 2, 3, 1],
      [8, 3, 3, 1],
      [7, 4, 3, 1],
      [6, 5, 6, 1],
      [8, 6, 3, 1],
      [7, 7, 3, 1],
      [6, 8, 3, 1],
      [5, 9, 3, 1],
      [4, 10, 3, 1],
    ]}
  />
);

export const IInfo = ({ className, size }: { className?: string; size?: number }) => (
  <Px
    className={className}
    size={size}
    rects={[
      [7, 3, 2, 2],
      [7, 6, 2, 6],
      [6, 12, 4, 1],
    ]}
  />
);
