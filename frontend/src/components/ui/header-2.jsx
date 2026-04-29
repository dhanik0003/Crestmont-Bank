'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { CrestmontLogo } from '@/components/Brand';

const DEFAULT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Support', href: '#support' },
  { label: 'About', href: '#about' },
  { label: 'Security', href: '#security' },
];

export function Header({
  links = DEFAULT_LINKS,
  signInTo = '/login',
  getStartedTo = '/register',
  signInLabel = 'Sign In',
  getStartedLabel = 'Get Started',
}) {
  const [open, setOpen] = React.useState(false);
  const [rubberBanding, setRubberBanding] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  React.useEffect(() => {
    if (!scrolled || open) {
      setRubberBanding(false);
      return undefined;
    }

    setRubberBanding(true);

    const timeoutId = window.setTimeout(() => {
      setRubberBanding(false);
    }, 460);

    return () => window.clearTimeout(timeoutId);
  }, [open, scrolled]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <header
      className={cn(
        'relative isolate mx-auto w-full max-w-6xl transform-gpu border border-white/10 bg-black/55 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-lg transition-[max-width,background-color,box-shadow,border-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:rounded-[1.4rem]',
        {
          'border-white/12 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:max-w-5xl md:-translate-y-0.5':
            scrolled && !open,
          'bg-black/85 backdrop-blur-xl': open,
          'nav-rubber-pop': rubberBanding,
        }
      )}
    >
      <nav
        className={cn(
          'flex h-[4.35rem] w-full items-center justify-between px-5 transition-[height,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:h-[4.1rem]',
          {
            'md:px-4': scrolled,
          }
        )}
      >
        <a
          href="#top"
          className="group flex items-center gap-3 text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          onClick={handleClose}
        >
          <CrestmontLogo size={34} className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transition-none" />
          <span
            className="font-display text-[1rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-white md:text-[1.04rem] motion-reduce:transition-none"
            style={{ color: 'var(--text-primary)' }}
          >
            Crestmont
          </span>
        </a>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              className={buttonVariants({
                variant: 'ghost',
                className: 'rounded-full px-4 text-sm transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5',
              })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link to={signInTo}>{signInLabel}</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link to={getStartedTo}>{getStartedLabel}</Link>
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full md:hidden"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden',
          open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          'fixed inset-x-4 bottom-4 top-[5.35rem] z-50 origin-top rounded-[1.4rem] border border-white/10 bg-black/92 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden',
          open ? 'visible opacity-100 translate-y-0 scale-100' : 'invisible pointer-events-none opacity-0 -translate-y-2 scale-[0.98]'
        )}
      >
        <div
          className={cn(
            'flex h-full w-full flex-col justify-between gap-y-3 p-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: 'ghost',
                  className: 'justify-start rounded-2xl text-base text-white',
                })}
                href={link.href}
                onClick={handleClose}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full rounded-2xl" onClick={handleClose}>
              <Link to={signInTo}>{signInLabel}</Link>
            </Button>
            <Button asChild className="w-full rounded-2xl" onClick={handleClose}>
              <Link to={getStartedTo}>{getStartedLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
