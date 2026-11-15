import ButtonBase, { type ButtonBaseProps } from './button-base';

const gearPath = (teeth = 8, outer = 26, inner = 19, hole = 8) => {
  const step = (Math.PI * 2) / teeth;
  const points = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return [
      [inner, a - step * 0.3],
      [outer, a - step * 0.18],
      [outer, a + step * 0.18],
      [inner, a + step * 0.3],
    ];
  })
    .flat()
    .map(
      ([r, a]) =>
        `${(r! * Math.cos(a!)).toFixed(2)},${(r! * Math.sin(a!)).toFixed(2)}`,
    );
  return `M${points.join(' L')} Z M${hole},0 A${hole},${hole} 0 1,0 ${-hole},0 A${hole},${hole} 0 1,0 ${hole},0 Z`;
};

const GEAR = gearPath();

const SettingsButton = ({
  label = 'Settings',
  ...props
}: Partial<ButtonBaseProps>) => (
  <ButtonBase
    label={label}
    {...props}
    icon={<path d={GEAR} fillRule="evenodd" />}
  />
);

export default SettingsButton;
