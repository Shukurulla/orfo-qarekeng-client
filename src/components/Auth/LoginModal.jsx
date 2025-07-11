// src/components/Auth/LoginModal.jsx - ANTD DEPRECATED PROPERTIES TUZATILGAN
import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Divider } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import {
  login,
  hideLoginModal,
  showSignupModal,
  clearErrors,
} from "../../store/slices/authSlice";

const LoginModal = () => {
  const dispatch = useAppDispatch();
  const { showLoginModal, isLoggingIn, loginError } = useAppSelector(
    (state) => state.auth
  );
  const [form] = Form.useForm();

  const handleCancel = () => {
    dispatch(hideLoginModal());
    dispatch(clearErrors());
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const { phoneNumber, password } = values;

      // Format phone number
      let formattedPhone = phoneNumber.trim();

      // Clean phone number - remove all non-digits
      const cleaned = phoneNumber.replace(/\D/g, "");

      if (cleaned.startsWith("998")) {
        formattedPhone = "+" + cleaned;
      } else if (cleaned.startsWith("8") && cleaned.length === 9) {
        formattedPhone = "+998" + cleaned.substring(1);
      } else if (cleaned.length === 9) {
        formattedPhone = "+998" + cleaned;
      } else if (!formattedPhone.startsWith("+998")) {
        formattedPhone = "+998" + cleaned;
      }

      console.log("Formatted phone:", formattedPhone);

      const result = await dispatch(
        login({
          phoneNumber: formattedPhone,
          password: password.trim(),
        })
      );

      if (login.fulfilled.match(result)) {
        form.resetFields();
        // Modal will close automatically via state change
      }
    } catch (error) {
      console.error("Login submit error:", error);
    }
  };

  const switchToSignup = () => {
    dispatch(hideLoginModal());
    dispatch(showSignupModal());
  };

  return (
    <Modal
      title="Tizimga kirish"
      open={showLoginModal}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden={true} // Updated from destroyOnClose
      maskClosable={false}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        autoComplete="off"
      >
        {loginError && (
          <Alert
            message="Kirish xatosi"
            description={loginError}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => dispatch(clearErrors())}
          />
        )}

        <Form.Item
          label="Telefon raqami"
          name="phoneNumber"
          rules={[
            { required: true, message: "Telefon raqamini kiriting" },
            {
              pattern: /^(\+998|998|8)?\d{9}$/,
              message: "Telefon raqami to'g'ri formatda emas",
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="+998 90 123 45 67"
            maxLength={13}
            autoComplete="tel"
          />
        </Form.Item>

        <Form.Item
          label="Parol"
          name="password"
          rules={[
            { required: true, message: "Parolni kiriting" },
            {
              min: 6,
              message: "Parol kamida 6 belgidan iborat bo'lishi kerak",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Parolingizni kiriting"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoggingIn}
            block
            size="large"
          >
            {isLoggingIn ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </Form.Item>

        <Divider plain>yoki</Divider>

        <div className="text-center">
          <span className="text-gray-600">Hisobingiz yo'qmi? </span>
          <Button type="link" onClick={switchToSignup} className="p-0">
            Ro'yxatdan o'ting
          </Button>
        </div>

        {/* Test account info for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-700">
              <strong>Test akkaunt:</strong>
              <br />
              Tel: +998901234567
              <br />
              Parol: password123
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default LoginModal;
