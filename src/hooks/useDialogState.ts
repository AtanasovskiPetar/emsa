import { useState } from "react";

interface DialogState<T> {
  isOpen: boolean;
  item: T | undefined;
  open: (item?: T) => void;
  close: () => void;
}

export function useDialogState<T>(): DialogState<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<T | undefined>(undefined);

  function open(newItem?: T) {
    setItem(newItem);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setItem(undefined);
  }

  return { isOpen, item, open, close };
}
