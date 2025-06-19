// src/components/DocumentGenerator/DocumentGenerator.jsx

import React, { useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Select,
  Spin,
  Alert,
  Space,
  message,
  Input,
  Tag,
  Typography,
  Divider,
  Slider,
} from "antd";
import {
  FileTextOutlined,
  CheckOutlined,
  ClearOutlined,
  ScanOutlined,
  RobotOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  DownloadOutlined,
  CopyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { improveText } from "@/utils/OrfoAIService";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const DocumentGenerator = () => {
  // State
  const [inputText, setInputText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("uz");
  const [selectedScript, setSelectedScript] = useState("latin"); // Default latin
  const [improvementLevel, setImprovementLevel] = useState(3);
  const [styleType, setStyleType] = useState("professional");
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Til tanlash opsiyalari
  const languageOptions = [
    { value: "uz", label: "O'zbek tili", flag: "🇺🇿" },
    { value: "kaa", label: "Qoraqolpoq tili", flag: "🏳️" },
    { value: "ru", label: "Rus tili", flag: "🇷🇺" },
  ];

  // Alifbo tanlash opsiyalari
  const scriptOptions = [
    { value: "latin", label: "Lotin alifbosi", icon: "🅰️" },
    { value: "cyrillic", label: "Kirill alifbosi", icon: "Я" },
  ];

  // Alifbo ko'rsatilishini tekshirish
  const showScriptSelector =
    selectedLanguage === "uz" || selectedLanguage === "kaa";
  const styleTypes = [
    {
      value: "professional",
      label: "Professional",
      icon: "💼",
      desc: "Rasmiy va professional uslub",
    },
    {
      value: "academic",
      label: "Ilmiy",
      icon: "🎓",
      desc: "Ilmiy-akademik uslub",
    },
    {
      value: "literary",
      label: "Adabiy",
      icon: "📚",
      desc: "Go'zal va adabiy uslub",
    },
    {
      value: "formal",
      label: "Rasmiy",
      icon: "🏛️",
      desc: "Rasmiy hujjat uslubi",
    },
    {
      value: "friendly",
      label: "Do'stona",
      icon: "😊",
      desc: "Samimiy va do'stona uslub",
    },
  ];

  // Yaxshilash darajasi
  const getLevelDescription = (level) => {
    const levels = {
      1: "Minimal - faqat eng kerakli o'zgarishlar",
      2: "Engil - ozgina yaxshilanish",
      3: "O'rtacha - muvozanatli yaxshilash",
      4: "Kuchli - sezilarli o'zgarishlar",
      5: "Maksimal - to'liq qayta ishlash",
    };
    return levels[level] || levels[3];
  };

  // Matn kiritish
  const handleInputChange = useCallback((e) => {
    setInputText(e.target.value);
    setError(null);
    setShowResult(false);
  }, []);

  // Til tanlash
  const handleLanguageChange = useCallback((value) => {
    setSelectedLanguage(value);
    setError(null);

    // Barcha tillar uchun joriy alifboni saqlab qolish
    // Foydalanuvchi o'zi alifboni tanlaydi
  }, []);

  // Alifbo tanlash
  const handleScriptChange = useCallback((value) => {
    setSelectedScript(value);
    setError(null);
  }, []);

  // Uslub tanlash
  const handleStyleChange = useCallback((value) => {
    setStyleType(value);
    setError(null);
  }, []);

  // Matnni yaxshilash
  const handleImproveText = useCallback(async () => {
    if (!inputText.trim()) {
      message.warning("Iltimos, yaxshilash uchun matn kiriting");
      return;
    }

    if (inputText.trim().length < 10) {
      message.warning("Matn juda qisqa. Kamida 10 ta belgi kiriting");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await improveText(inputText, {
        language: selectedLanguage,
        script: selectedScript,
        style: styleType,
        level: improvementLevel,
      });

      if (response.success) {
        setImprovedText(response.data.improved);
        setShowResult(true);
        message.success("Matn muvaffaqiyatli yaxshilandi!");
      } else {
        setError(response.error);
        message.error("Matn yaxshilashda xato yuz berdi");
      }
    } catch (error) {
      const errorMsg = error.message || "Matn yaxshilashda xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsImproving(false);
    }
  }, [inputText, selectedLanguage, styleType, improvementLevel]);

  // Nusxalash
  const handleCopy = useCallback(async (text) => {
    if (!text.trim()) {
      message.warning("Nusxalash uchun matn yo'q");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      message.success("Matn nusxalandi");
    } catch (error) {
      message.error("Nusxalashda xato");
    }
  }, []);

  // Tozalash
  const handleClear = useCallback(() => {
    setInputText("");
    setImprovedText("");
    setError(null);
    setShowResult(false);
    message.info("Hammasi tozalandi");
  }, []);

  // Yuklab olish
  const handleDownload = useCallback(() => {
    if (!improvedText.trim()) {
      message.warning("Yuklab olish uchun matn yo'q");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([improvedText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `yaxshilangan_matn_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success("Matn yuklab olindi");
  }, [improvedText]);

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={5}>
              <Space className="w-full">
                <RobotOutlined className="text-blue-500" />
                <Select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="w-full min-w-[130px]"
                  placeholder="Tilni tanlang"
                >
                  {languageOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <span>{option.flag}</span>
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>

            {showScriptSelector && (
              <Col xs={24} sm={8} md={4}>
                <Select
                  value={selectedScript}
                  onChange={handleScriptChange}
                  className="w-full"
                  placeholder="Alifbo"
                >
                  {scriptOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <span>{option.icon}</span>
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            )}

            <Col xs={24} sm={8} md={showScriptSelector ? 5 : 6}>
              <Select
                value={styleType}
                onChange={handleStyleChange}
                className="w-full"
                placeholder="Uslubni tanlang"
              >
                {styleTypes.map((style) => (
                  <Option key={style.value} value={style.value}>
                    <Space>
                      <span>{style.icon}</span>
                      {style.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={showScriptSelector ? 5 : 6}>
              <div>
                <Text className="text-xs text-gray-500">
                  Yaxshilash darajasi: {improvementLevel}
                </Text>
                <Slider
                  min={1}
                  max={5}
                  value={improvementLevel}
                  onChange={setImprovementLevel}
                  marks={{
                    1: "Min",
                    3: "O'rta",
                    5: "Max",
                  }}
                />
              </div>
            </Col>

            <Col xs={24} sm={24} md={showScriptSelector ? 5 : 6}>
              <Space className="w-full justify-end" wrap>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!inputText.trim() && !improvedText.trim()}
                >
                  Tozalash
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Settings Info */}
      <div className="mb-4">
        <Card
          size="small"
          className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Text strong>Til:</Text>{" "}
              {languageOptions.find((l) => l.value === selectedLanguage)?.label}
            </Col>
            {showScriptSelector && (
              <Col xs={24} md={4}>
                <Text strong>Alifbo:</Text>{" "}
                {scriptOptions.find((s) => s.value === selectedScript)?.label}
              </Col>
            )}
            <Col xs={24} md={showScriptSelector ? 6 : 8}>
              <Text strong>Uslub:</Text>{" "}
              {styleTypes.find((s) => s.value === styleType)?.label}
            </Col>
            <Col xs={24} md={showScriptSelector ? 6 : 8}>
              <Text strong>Daraja:</Text>{" "}
              {getLevelDescription(improvementLevel)}
            </Col>
          </Row>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Xato yuz berdi"
          description={error}
          type="error"
          showIcon
          closable
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {/* Main Content */}
      <Row gutter={[24, 24]} className="h-full">
        {/* Input Column */}
        <Col xs={24} lg={showResult ? 12 : 24}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Asl matn</span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleImproveText}
                  loading={isImproving}
                  disabled={!inputText.trim()}
                  size="large"
                >
                  AI Yaxshilash
                </Button>
              </Space>
            }
            className="h-full shadow-lg"
          >
            <div className="relative">
              {isImproving && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin size="large" tip="Gemini AI matnni yaxshilayapti..." />
                </div>
              )}

              <TextArea
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Bu yerga istalgan matnni yozing...

Masalan:
"Men bugün ishga bordim. Boshligim meni chaqirdi. U menga yangi loyiha haqida gapirdi. Bu loyiha juda muhim. Men uni qilishga tayyorman."

AI bu matnni tanlangan uslub va darajaga qarab yaxshilaydi:
• Ma'nosini o'zgartirmaydi
• Yozuvni mukammallashtiradi  
• Adabiy jihatdan to'ldiradi
• Professional ko'rinish beradi`}
                className="min-h-[400px] resize-none"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              />

              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Belgilar: {inputText.length}</span>
                <span>
                  So'zlar:{" "}
                  {
                    inputText
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }
                </span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Result Column */}
        {showResult && (
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                title={
                  <Space>
                    <CheckOutlined className="text-green-500" />
                    <span>Yaxshilangan matn</span>
                    <Tag color="green">Tayyor</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(improvedText)}
                      disabled={!improvedText.trim()}
                    >
                      Nusxalash
                    </Button>

                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      disabled={!improvedText.trim()}
                    >
                      Yuklab olish
                    </Button>
                  </Space>
                }
                className="h-full shadow-lg"
              >
                <div className="relative">
                  <TextArea
                    value={improvedText}
                    readOnly
                    className="min-h-[400px] resize-none bg-gray-50 dark:bg-gray-800"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                    }}
                  />

                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Belgilar: {improvedText.length}</span>
                    <span>
                      So'zlar:{" "}
                      {
                        improvedText
                          .trim()
                          .split(/\s+/)
                          .filter((w) => w).length
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        )}

        {/* Instructions Panel */}
        {!showResult && (
          <Col xs={24} lg={8}>
            <Card className="h-full">
              <div className="text-center">
                <ThunderboltOutlined className="text-4xl text-blue-500 mb-4" />
                <Title level={4}>AI Matn Yaxshilagich</Title>
                <Text className="text-gray-500">
                  Har qanday matnni mukammallashtiring
                </Text>

                <Divider />

                <div className="text-left">
                  <Title level={5}>Qanday ishlaydi:</Title>
                  <div className="space-y-2 text-sm">
                    <div>• Matnni kiriting</div>
                    <div>• Til va uslubni tanlang</div>
                    <div>• Yaxshilash darajasini sozlang</div>
                    <div>• AI tugmasini bosing</div>
                    <div>• Yaxshilangan matnni oling</div>
                  </div>

                  <Divider />

                  <Title level={5}>Uslublar:</Title>
                  <div className="space-y-1 text-sm">
                    {styleTypes.map((style) => (
                      <div
                        key={style.value}
                        className="flex items-start space-x-2"
                      >
                        <span>{style.icon}</span>
                        <div>
                          <div className="font-medium">{style.label}</div>
                          <div className="text-xs text-gray-500">
                            {style.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Divider />

                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Text className="text-sm text-green-800 dark:text-green-200">
                      <strong>AI kafolati:</strong> Matn ma'nosi
                      o'zgartirilmaydi, faqat yozuv sifati yaxshilanadi!
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DocumentGenerator;
