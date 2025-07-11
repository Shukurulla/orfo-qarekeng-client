// src/components/Auth/AuthModal.jsx
import React, { useState } from "react";
import { Modal } from "antd";
import LoginForm, { RegisterForm } from "./LoginForm";

const AuthModal = ({ visible, onClose, defaultTab = "login" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSwitchToRegister = () => {
    setActiveTab("register");
  };

  const handleSwitchToLogin = () => {
    setActiveTab("login");
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={450}
      centered
      destroyOnClose
      className="auth-modal"
    >
      {activeTab === "login" ? (
        <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onClose={onClose}
        />
      ) : (
        <RegisterForm onSwitchToLogin={handleSwitchToLogin} onClose={onClose} />
      )}
    </Modal>
  );
};

export default AuthModal;
