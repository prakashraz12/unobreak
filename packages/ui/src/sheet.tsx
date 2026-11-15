'use client';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';
import { cn } from './cn';
import CrossButton from './cross-button';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetOverlay = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className,
    )}
    {...props}
  />
);

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const SIDE_CLASSES: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b-[6px] data-[state=open]:animate-sheet-in-top data-[state=closed]:animate-sheet-out-top',
  right:
    'inset-y-0 right-0 h-full w-[min(92vw,400px)] border-l-[6px] data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
  bottom:
    'inset-x-0 bottom-0 border-t-[6px] data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom',
  left: 'inset-y-0 left-0 h-full w-[min(92vw,400px)] border-r-[6px] data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left',
};

const SheetContent = ({
  className,
  side = 'right',
  overlay = true,
  hideClose = false,
  children,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide;

  overlay?: boolean;

  hideClose?: boolean;
}) => (
  <SheetPrimitive.Portal>
    {overlay ? <SheetOverlay /> : null}
    <SheetPrimitive.Content
      className={cn(
        'fixed z-50 flex flex-col border-[#6b2f00] bg-linear-to-b from-[#571204] via-[#380b02] to-[#1c0501] shadow-[0_0_40px_rgba(0,0,0,0.5)]',
        SIDE_CLASSES[side],
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <SheetPrimitive.Close asChild>
          <CrossButton className="absolute right-4 top-4" />
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
);

const SheetHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-1 p-6 pb-3 pr-20', className)}
    {...props}
  />
);

const SheetTitle = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    className={cn(
      'font-display text-3xl font-black uppercase italic tracking-wide text-[#ffd61f] [paint-order:stroke_fill] [text-shadow:0_3px_0_rgba(107,47,0,0.9)] [-webkit-text-stroke:2px_#6b2f00]',
      className,
    )}
    {...props}
  />
);

const SheetDescription = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    className={cn(
      'text-sm font-bold text-white/80 drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]',
      className,
    )}
    {...props}
  />
);

const SheetBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex-1 overflow-y-auto px-6 py-4 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      className,
    )}
    {...props}
  />
);

const SheetFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('mt-auto flex flex-col gap-3 p-6 pt-3', className)}
    {...props}
  />
);

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
};
