import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cn(
        "glass-premium relative w-full max-w-lg overflow-hidden rounded-[3rem] shadow-2xl border-white/20 transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-500",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-0">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="neu-flat hover:neu-convex rounded-2xl h-10 w-10 text-muted-foreground hover:text-red-400 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto px-8 pb-8 pt-4 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };
