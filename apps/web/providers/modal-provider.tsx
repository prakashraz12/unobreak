'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, ModalContent } from '@repo/ui/modal';

interface ModalContextValue {
  isOpen: boolean;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<ReactNode>(null);

  const openModal = useCallback((node: ReactNode) => setContent(node), []);
  const closeModal = useCallback(() => setContent(null), []);

  const value = useMemo(
    () => ({ isOpen: content !== null, openModal, closeModal }),
    [content, openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        open={content !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <ModalContent>{content}</ModalContent>
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export default ModalProvider;
