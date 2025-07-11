// src/components/Auth/LoginModal.jsx
import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Divider } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  login,
  hideLoginModal,
  showSignupModal,
} from "@/store/slices/authSlice";
import { authUtils } from "@/utils/authService";

const LoginModal = () => {
  const dispatch = useAppDispatch();
  const { showLoginModal, isLoggingIn, loginError } = useAppSelector(
    (state) => state.auth
  );
  const [form] = Form.useForm();

  const handleCancel = () => {
    dispatch(hideLoginModal());
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    const { phoneNumber, password } = values;

    // Format phone number
    const formattedPhone = authUtils.formatPhoneNumber(phoneNumber);

    const result = await dispatch(
      login({
        phoneNumber: formattedPhone,
        password,
      })
    );

    if (login.fulfilled.match(result)) {
      form.resetFields();
      // Modal automatically closes via state
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
      destroyOnClose
      maskClosable={false}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        {loginError && (
          <Alert
            message="Kirish xatosi"
            description={loginError}
            type="error"
            showIcon
            className="mb-4"
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
            Kirish
          </Button>
        </Form.Item>

        <Divider plain>yoki</Divider>

        <div className="text-center">
          <span className="text-gray-600">Hisobingiz yo'qmi? </span>
          <Button type="link" onClick={switchToSignup} className="p-0">
            Ro'yxatdan o'ting
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LoginModal;
