"use client";

import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";

export function DraggableSections({
  sectionIds,
  reorderAction,
  children,
}: {
  sectionIds: number[];
  reorderAction: (orderedIds: number[]) => void;
  children: React.ReactNode[];
}) {
  const key = sectionIds.join(",");
  const [order, setOrder] = useState(sectionIds);
  const [orderKey, setOrderKey] = useState(key);
  const dragId = useRef<number | null>(null);

  // Resync local order with the server-truth order whenever the section set changes
  // (add/delete elsewhere) — done during render rather than an effect, per React's
  // guidance for adjusting state from a changed prop.
  if (key !== orderKey) {
    setOrderKey(key);
    setOrder(sectionIds);
  }

  if (sectionIds.length <= 1) {
    return <div className="space-y-4">{children}</div>;
  }

  const nodesById = new Map(sectionIds.map((id, i) => [id, children[i]]));

  function handleDrop(targetId: number) {
    const draggedId = dragId.current;
    dragId.current = null;
    if (draggedId == null || draggedId === targetId) return;
    const next = [...order];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    setOrder(next);
    reorderAction(next);
  }

  return (
    <div className="space-y-4">
      {order.map((id) => (
        <div
          key={id}
          className="flex items-start gap-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(id)}
        >
          <span
            draggable
            onDragStart={(e) => {
              dragId.current = id;
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => (dragId.current = null)}
            className="mt-4 shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">{nodesById.get(id)}</div>
        </div>
      ))}
    </div>
  );
}
