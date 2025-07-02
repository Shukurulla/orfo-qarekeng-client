import React from "react";
import { Card, Row, Col, Typography, Space, Tag, Button, Divider } from "antd";
import {
  GithubOutlined,
  HeartOutlined,
  StarOutlined,
  BookOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CodeOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <CheckCircleOutlined className="text-blue-500 text-2xl" />,
      title: t("menu.spellCheck"),
      description: t("about.spellCheckFeature"),
    },
    {
      icon: <TranslationOutlined className="text-green-500 text-2xl" />,
      title: t("menu.transliteration"),
      description: t("about.transliterationFeature"),
    },
    {
      icon: <DatabaseOutlined className="text-purple-500 text-2xl" />,
      title: t("about.dataBase"),
      description: t("about.dataBaseDescription"),
    },
  ];

  const technologies = [
    { name: "React", color: "blue" },
    { name: "Node.js", color: "green" },
    { name: "MongoDB", color: "cyan" },
    { name: "Express.js", color: "gray" },
    { name: "Redux Toolkit", color: "purple" },
    { name: "Ant Design", color: "blue" },
    { name: "Tailwind CSS", color: "cyan" },
    { name: "Vite", color: "orange" },
  ];

  const statistics = [
    {
      label: t("about.statistics.wordsBase"),
      value: "142,000+",
      icon: <BookOutlined />,
    },
    {
      label: t("about.statistics.supportedAlphabets"),
      value: "2",
      icon: <TranslationOutlined />,
    },
    {
      label: t("about.statistics.accuracyLevel"),
      value: "99%+",
      icon: <StarOutlined />,
    },
    {
      label: t("about.statistics.apiEndpoints"),
      value: "12+",
      icon: <CodeOutlined />,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">қ</span>
          </div>
        </div>

        <Title level={1} className="!mb-4">
          {t("common.appName")}
        </Title>

        <Paragraph className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {t("about.description")}
        </Paragraph>

        <Space className="mt-6">
          <Button
            type="primary"
            icon={<GithubOutlined />}
            size="large"
            href="https://github.com/username/karakalpak-spell-checker"
            target="_blank"
          >
            GitHub
          </Button>
          <Button icon={<HeartOutlined />} size="large">
            {t("about.contribute")}
          </Button>
        </Space>
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
            <Col xs={12} md={6} key={index}>
              <Card className="text-center h-full hover:shadow-lg transition-shadow">
                <div className="text-3xl text-blue-500 mb-3">{stat.icon}</div>
                <Title level={3} className="!mb-1">
                  {stat.value}
                </Title>
                <Text type="secondary">{stat.label}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-12"
      >
        <Title level={2} className="text-center !mb-8">
          {t("about.features")}
        </Title>

        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <Card className="h-full text-center hover:shadow-lg transition-all duration-300">
                <div className="mb-4">{feature.icon}</div>
                <Title level={4} className="!mb-3">
                  {feature.title}
                </Title>
                <Paragraph className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Technologies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-12"
      >
        <Card>
          <Title level={3} className="!mb-6 flex items-center">
            <CodeOutlined className="mr-2" />
            {t("about.technologies")}
          </Title>

          <Space wrap size="middle">
            {technologies.map((tech, index) => (
              <Tag key={index} color={tech.color} className="px-3 py-1 text-sm">
                {tech.name}
              </Tag>
            ))}
          </Space>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Title level={5}>Frontend</Title>
              <Paragraph className="text-gray-600 dark:text-gray-300">
                React 18, Redux Toolkit, Ant Design, Tailwind CSS, Framer Motion
              </Paragraph>
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>Backend</Title>
              <Paragraph className="text-gray-600 dark:text-gray-300">
                Node.js, Express.js, MongoDB
              </Paragraph>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-12"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} md={16}>
              <Title level={3} className="!mb-4">
                {t("about.mission")}
              </Title>
              <Paragraph className="text-lg !mb-4">
                {t("about.missionText")}
              </Paragraph>
              <Paragraph className="text-gray-600 dark:text-gray-300">
                {t("about.missionSubtext")}
              </Paragraph>
            </Col>
            <Col xs={24} md={8} className="text-center">
              <TeamOutlined className="text-6xl text-blue-500" />
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Contact & Contribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card>
              <Title level={4} className="!mb-4">
                {t("about.contribute")}
              </Title>
              <Paragraph>{t("about.contributeText")}</Paragraph>
              <Button
                type="primary"
                icon={<GithubOutlined />}
                href="https://github.com/username/karakalpak-spell-checker"
                target="_blank"
              >
                GitHub Repository
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card>
              <Title level={4} className="!mb-4">
                {t("about.contact")}
              </Title>
              <Paragraph>{t("about.contactText")}</Paragraph>
              <Space direction="vertical">
                <Text>📧 Email: your.email@example.com</Text>
                <Text>💬 Telegram: @yourusername</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </motion.div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Text type="secondary">
          © 2024 {t("common.appName")}. {t("about.footerText")}
        </Text>
      </div>
    </div>
  );
};

export default About;
