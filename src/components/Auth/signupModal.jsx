// src/components/Auth/SignupModal.jsx
import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Divider, Steps } from "antd";
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  signup,
  hideSignupModal,
  showLoginModal,
} from "@/store/slices/authSlice";
import { authUtils } from "@/utils/authService";

const { Step } = Steps;

const SignupModal = () => {
  const dispatch = useAppDispatch();
  const { showSignupModal, isSigningUp, signupError } = useAppSelector(
    (state) => state.auth
  );
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const handleCancel = () => {
    dispatch(hideSignupModal());
    form.resetFields();
    setCurrentStep(0);
  };

  const handleSubmit = async (values) => {
    const { firstName, lastName, phoneNumber, password } = values;

    // Format phone number
    const formattedPhone = authUtils.formatPhoneNumber(phoneNumber);

    const result = await dispatch(
      signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: formattedPhone,
        password,
        confirmPassword: values.confirmPassword,
      })
    );

    if (signup.fulfilled.match(result)) {
      setCurrentStep(2); // Success step
      setTimeout(() => {
        form.resetFields();
        setCurrentStep(0);
        // Modal automatically closes via state
      }, 2000);
    }
  };

  const nextStep = () => {
    form.validateFields(["firstName", "lastName", "phoneNumber"]).then(() => {
      setCurrentStep(1);
    });
  };

  const prevStep = () => {
    setCurrentStep(0);
  };

  const switchToLogin = () => {
    dispatch(hideSignupModal());
    dispatch(showLoginModal());
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              label="Ism"
              name="firstName"
              rules={[
                { required: true, message: "Ismingizni kiriting" },
                {
                  min: 2,
                  message: "Ism kamida 2 belgidan iborat bo'lishi kerak",
                },
                { max: 50, message: "Ism 50 belgidan kam bo'lishi kerak" },
                {
                  pattern: /^[a-zA-ZА-Яа-яЁёўқғҳ\s]+$/,
                  message: "Ism faqat harflardan iborat bo'lishi kerak",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Ismingiz"
                maxLength={50}
              />
            </Form.Item>

            <Form.Item
              label="Familiya"
              name="lastName"
              rules={[
                { required: true, message: "Familiyangizni kiriting" },
                {
                  min: 2,
                  message: "Familiya kamida 2 belgidan iborat bo'lishi kerak",
                },
                { max: 50, message: "Familiya 50 belgidan kam bo'lishi kerak" },
                {
                  pattern: /^[a-zA-ZА-Яа-яЁёўқғҳ\s]+$/,
                  message: "Familiya faqat harflardan iborat bo'lishi kerek",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Familiyangiz"
                maxLength={50}
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
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" onClick={nextStep} block size="large">
                Davom etish
              </Button>
            </Form.Item>
          </>
        );

      case 1:
        return (
          <>
            <Form.Item
              label="Parol"
              name="password"
              rules={[
                { required: true, message: "Parolni kiriting" },
                {
                  min: 6,
                  message: "Parol kamida 6 belgidan iborat bo'lishi kerak",
                },
                {
                  pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
                  message: "Parol kamida bitta harf va raqam bo'lishi kerek",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Parolingizni kiriting"
              />
            </Form.Item>

            <Form.Item
              label="Parolni tasdiqlash"
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
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button onClick={prevStep} block>
                Orqaga
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSigningUp}
                block
              >
                Ro'yxatdan o'tish
              </Button>
            </div>
          </>
        );

      case 2:
        return (
          <div className="text-center py-8">
            <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Muvaffaqiyatli!</h3>
            <p className="text-gray-600">
              Hisobingiz yaratildi. Endi barcha funksiyalardan foydalanishingiz
              mumkin.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="Ro'yxatdan o'tish"
      open={showSignupModal}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      maskClosable={false}
      width={450}
    >
      {currentStep < 2 && (
        <Steps current={currentStep} className="mb-6">
          <Step title="Ma'lumotlar" />
          <Step title="Parol" />
          <Step title="Yakunlash" />
        </Steps>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        {signupError && (
          <Alert
            message="Ro'yxatdan o'tish xatosi"
            description={signupError}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {renderStepContent()}

        {currentStep < 2 && (
          <>
            <Divider plain>yoki</Divider>
            <div className="text-center">
              <span className="text-gray-600">Hisobingiz bormi? </span>
              <Button type="link" onClick={switchToLogin} className="p-0">
                Tizimga kiring
              </Button>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default SignupModal;
