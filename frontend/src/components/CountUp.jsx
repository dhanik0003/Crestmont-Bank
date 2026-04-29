import { useCallback, useEffect, useRef } from 'react';

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  startCounting,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const frameRef = useRef(null);
  const timeoutRef = useRef(null);

  const shouldStart = startCounting ?? startWhen;

  const getDecimalPlaces = (num) => {
    const str = String(num);
    if (!str.includes('.')) {
      return 0;
    }

    const decimals = str.split('.')[1];
    return Number.parseInt(decimals, 10) === 0 ? 0 : decimals.length;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (value) => {
      const formattedNumber = new Intl.NumberFormat('en-US', {
        useGrouping: !!separator,
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(value);

      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const initialValue = direction === 'down' ? to : from;
    const finalValue = direction === 'down' ? from : to;

    node.textContent = formatValue(shouldStart ? initialValue : finalValue);

    if (!shouldStart) {
      return undefined;
    }

    const totalDuration = Math.max(duration, 0) * 1000;
    let cancelled = false;

    const startAnimation = () => {
      if (cancelled) {
        return;
      }

      if (typeof onStart === 'function') {
        onStart();
      }

      if (totalDuration === 0) {
        node.textContent = formatValue(finalValue);
        if (typeof onEnd === 'function') {
          onEnd();
        }
        return;
      }

      const startedAt = performance.now();
      const step = (timestamp) => {
        if (cancelled) {
          return;
        }

        const elapsed = timestamp - startedAt;
        const progress = Math.min(elapsed / totalDuration, 1);
        const currentValue = initialValue + (finalValue - initialValue) * easeOutCubic(progress);

        node.textContent = formatValue(currentValue);

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(step);
        } else {
          node.textContent = formatValue(finalValue);
          if (typeof onEnd === 'function') {
            onEnd();
          }
        }
      };

      frameRef.current = window.requestAnimationFrame(step);
    };

    timeoutRef.current = window.setTimeout(startAnimation, Math.max(delay, 0) * 1000);

    return () => {
      cancelled = true;
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, direction, duration, formatValue, from, onEnd, onStart, shouldStart, to]);

  return <span className={className} ref={ref} />;
}
