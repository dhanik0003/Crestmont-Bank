import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d9eff] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#2451ff] text-white shadow-[0_14px_40px_rgba(36,81,255,0.34)] hover:bg-[#1d45eb]',
        destructive:
          'bg-[#ff8585] text-[#1a0505] hover:bg-[#ff7474]',
        outline:
          'border border-white/14 bg-white/8 text-white backdrop-blur-md hover:bg-white/12',
        secondary:
          'bg-white/10 text-white hover:bg-white/14',
        ghost:
          'text-[rgba(235,239,247,0.86)] hover:bg-white/10 hover:text-white',
        link:
          'text-[#b9c5ff] underline-offset-4 hover:text-white hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-10 rounded-lg px-4',
        lg: 'h-12 rounded-xl px-7',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
