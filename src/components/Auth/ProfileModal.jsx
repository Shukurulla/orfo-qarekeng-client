// src/components/Auth/ProfileModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Alert,
  Tabs,
  Card,
  Statistic,
  Tag,
  Progress,
  Descriptions,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  CrownOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  updateMe,
  updatePassword,
  hideProfileModal,
  getStats,
} from "@/store/slices/authSlice";
import { authUtils } from "@/utils/authService";

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

  React.useEffect(() => {
    if (showProfileModal && user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Load stats
      dispatch(getStats());
    }
  }, [showProfileModal, user, profileForm, dispatch]);

  const handleCancel = () => {
    dispatch(hideProfileModal());
    profileForm.resetFields();
    passwordForm.resetFields();
  };

  const handleUpdateProfile = async (values) => {
    const result = await dispatch(updateMe(values));
    if (updateMe.fulfilled.match(result)) {
      profileForm.resetFields();
    }
  };

  const handleUpdatePassword = async (values) => {
    const result = await dispatch(updatePassword(values));
    if (updatePassword.fulfilled.match(result)) {
      passwordForm.resetFields();
    }
  };

  const planStatus = authUtils.getPlanStatus(user);

  return (
    <Modal
      title="Profil"
      open={showProfileModal}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={600}
    >
      <Tabs defaultActiveKey="profile">
        <TabPane tab="Ma'lumotlar" key="profile">
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            size="large"
          >
            {updateError && (
              <Alert
                message="Yangilash xatosi"
                description={updateError}
                type="error"
                showIcon
                className="mb-4"
              />
            )}

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
              ]}
            >
              <Input prefix={<UserOutlined />} />
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
              ]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Descriptions bordered size="small" className="mb-4">
              <Descriptions.Item label="Telefon raqami" span={3}>
                {user?.phoneNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Ro'yxatdan o'tgan sana" span={3}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("uz-UZ")
                  : "Noma'lum"}
              </Descriptions.Item>
            </Descriptions>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                block
              >
                Saqlash
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
                message="Parol yangilash xatosi"
                description={passwordError}
                type="error"
                showIcon
                className="mb-4"
              />
            )}

            <Form.Item
              label="Joriy parol"
              name="passwordCurrent"
              rules={[{ required: true, message: "Joriy parolni kiriting" }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="Yangi parol"
              name="password"
              rules={[
                { required: true, message: "Yangi parolni kiriting" },
                {
                  min: 6,
                  message: "Parol kamida 6 belgidan iborat bo'lishi kerak",
                },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="Yangi parolni tasdiqlash"
              name="passwordConfirm"
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

        <TabPane tab="Plan va limitlar" key="plan">
          <div className="space-y-4">
            {/* Plan info */}
            <Card size="small">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {planStatus.plan === "pro" ? (
                    <CrownOutlined className="text-yellow-500" />
                  ) : (
                    <UserOutlined className="text-gray-500" />
                  )}
                  <span className="font-semibold">
                    {planStatus.plan === "pro" ? "Pro Plan" : "Start Plan"}
                  </span>
                </div>
                <Tag color={planStatus.plan === "pro" ? "gold" : "blue"}>
                  {planStatus.plan === "pro" ? "PREMIUM" : "BEPUL"}
                </Tag>
              </div>

              {planStatus.plan === "pro" && planStatus.expiry && (
                <div className="mt-2 text-sm text-gray-600">
                  <CalendarOutlined className="mr-1" />
                  Muddat:{" "}
                  {new Date(planStatus.expiry).toLocaleDateString("uz-UZ")}(
                  {planStatus.daysLeft} kun qoldi)
                </div>
              )}
            </Card>

            {/* Daily limits */}
            <Card title="Kunlik limitlar" size="small">
              <div className="grid grid-cols-2 gap-4">
                <Statistic
                  title="Imlo tekshirish"
                  value={authUtils.getRemainingLimit(user, "spellCheck")}
                  suffix={planStatus.plan === "start" ? "/ 3" : ""}
                  valueStyle={{
                    color: planStatus.plan === "pro" ? "#52c41a" : "#1890ff",
                  }}
                />
                <Statistic
                  title="Avtomatik to'g'irlash"
                  value={authUtils.getRemainingLimit(user, "correctText")}
                  suffix={planStatus.plan === "start" ? "/ 3" : ""}
                  valueStyle={{
                    color: planStatus.plan === "pro" ? "#52c41a" : "#1890ff",
                  }}
                />
                <Statistic
                  title="Transliteratsiya"
                  value={authUtils.getRemainingLimit(user, "transliterate")}
                  suffix={planStatus.plan === "start" ? "/ 3" : ""}
                  valueStyle={{
                    color: planStatus.plan === "pro" ? "#52c41a" : "#1890ff",
                  }}
                />
                <Statistic
                  title="Matn yaxshilash"
                  value={authUtils.getRemainingLimit(user, "documentGenerator")}
                  suffix={planStatus.plan === "start" ? "/ 3" : ""}
                  valueStyle={{
                    color: planStatus.plan === "pro" ? "#52c41a" : "#1890ff",
                  }}
                />
              </div>

              {planStatus.plan === "start" && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded">
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    Pro rejasiga o'tib cheksiz foydalaning!
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    className="mt-2"
                    onClick={() => window.open("/pricing", "_blank")}
                  >
                    Pro rejasi - 30,000 so'm
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabPane>

        <TabPane tab="Statistika" key="stats">
          <Card
            title="Foydalanish statistikasi"
            size="small"
            loading={isLoadingStats}
            extra={
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => dispatch(getStats())}
              >
                Yangilash
              </Button>
            }
          >
            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Statistic
                    title="Jami so'rovlar"
                    value={stats.totalRequests || 0}
                  />
                  <Statistic
                    title="Muvaffaqiyat %"
                    value={
                      stats.successRate
                        ? (stats.successRate * 100).toFixed(1)
                        : 0
                    }
                    suffix="%"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Harakat bo'yicha</h4>
                  {stats.actionStats?.map((action, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="capitalize">
                        {action.action === "spellCheck"
                          ? "Imlo tekshirish"
                          : action.action === "correctText"
                          ? "Avtomatik to'g'irlash"
                          : action.action === "transliterate"
                          ? "Transliteratsiya"
                          : action.action === "documentGenerator"
                          ? "Matn yaxshilash"
                          : action.action}
                      </span>
                      <Tag color="blue">{action.count}</Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ProfileModal;
