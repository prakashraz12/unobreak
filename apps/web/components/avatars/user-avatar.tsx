import Avatar from './avatar';
import AvatarFrame from './avatar-frame';
import { AVATARS } from './presets';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
  avatarId: number;
  image?: string | null;
  className?: string;

  unframed?: boolean;
}

const UserAvatar = ({
  avatarId,
  image,
  className,
  unframed,
}: UserAvatarProps) => {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  const content = image ? (
    <img
      src={image}
      alt=""
      referrerPolicy="no-referrer"
      className={cn(
        'block size-20 shrink-0 select-none rounded-md border-2 border-[#6b2f00] object-cover drop-shadow-[0_4px_4px_rgba(0,0,0,0.35)]',
        unframed
          ? className
          : 'size-full rounded-none border-0 drop-shadow-none',
      )}
    />
  ) : avatar ? (
    <Avatar
      avatar={avatar}
      className={cn(
        unframed ? className : 'size-full rounded-none drop-shadow-none',
      )}
    />
  ) : null;

  if (unframed || !content) return content;
  return <AvatarFrame className={className}>{content}</AvatarFrame>;
};

export default UserAvatar;
