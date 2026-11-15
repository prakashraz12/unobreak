'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Sheet, SheetContent } from '@repo/ui/sheet';
import { usePathname } from 'next/navigation';
import { useGame } from '../context/game-context';
import { useOptionalFriendRequests } from './friend-request-provider';
import SettingsSheet from '../components/ui/settings-sheet';
import Users from '../components/users-sheet/users';
import UsersSheetTrigger from '../components/users-sheet/users-trigger';
import ChatMessageToaster from '../components/chat-message-toast';
import { useFriendRequests } from './friend-request-provider';

const SHEETS = {
  settings: { side: 'right', content: <SettingsSheet />, hideClose: false },
  users: { side: 'left', content: <Users />, hideClose: true },
} satisfies Record<
  string,
  {
    side: 'top' | 'right' | 'bottom' | 'left';
    content: ReactNode;
    hideClose?: boolean;
  }
>;

export type SheetId = keyof typeof SHEETS;

interface SheetContextValue {
  isOpen: boolean;
  openSheet: (id: SheetId) => void;
  closeSheet: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [activeSheet, setActiveSheet] = useState<SheetId | null>(null);
  const { inGame } = useGame();
  const friendRequests = useOptionalFriendRequests();
  const pendingCount =
    (friendRequests?.pendingCount ?? 0) + (friendRequests?.unreadTotal ?? 0);
  const pathname = usePathname();
  const isLanding = pathname === '/' || pathname === '/auth';

  const openSheet = useCallback((id: SheetId) => setActiveSheet(id), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const value = useMemo(
    () => ({ isOpen: activeSheet !== null, openSheet, closeSheet }),
    [activeSheet, openSheet, closeSheet],
  );

  return (
    <SheetContext.Provider value={value}>
      {children}
      {activeSheet === null && !inGame && !isLanding && (
        <UsersSheetTrigger
          count={pendingCount}
          onClick={() => openSheet('users')}
        />
      )}
      <ChatMessageToaster />
      <Sheet
        open={activeSheet !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side={activeSheet ? SHEETS[activeSheet].side : 'right'}
          hideClose={activeSheet ? SHEETS[activeSheet].hideClose : false}
        >
          {activeSheet ? SHEETS[activeSheet].content : null}
        </SheetContent>
      </Sheet>
    </SheetContext.Provider>
  );
};

export const useSheet = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within SheetProvider');
  }
  return context;
};

export default SheetProvider;
