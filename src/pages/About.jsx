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

const { Title, Paragraph, Text } = Typography;

const About = () => {
  const features = [
    {
      icon: <CheckCircleOutlined className="text-blue-500 text-2xl" />,
      title: "Imlo tekshiruv",
      description:
        "142,000+ so'zdan iborat keng lug'at bilan professional imlo tekshiruv",
    },
    {
      icon: <TranslationOutlined className="text-green-500 text-2xl" />,
      title: "Transliteratsiya",
      description:
        "Kirill va Lotin alifbolari o'rtasida ikki tomonlama avtomatik aylantirish",
    },
    {
      icon: <DatabaseOutlined className="text-purple-500 text-2xl" />,
      title: "Keng ma'lumotlar bazasi",
      description: "Qoraqolpoq tilining boy lug'ati va grammatik qoidalari",
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
    { label: "So'zlar bazasi", value: "142,000+", icon: <BookOutlined /> },
    {
      label: "Qo'llab-quvvatlanadigan alifbolar",
      value: "2",
      icon: <TranslationOutlined />,
    },
    { label: "Aniqlik darajasi", value: "99%+", icon: <StarOutlined /> },
    { label: "API endpoints", value: "12+", icon: <CodeOutlined /> },
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
          Qoraqolpoq Tili Imlo Tekshiruvchisi
        </Title>

        <Paragraph className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Qoraqolpoq tilining rivojlanishiga hissa qo'shish va tilni saqlash
          maqsadida yaratilgan zamonaviy texnologiyalar asosidagi professional
          vosita.
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
            Loyihani qo'llab-quvvatlash
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
          Asosiy imkoniyatlar
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
            Ishlatilgan texnologiyalar
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
                bilan zamonaviy va tez ishlaydigan foydalanuvchi interfeysi.
              </Paragraph>
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>Backend</Title>
              <Paragraph className="text-gray-600 dark:text-gray-300">
                Node.js, Express.js, MongoDB bilan ishonchli va tezkor server
                tomoni va ma'lumotlar bazasi.
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
                Bizning maqsadimiz
              </Title>
              <Paragraph className="text-lg !mb-4">
                Qoraqolpoq tilini saqlab qolish, rivojlantirish va zamonaviy
                texnologiyalar bilan bog'lash orqali kelajak avlodlar uchun til
                boyligini yo'qotmaslik.
              </Paragraph>
              <Paragraph className="text-gray-600 dark:text-gray-300">
                Bu loyiha orqali Qoraqolpoq tilida yozuvchi, o'quvchi va
                o'rganuvchilarning ishini osonlashtirish va til sifatini
                oshirishga hissa qo'shamiz.
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
                Loyihaga hissa qo'shish
              </Title>
              <Paragraph>
                Agar siz ham Qoraqolpoq tilining rivojlanishiga hissa
                qo'shmoqchi bo'lsangiz, GitHub orqali loyihaga qo'shilishingiz
                mumkin.
              </Paragraph>
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
                Aloqa
              </Title>
              <Paragraph>
                Loyiha haqida savollar, takliflar yoki xatolar haqida ma'lumot
                berish uchun biz bilan bog'laning.
              </Paragraph>
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
          © 2024 Qoraqolpoq Tili Imlo Tekshiruvchisi. Qoraqolpoq tilining
          rivojlanishi uchun yaratilgan.
        </Text>
      </div>
    </div>
  );
};

export default About;
