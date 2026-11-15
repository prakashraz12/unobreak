'use client';

import * as ModalPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';
import { cn } from './cn';
import CrossButton from './cross-button';

const Modal = ModalPrimitive.Root;
const ModalTrigger = ModalPrimitive.Trigger;
const ModalClose = ModalPrimitive.Close;

const ModalOverlay = ({
  className,
  ...props
}: ComponentProps<typeof ModalPrimitive.Overlay>) => (
  <ModalPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className,
    )}
    {...props}
  />
);

const ModalContent = ({
  className,
  overlay = true,
  children,
  ...props
}: ComponentProps<typeof ModalPrimitive.Content> & {
  overlay?: boolean;
}) => (
  <ModalPrimitive.Portal>
    {overlay ? <ModalOverlay /> : null}
    <ModalPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border-[6px] border-[#6b2f00] bg-linear-to-b from-[#571204] via-[#380b02] to-[#1c0501] shadow-[0_0_40px_rgba(0,0,0,0.5)]',
        'data-[state=open]:animate-zoom-in data-[state=closed]:animate-zoom-out',
        className,
      )}
      {...props}
    >
      {children}
      <ModalPrimitive.Close asChild>
        <CrossButton className="absolute right-4 top-4" />
      </ModalPrimitive.Close>
    </ModalPrimitive.Content>
  </ModalPrimitive.Portal>
);

const ModalHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-1 p-6 pb-3 pr-20', className)}
    {...props}
  />
);

const ModalTitle = ({
  className,
  ...props
}: ComponentProps<typeof ModalPrimitive.Title>) => (
  <ModalPrimitive.Title
    className={cn(
      'font-display text-3xl font-black uppercase italic tracking-wide text-[#ffd61f] [paint-order:stroke_fill] [text-shadow:0_3px_0_rgba(107,47,0,0.9)] [-webkit-text-stroke:2px_#6b2f00]',
      className,
    )}
    {...props}
  />
);

const ModalDescription = ({
  className,
  ...props
}: ComponentProps<typeof ModalPrimitive.Description>) => (
  <ModalPrimitive.Description
    className={cn(
      'text-sm font-bold text-white/80 drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]',
      className,
    )}
    {...props}
  />
);

const ModalBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex-1 overflow-y-auto px-6 py-4 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      className,
    )}
    {...props}
  />
);

const ModalFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('mt-auto flex flex-col gap-3 p-6 pt-3', className)}
    {...props}
  />
);

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
};
