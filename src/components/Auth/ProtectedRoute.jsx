// src/components/Auth/ProtectedRoute.jsx
import React from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { showLoginModal } from "@/store/slices/AuthSlice";
import { Result, Button } from "antd";
import { LoginOutlined, UserOutlined } from "@ant-design/icons";

const ProtectedRoute = ({ children, fallback = null }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Agar foydalanuvchi tizimga kirgan bo'lsa, komponentni ko'rsatish
  if (isAuthenticated && user) {
    return children;
  }

  // Agar fallback berilgan bo'lsa, uni ko'rsatish
  if (fallback) {
    return fallback;
  }

  // Default: login taklifi
  return (
    <div className="h-full flex items-center justify-center p-8">
      <Result
        icon={<UserOutlined className="text-6xl text-blue-500" />}
        title="Tizimga kirish kerak"
        subTitle="Bu sahifani ko'rish uchun akkauntingizga kirishingiz kerak."
        extra={[
          <Button
            key="login"
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            onClick={() => dispatch(showLoginModal(window.location.pathname))}
          >
            Tizimga kirish
          </Button>,
          <Button key="home" onClick={() => (window.location.href = "/")}>
            Bosh sahifa
          </Button>,
        ]}
      />
    </div>
  );
};

export default ProtectedRoute;
