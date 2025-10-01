import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ModalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "No",
}: ModalConfirmProps) {
  // Detect theme from body class
  const isDark =
    typeof document !== "undefined" &&
    document.body.classList.contains("theme-dark");

  // Thêm xử lý phím tắt Enter/Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onConfirm();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: isDark ? "rgba(24,28,35,0.55)" : "rgba(0, 0, 0, 0.12)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content-ios"
            initial={{ y: "-30%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-30%", opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#232a36" : "#F7F7FA",
              padding: "24px 0 0 0",
              borderRadius: "14px",
              width: "90%",
              maxWidth: "320px",
              boxShadow: isDark
                ? "0 8px 24px rgba(0,0,0,0.32)"
                : "0 8px 24px rgba(0,0,0,0.12)",
              textAlign: "center",
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              color: isDark ? "#e0e0e0" : "#22223B",
            }}
          >
            <div style={{ padding: "0 20px" }}>
              <h5
                style={{
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  marginBottom: "8px",
                  marginTop: "8px",
                  color: isDark ? "#fff" : "#22223B",
                }}
              >
                {title}
              </h5>
              <div
                style={{
                  fontSize: "1rem",
                  color: isDark ? "#e0e0e0" : "#22223B",
                  marginBottom: "18px",
                }}
              >
                {message}
              </div>
            </div>
            <div
              style={{
                borderTop: isDark ? "1px solid #333a" : "1px solid #E5E5EA",
                display: "flex",
                marginTop: "12px",
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: "none",
                  border: "none",
                  borderRight: isDark ? "1px solid #333a" : "1px solid #E5E5EA",
                  color: isDark ? "#90caf9" : "#007AFF",
                  fontWeight: 400,
                  fontSize: "1.05rem",
                  outline: "none",
                  transition: "background 0.2s",
                  borderBottomLeftRadius: "14px",
                }}
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: "none",
                  border: "none",
                  color: isDark ? "#90caf9" : "#007AFF",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  outline: "none",
                  transition: "background 0.2s",
                  borderBottomRightRadius: "14px",
                }}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}