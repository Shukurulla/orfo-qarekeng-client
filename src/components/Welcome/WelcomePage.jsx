import React from "react";
import { Card, Button, Row, Col, Statistic, Typography, Space } from "antd";
import {
  CheckCircleOutlined,
  TranslationOutlined,
  FileTextOutlined,
  BookOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useAppDispatch } from "@/hooks/redux";
import { setActiveTab } from "@/store/slices/uiSlice";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

const WelcomePage = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const features = [
    {
      icon: <CheckCircleOutlined className="text-4xl text-blue-500" />,
      title: t("menu.spellCheck"),
      description: t("home.spellCheckDescription"),
      action: () => dispatch(setActiveTab("spellcheck")),
      buttonText: t("spellChecker.check"),
      color: "blue",
    },
    {
      icon: <TranslationOutlined className="text-4xl text-green-500" />,
      title: t("menu.transliteration"),
      description: t("home.transliterationDescription"),
      action: () => dispatch(setActiveTab("translate")),
      buttonText: t("transliterator.convert"),
      color: "green",
    },
    {
      icon: <FileTextOutlined className="text-4xl text-purple-500" />,
      title: t("menu.documentGenerator"),
      description: t("home.documentGeneratorDescription"),
      action: () => dispatch(setActiveTab("document")),
      buttonText: t("documentGenerator.improve"),
      color: "purple",
    },
  ];

  const statistics = [
    {
      title: "142,000+",
      value: t("home.wordsBase"),
      icon: <BookOutlined />,
    },
    {
      title: t("transliterator.cyrillic") + " ⇄ " + t("transliterator.latin"),
      value: t("home.biDirectional"),
      icon: <ThunderboltOutlined />,
    },
    {
      title: "99%+",
      value: t("home.accuracy"),
      icon: <StarOutlined />,
    },
    {
      title: "AI",
      value: t("home.aiPowered"),
      icon: <RocketOutlined />,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">қ</span>
          </div>
        </div>

        <Title level={1} className="!mb-4 !text-4xl lg:!text-5xl">
          {t("home.welcome")}
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            {t("home.subtitle")}
          </span>
        </Title>

        <Paragraph className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {t("home.description")}
        </Paragraph>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <Row gutter={[24, 24]}>
          {statistics.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl text-blue-500 mb-2">{stat.icon}</div>
                <div className="font-bold text-xl mb-1">{stat.title}</div>
                <div className="text-gray-500">{stat.value}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Main Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} lg={8} key={index}>
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                <Card
                  className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                  bodyStyle={{ padding: "2rem" }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6">{feature.icon}</div>

                    <Title level={3} className="!mb-4">
                      {feature.title}
                    </Title>

                    <Paragraph className="text-gray-600 dark:text-gray-300 !mb-6 text-lg">
                      {feature.description}
                    </Paragraph>

                    <Button
                      type="primary"
                      size="large"
                      onClick={feature.action}
                      className={`bg-${feature.color}-500 border-${feature.color}-500 hover:bg-${feature.color}-600 hover:border-${feature.color}-600`}
                      style={{
                        height: "48px",
                        padding: "0 32px",
                        fontSize: "16px",
                        borderRadius: "8px",
                      }}
                    >
                      {feature.buttonText}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-16"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
          <div className="text-center py-8">
            <Title level={3} className="!mb-4">
              {t("home.featuresTitle")}
            </Title>

            <Row gutter={[24, 24]} className="mt-8">
              <Col xs={24} md={6}>
                <Space direction="vertical" size="small" className="w-full">
                  <CheckCircleOutlined className="text-2xl text-green-500" />
                  <Text strong>{t("home.feature1")}</Text>
                  <Text className="text-gray-600 dark:text-gray-300">
                    {t("home.whyFeature1")}
                  </Text>
                </Space>
              </Col>

              <Col xs={24} md={6}>
                <Space direction="vertical" size="small" className="w-full">
                  <ThunderboltOutlined className="text-2xl text-orange-500" />
                  <Text strong>{t("home.feature2")}</Text>
                  <Text className="text-gray-600 dark:text-gray-300">
                    {t("home.whyFeature2")}
                  </Text>
                </Space>
              </Col>

              <Col xs={24} md={6}>
                <Space direction="vertical" size="small" className="w-full">
                  <StarOutlined className="text-2xl text-yellow-500" />
                  <Text strong>{t("home.feature3")}</Text>
                  <Text className="text-gray-600 dark:text-gray-300">
                    {t("home.whyFeature3")}
                  </Text>
                </Space>
              </Col>

              <Col xs={24} md={6}>
                <Space direction="vertical" size="small" className="w-full">
                  <FileTextOutlined className="text-2xl text-purple-500" />
                  <Text strong>{t("home.feature4")}</Text>
                  <Text className="text-gray-600 dark:text-gray-300">
                    {t("home.whyFeature4")}
                  </Text>
                </Space>
              </Col>
            </Row>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
