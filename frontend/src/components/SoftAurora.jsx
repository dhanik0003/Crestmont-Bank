import { useMemo } from 'react';
import './SoftAurora.css';

export default function SoftAurora({
  className = '',
  speed = 0.6,
  scale = 1.5,
  brightness = 1,
  color1 = '#f7f7f7',
  color2 = '#2b00ff',
  bandHeight = 0.5,
  bandSpread = 1,
  layerOffset = 0,
  colorSpeed = 1,
}) {
  const style = useMemo(
    () => ({
      '--aurora-speed': String(Math.max(speed, 0.2)),
      '--aurora-scale': String(Math.max(scale, 1)),
      '--aurora-brightness': String(Math.max(brightness, 0.15)),
      '--aurora-color-1': color1,
      '--aurora-color-2': color2,
      '--aurora-band-height': String(Math.max(bandHeight, 0.2)),
      '--aurora-band-spread': String(Math.max(bandSpread, 0.4)),
      '--aurora-layer-offset': `${layerOffset * 80}deg`,
      '--aurora-color-speed': String(Math.max(colorSpeed, 0.25)),
    }),
    [bandHeight, bandSpread, brightness, color1, color2, colorSpeed, layerOffset, scale, speed]
  );

  return (
    <div aria-hidden="true" className={`soft-aurora ${className}`.trim()} style={style}>
      <div className="soft-aurora__base" />
      <div className="soft-aurora__layer soft-aurora__layer--primary" />
      <div className="soft-aurora__layer soft-aurora__layer--secondary" />
      <div className="soft-aurora__vignette" />
    </div>
  );
}
