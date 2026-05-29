import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext.jsx";

const ToastHost = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-20 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-full bg-onyx px-4 py-2 text-sm text-white shadow-lg"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastHost;
