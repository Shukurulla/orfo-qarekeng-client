// src/components/Auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin, Card, Empty, Button } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Yuklanmoqda..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20">
        <Card className="text-center">
          <LockOutlined className="text-4xl text-gray-400 mb-4" />
          <Empty
            description={
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Tizimga kirish kerak
                </h3>
                <p className="text-gray-600 mb-4">
                  Bu sahifani ko'rish uchun tizimga kirishingiz kerak.
                </p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              size="large"
              onClick={() => login(location.pathname)}
            >
              Tizimga kirish
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
