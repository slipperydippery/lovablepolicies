import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

type ToastColorScheme = "success" | "error" | "warning" | "info";

interface ToastItem extends Omit<ToastProps, "onClose" | "id"> {
  id: string | number;
}

interface ToastOptions extends Omit<ToastProps, "colorScheme"> {
  /** Duration in milliseconds before auto-dismiss (default: 5000, set to 0 to disable) */
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
}

type ToastAction =
  | { type: "ADD"; toast: ToastItem }
  | { type: "REMOVE"; id: string | number }
  | { type: "CLEAR" };

let toastCount = 0;

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount;
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case "REMOVE":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    case "CLEAR":
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

// Global state for toasts
const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function addToast(colorScheme: ToastColorScheme, options: ToastOptions) {
  const id = genId();
  const { duration = 5000, ...rest } = options;

  const toast: ToastItem = {
    id,
    colorScheme,
    ...rest,
  };

  dispatch({ type: "ADD", toast });

  if (duration > 0) {
    setTimeout(() => {
      dispatch({ type: "REMOVE", id });
    }, duration);
  }

  return id;
}

function removeToast(id: string | number) {
  dispatch({ type: "REMOVE", id });
}

function clearToasts() {
  dispatch({ type: "CLEAR" });
}

// Toast API
export const toast = {
  success: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return addToast("success", opts);
  },
  error: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return addToast("error", opts);
  },
  warning: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return addToast("warning", opts);
  },
  info: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return addToast("info", opts);
  },
  remove: removeToast,
  clear: clearToasts,
};

// Hook for components
export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    remove: removeToast,
    clear: clearToasts,
  };
}
