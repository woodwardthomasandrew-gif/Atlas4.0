import { useCallback, useRef, useState } from "react";

export function useHistoryState<T>(initial: T): [T, (next: T) => void, () => void, () => void] {
  const [value, setValue] = useState(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const update = useCallback((next: T) => { past.current.push(value); future.current = []; setValue(next); }, [value]);
  const undo = useCallback(() => { const previous = past.current.pop(); if (previous === undefined) return; future.current.push(value); setValue(previous); }, [value]);
  const redo = useCallback(() => { const next = future.current.pop(); if (next === undefined) return; past.current.push(value); setValue(next); }, [value]);
  return [value, update, undo, redo];
}
