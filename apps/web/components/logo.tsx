import Image from 'next/image';
import logo from '../assets/logo/UnoBreak.png';

const Logo = ({ className }: { className?: string }) => (
  <Image src={logo} alt="UnoBreak" priority className={className} />
);

export default Logo;
