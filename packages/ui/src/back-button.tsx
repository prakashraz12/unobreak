import ButtonBase, { type ButtonBaseProps } from './button-base';

const BackButton = ({ label = 'Back', ...props }: Partial<ButtonBaseProps>) => (
  <ButtonBase
    label={label}
    {...props}
    icon={
      <path d="M-22,0 L2,-22 L2,-10 L20,-10 Q24,-10 24,-6 L24,6 Q24,10 20,10 L2,10 L2,22 Z" />
    }
  />
);

export default BackButton;
