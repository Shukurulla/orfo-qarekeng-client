// src/components/Auth/ProfileModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Alert,
  Divider,
  Typography,
  Tag,
  Progress,
  Tabs,
  Card,
  Space,
  Statistic,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  CrownOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import {
  hideProfileModal,
  updateMe,
  updatePassword,
  logoutLocal,
  clearErrors,
  getStats,
} from "../../store/slices/authSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfileModal = () => {
  const dispatch = useAppDispatch();
  const {
    showProfileModal,
    user,
    isUpdating,
    isUpdatingPassword,
    updateError,
    passwordError,
    stats,
    isLoadingStats,
  } = useAppSelector((state) => state.auth);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (showProfileModal && user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      });

      // Load stats when profile opens
      dispatch(getStats());
    }
  }, [showProfileModal, user, profileForm, dispatch]);

  const handleCancel = () => {
    dispatch(hideProfileModal());
    dispatch(clearErrors());
    profileForm.resetFields();
    passwordForm.resetFields();
    setActiveTab("profile");
  };

  const handleUpdateProfile = async (values) => {
    try {
      const result = await dispatch(
        updateMe({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        })
      );

      if (updateMe.fulfilled.match(result)) {
        message.success("Profil yangilandi");
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const handleUpdatePassword = async (values) => {
    try {
      const result = await dispatch(
        updatePassword({
          passwordCurrent: values.currentPassword,
          password: values.newPassword,
          passwordConfirm: values.confirmPassword,
        })
      );

      if (updatePassword.fulfilled.match(result)) {
        passwordForm.resetFields();
        message.success("Parol yangilandi");
      }
    } catch (error) {
      console.error("Password update error:", error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutLocal());
    dispatch(hideProfileModal());
  };

  const getPlanInfo = () => {
    if (!user) return { plan: "start", isActive: false };

    const isPro =
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date();

    return {
      plan: user.plan,
      isActive: isPro,
      expiry: user.planExpiry,
      daysLeft: isPro
        ? Math.ceil(
            (new Date(user.planExpiry) - new Date()) / (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  };

  const getUsageStats = () => {
    if (!user || !user.dailyUsage) return {};

    const now = new Date();
    const lastReset = new Date(user.dailyUsage.lastReset);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
      return {
        spellCheck: 0,
        correctText: 0,
        transliterate: 0,
        documentGenerator: 0,
      };
    }

    return user.dailyUsage;
  };

  const planInfo = getPlanInfo();
  const usageStats = getUsageStats();

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>Profil sozlamalari</span>
          {planInfo.isActive && (
            <Tag color="gold" icon={<CrownOutlined />}>
              PRO
            </Tag>
          )}
        </Space>
      }
      open={showProfileModal}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden={true}
      width={600}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Profil" key="profile">
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            size="large"
          >
            {updateError && (
              <Alert
                message="Yangilashda xato"
                description={updateError}
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
                { min: 2, message: "Ism kamida 2 ta belgi" },
              ]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              label="Familiya"
              name="lastName"
              rules={[
                { required: true, message: "Familiyangizni kiriting" },
                { min: 2, message: "Familiya kamida 2 ta belgi" },
              ]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item label="Telefon raqami" name="phoneNumber">
              <Input
                prefix={<PhoneOutlined />}
                disabled
                title="Telefon raqamini o'zgartirib bo'lmaydi"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                block
              >
                Profilni yangilash
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Parol" key="password">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleUpdatePassword}
            size="large"
          >
            {passwordError && (
              <Alert
                message="Parol yangilashda xato"
                description={passwordError}
                type="error"
                showIcon
                className="mb-4"
                closable
                onClose={() => dispatch(clearErrors())}
              />
            )}

            <Form.Item
              label="Joriy parol"
              name="currentPassword"
              rules={[{ required: true, message: "Joriy parolni kiriting" }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="Yangi parol"
              name="newPassword"
              rules={[
                { required: true, message: "Yangi parolni kiriting" },
                { min: 6, message: "Parol kamida 6 ta belgi" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="Yangi parolni tasdiqlang"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Parolni tasdiqlang" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Parollar mos kelmaydi"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdatingPassword}
                block
              >
                Parolni yangilash
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Statistika" key="stats">
          <div className="space-y-4">
            {/* Plan Info */}
            <Card size="small">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong>Rejangiz: </Text>
                  <Tag color={planInfo.isActive ? "gold" : "blue"}>
                    {planInfo.plan.toUpperCase()}
                    {planInfo.isActive && <CrownOutlined className="ml-1" />}
                  </Tag>
                </div>
                {!planInfo.isActive && (
                  <Button type="primary" size="small">
                    PRO ga o'tish
                  </Button>
                )}
              </div>

              {planInfo.isActive && (
                <div className="mt-2">
                  <Text type="secondary" className="text-xs">
                    {planInfo.daysLeft} kun qoldi (
                    {dayjs(planInfo.expiry).format("DD.MM.YYYY")})
                  </Text>
                </div>
              )}
            </Card>

            {/* Daily Usage */}
            <Card size="small" title="Bugungi foydalanish">
              <div className="grid grid-cols-2 gap-4">
                <Statistic
                  title="Imlo tekshirish"
                  value={usageStats.spellCheck || 0}
                  suffix={planInfo.isActive ? "/ ∞" : "/ 3"}
                  prefix={<CheckCircleOutlined />}
                />
                <Statistic
                  title="Matn to'g'irlash"
                  value={usageStats.correctText || 0}
                  suffix={planInfo.isActive ? "/ ∞" : "/ 3"}
                  prefix={<CheckCircleOutlined />}
                />
                <Statistic
                  title="Transliteratsiya"
                  value={usageStats.transliterate || 0}
                  suffix={planInfo.isActive ? "/ ∞" : "/ 3"}
                  prefix={<CheckCircleOutlined />}
                />
                <Statistic
                  title="Document generator"
                  value={usageStats.documentGenerator || 0}
                  suffix={planInfo.isActive ? "/ ∞" : "/ 3"}
                  prefix={<CheckCircleOutlined />}
                />
              </div>
            </Card>

            {/* Account Info */}
            <Card size="small" title="Hisob ma'lumotlari">
              <div className="space-y-2 text-sm">
                <div>
                  <Text type="secondary">Ro'yxatdan o'tgan: </Text>
                  <Text>{dayjs(user?.createdAt).format("DD.MM.YYYY")}</Text>
                </div>
                <div>
                  <Text type="secondary">Oxirgi kirish: </Text>
                  <Text>
                    {user?.lastLogin
                      ? dayjs(user.lastLogin).format("DD.MM.YYYY HH:mm")
                      : "Noma'lum"}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      <Divider />

      <div className="flex justify-between">
        <Button onClick={handleCancel}>Yopish</Button>
        <Button type="primary" danger onClick={handleLogout}>
          Tizimdan chiqish
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileModal;
