"use client";

interface AddressAvatarProps {
  address: string;
  size?: number;
}

function addressToBytes(address: string): number[] {
  const hex = address.replace("0x", "").toLowerCase();
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16) || 0);
  }
  return bytes;
}

export function AddressAvatar({ address, size = 128 }: AddressAvatarProps) {
  const bytes = addressToBytes(address);
  const gridSize = 5;
  const cellSize = size / gridSize;

  // Derive base hue from first 2 bytes
  const baseHue = ((bytes[0] ?? 0) * 256 + (bytes[1] ?? 0)) % 360;

  // Generate a 5x5 symmetric grid
  const grid: boolean[][] = [];
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      // Only compute left half + center, mirror the rest
      const srcCol = col < 3 ? col : gridSize - 1 - col;
      const byteIndex = (row * 3 + srcCol + 2) % bytes.length;
      grid[row][col] = ((bytes[byteIndex] ?? 0) % 2) === 0;
    }
  }

  const rects: React.ReactNode[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col]) {
        const byteIndex = (row * gridSize + col + 4) % bytes.length;
        const hue = (baseHue + (bytes[byteIndex] ?? 0) * 15) % 360;
        rects.push(
          <rect
            key={`${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={`hsl(${hue}, 60%, 65%)`}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-xl"
      style={{ background: "#1c1b1c" }}
    >
      {rects}
    </svg>
  );
}
