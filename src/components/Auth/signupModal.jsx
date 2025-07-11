// src/components/Auth/SignupModal.jsx
import React from "react";
import { Modal, Form, Input, Button, Alert, Divider } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import {
  signup,
  hideSignupModal,
  showLoginModal,
  clearErrors,
} from "../../store/slices/authSlice";

const SignupModal = () => {
  const dispatch = useAppDispatch();
  const { showSignupModal, isSigningUp, signupError } = useAppSelector(
    (state) => state.auth
  );
  const [form] = Form.useForm();

  const handleCancel = () => {
    dispatch(hideSignupModal());
    dispatch(clearErrors());
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const { firstName, lastName, phoneNumber, password } = values;

      // Format phone number
      let formattedPhone = phoneNumber.trim();
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

      const result = await dispatch(
        signup({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: formattedPhone,
          password: password.trim(),
          confirmPassword: password.trim(),
        })
      );

      if (signup.fulfilled.match(result)) {
        form.resetFields();
      }
    } catch (error) {
      console.error("Signup submit error:", error);
    }
  };

  const switchToLogin = () => {
    dispatch(hideSignupModal());
    dispatch(showLoginModal());
  };

  return (
    <Modal
      title="Ro'yxatdan o'tish"
      open={showSignupModal}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden={true}
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
        {signupError && (
          <Alert
            message="Ro'yxatdan o'tishda xato"
            description={signupError}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => dispatch(clearErrors())}
          />
        )}

        <Form.Item
          label="Ism"
          name="firstName"
          rules={[
            { required: true, message: "Ismingizni kiriting" },
            {
              min: 2,
              message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Ismingiz"
            autoComplete="given-name"
          />
        </Form.Item>

        <Form.Item
          label="Familiya"
          name="lastName"
          rules={[
            { required: true, message: "Familiyangizni kiriting" },
            {
              min: 2,
              message: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Familiyangiz"
            autoComplete="family-name"
          />
        </Form.Item>

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
            placeholder="Parol yarating"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="Parolni tasdiqlang"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Parolni tasdiqlang" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Parollar mos kelmaydi"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Parolni qayta kiriting"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={isSigningUp}
            block
            size="large"
          >
            {isSigningUp ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </Form.Item>

        <Divider plain>yoki</Divider>

        <div className="text-center">
          <span className="text-gray-600">Hisobingiz bormi? </span>
          <Button type="link" onClick={switchToLogin} className="p-0">
            Tizimga kiring
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SignupModal;
