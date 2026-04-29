export function cn(...inputs) {
  const classes = [];

  const visit = (input) => {
    if (!input) {
      return;
    }

    if (typeof input === 'string') {
      classes.push(input);
      return;
    }

    if (Array.isArray(input)) {
      input.forEach(visit);
      return;
    }

    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
    }
  };

  inputs.forEach(visit);

  return classes.join(' ');
}
