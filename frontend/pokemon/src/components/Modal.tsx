import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../assets/css/Modal.css";

interface ModalIOSProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  children?: React.ReactNode;
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
  title = "Thao tác",
  message = "",
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-ios-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.15)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="modal-macos-window"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #d0d0d0", // viền giống macOS
              width: "1500px",
              maxWidth: "1000rem",
              minWidth: "340px",
              maxHeight: "80vh",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Title bar */}
            <div
              style={{
                background: "#fff",
                borderBottom: "1px solid #d0d0d0",
                padding: "10px 0 10px 0",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "1rem",
                color: "#22223B",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
              }}
            >
              {/* 3 nút macOS */}
                <div
                style={{
                  position: "absolute",
                  left: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: 8,
                }}
                >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ff5f56",
                  border: "none",
                  marginRight: 2,
                  cursor: "pointer",
                  boxShadow: "0 0 0 1px #e0443e",
                  padding: 0,
                  }}
                />
                <span
                  style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ffbd2e",
                  border: "none",
                  marginRight: 2,
                  boxShadow: "0 0 0 1px #dea123",
                  display: "inline-block",
                  }}
                />
                <span
                  style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#27c93f",
                  border: "none",
                  boxShadow: "0 0 0 1px #1aaf29",
                  display: "inline-block",
                  }}
                />
                </div>
              {/* Title */}
              <span>{title}</span>
            </div>

            {/* Nội dung */}
            <div
              style={{
                background: "#f9f9fb",
                padding: "20px 24px",
                overflowY: "auto",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {message && (
                <div
                  style={{
                    fontSize: "1rem",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  {message}
                </div>
              )}
              <div className="modal-grid-content">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalIOS;
