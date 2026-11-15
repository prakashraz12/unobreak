import ButtonBase, { type ButtonBaseProps } from './button-base';

const CROSS =
  'M-7,-25 Q0,-30 7,-25 L7,-7 L25,-7 Q30,0 25,7 L7,7 L7,25 Q0,30 -7,25 L-7,7 L-25,7 Q-30,0 -25,-7 L-7,-7 Z';

const CrossButton = ({
  label = 'Close',
  ...props
}: Partial<ButtonBaseProps>) => (
  <ButtonBase
    label={label}
    {...props}
    icon={<path d={CROSS} transform="rotate(45)" />}
  />
);

export default CrossButton;
