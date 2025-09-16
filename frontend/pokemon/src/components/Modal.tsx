import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalIOSProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  children?: React.ReactNode; // <-- Thêm dòng này
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: "-20%" },
  visible: { opacity: 1, y: "0%" },
  exit: { opacity: 0, y: "-20%" },
};

const ModalIOS: React.FC<ModalIOSProps> = ({
  isOpen,
  onClose,
  title = "Title Here",
  message = "Alert description with auto layout!",
  children, // <-- Thêm dòng này
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-ios-backdrop"
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="modal-ios-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F7F7FA",
              padding: "24px 0 0 0",
              borderRadius: "14px",
              width: "90%",
              maxWidth: "320px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              textAlign: "center",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            }}
          >
            <div style={{ padding: "0 20px" }}>
              <h5 style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                marginBottom: "8px",
                marginTop: "8px",
                color: "#22223B"
              }}>
                {title}
              </h5>
              <div style={{
                fontSize: "1rem",
                color: "#22223B",
                marginBottom: "18px"
              }}>
                {message}
              </div>
              {children /* <-- Thêm dòng này để render nội dung bên trong modal */}
            </div>
            <div style={{
              borderTop: "1px solid #E5E5EA",
              display: "flex",
              marginTop: "12px"
            }}>
            
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalIOS;