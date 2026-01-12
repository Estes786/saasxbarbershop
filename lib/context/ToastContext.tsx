"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { ToastProps } from "@/components/ui/Toast";

interface ToastContextType {
  showToast: (type: "success" | "error" | "warning", message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends Omit<ToastProps, "onClose"> {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const showToast = useCallback((type: "success" | "error" | "warning", message: string, duration?: number) => {
    const id = idCounter;
    setIdCounter((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, [idCounter]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
