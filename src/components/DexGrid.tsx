"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Animal } from "@/types/animal";
import { AnimalCard } from "./AnimalCard";

interface DexGridProps {
  animals: Animal[];
  captureMap?: Map<string, string>;
  captureIdMap?: Map<string, string>;
  onAnimalClick?: (animal: Animal) => void;
  onRemoveDiscovery?: (captureId: string) => void;
}

const COLUMN_BREAKPOINTS = [
  { minWidth: 768, cols: 4 },  // md
  { minWidth: 640, cols: 3 },  // sm
  { minWidth: 0, cols: 2 },
];

function getColumnCount(width: number): number {
  for (const bp of COLUMN_BREAKPOINTS) {
    if (width >= bp.minWidth) return bp.cols;
  }
  return 2;
}

export function DexGrid({
  animals,
  captureMap = new Map(),
  captureIdMap = new Map(),
  onAnimalClick,
  onRemoveDiscovery,
}: DexGridProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(2);

  // Track container width for responsive columns
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setColumnCount(getColumnCount(width));
    });
    observer.observe(list);
    setColumnCount(getColumnCount(list.offsetWidth));
    return () => observer.disconnect();
  }, []);

  // Group animals into rows
  const rows = useMemo(() => {
    const result: Animal[][] = [];
    for (let i = 0; i < animals.length; i += columnCount) {
      result.push(animals.slice(i, i + columnCount));
    }
    return result;
  }, [animals, columnCount]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 200,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={listRef}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${(items[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {items.map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="pb-4"
            >
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
              >
                {rows[virtualRow.index].map((animal) => {
                  const userImage = captureMap.get(animal.id);
                  const captureId = captureIdMap.get(animal.id);
                  return (
                    <AnimalCard
                      key={animal.id}
                      animal={animal}
                      isCaptured={!!userImage}
                      userImage={userImage}
                      captureId={captureId}
                      onClick={() => onAnimalClick?.(animal)}
                      onRemoveDiscovery={onRemoveDiscovery}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
