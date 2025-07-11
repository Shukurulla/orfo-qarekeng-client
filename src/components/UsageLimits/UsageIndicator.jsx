// src/components/UsageLimits/UsageIndicator.jsx
import React from "react";
import { Card, Progress, Tag, Button, Space, Typography } from "antd";
import {
  CrownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Text } = Typography;

const UsageIndicator = ({ feature, onUpgrade }) => {
  const { user, getUsageInfo } = useAuth();

  if (!user) return null;

  const usageInfo = getUsageInfo();

  if (usageInfo.unlimited) {
    return (
      <Card size="small" className="mb-4 border-yellow-200 bg-yellow-50">
        <Space align="center">
          <CrownOutlined className="text-yellow-600" />
          <Text className="text-yellow-700 font-medium">
            PRO Plan - Cheksiz foydalanish
          </Text>
        </Space>
      </Card>
    );
  }

  const usage = usageInfo.usage[feature] || 0;
  const remaining = usageInfo.remaining[feature] || 0;
  const limit = usageInfo.limit;
  const percentage = (usage / limit) * 100;

  const getStatusColor = () => {
    if (remaining === 0) return "red";
    if (remaining === 1) return "orange";
    return "green";
  };

  const getStatusIcon = () => {
    if (remaining === 0) return <ExclamationCircleOutlined />;
    return <CheckCircleOutlined />;
  };

  return (
    <Card size="small" className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Space align="center">
          {getStatusIcon()}
          <Text strong>
            Bugungi limit: {usage}/{limit}
          </Text>
          <Tag color={getStatusColor()}>{remaining} ta qoldi</Tag>
        </Space>

        {user.plan === "start" && (
          <Button
            type="primary"
            size="small"
            icon={<CrownOutlined />}
            onClick={onUpgrade}
          >
            PRO ga o'tish
          </Button>
        )}
      </div>

      <Progress
        percent={percentage}
        strokeColor={getStatusColor()}
        size="small"
        showInfo={false}
      />

      {remaining === 0 && (
        <Text type="danger" className="text-xs mt-1 block">
          Bugungi limit tugadi. Ertaga qayta foydalanishingiz mumkin.
        </Text>
      )}
    </Card>
  );
};

// src/components/UsageLimits/LimitReachedModal.jsx
export const LimitReachedModal = ({ visible, onClose, onUpgrade, feature }) => {
  const featureNames = {
    spellCheck: "Imlo tekshirish",
    textImprovement: "Matn yaxshilash",
    transliteration: "Transliteratsiya",
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={400}
      centered
      footer={[
        <Button key="close" onClick={onClose}>
          Yopish
        </Button>,
        <Button
          key="upgrade"
          type="primary"
          icon={<CrownOutlined />}
          onClick={onUpgrade}
        >
          PRO ga o'tish
        </Button>,
      ]}
    >
      <div className="text-center py-4">
        <ExclamationCircleOutlined className="text-4xl text-orange-500 mb-4" />
        <Title level={4}>Kunlik limit tugadi</Title>
        <Text className="text-gray-600">
          {featureNames[feature]} uchun bugungi 3 ta imkoniyat tugadi.
        </Text>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <Text className="text-sm">
            PRO plan bilan cheksiz foydalaning yoki ertaga qayta urinib ko'ring.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default UsageIndicator;
