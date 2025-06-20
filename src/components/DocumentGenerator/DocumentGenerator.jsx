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
  SoundOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { improveText, generateSong } from "@/utils/OrfoAIService";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const DocumentGenerator = () => {
  // State
  const [inputText, setInputText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("uz");
  const [selectedScript, setSelectedScript] = useState("latin");
  const [improvementLevel, setImprovementLevel] = useState(3);
  const [styleType, setStyleType] = useState("professional");
  const [contentType, setContentType] = useState("text"); // text, song
  const [songStyle, setSongStyle] = useState("classik");
  const [songTopic, setSongTopic] = useState("");
  const [songConditions, setSongConditions] = useState("");
  const [generatedSong, setGeneratedSong] = useState("");
  const [recommendedMusic, setRecommendedMusic] = useState("");
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

  // Kontent turi opsiyalari
  const contentTypeOptions = [
    { value: "text", label: "Matn yaxshilash", icon: <FileTextOutlined /> },
    { value: "song", label: "Qo'shiq yaratish", icon: <SoundOutlined /> },
  ];

  // Qo'shiq uslublari
  const songStyleOptions = [
    { value: "classik", label: "Klassik", icon: "🎼", desc: "An'anaviy uslubda" },
    { value: "rep", label: "Rep", icon: "🎤", desc: "Zamonaviy rep uslubida" },
    { value: "adabiy", label: "Adabiy", icon: "📚", desc: "Go'zal adabiy til" },
    { value: "dardli", label: "Dardli", icon: "💔", desc: "Hissiyotli va dardli" },
    { value: "hkz", label: "Halk", icon: "🎵", desc: "Xalq qo'shiqlari uslubida" },
  ];

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
    {
      value: "humorous",
      label: "Hazilli",
      icon: "😄",
      desc: "Hazil va kulgili uslub",
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

  // Kontent turi o'zgarishi
  const handleContentTypeChange = useCallback((value) => {
    setContentType(value);
    setError(null);
    setShowResult(false);
    setImprovedText("");
    setGeneratedSong("");
    setRecommendedMusic("");
  }, []);

  // Til tanlash
  const handleLanguageChange = useCallback((value) => {
    setSelectedLanguage(value);
    setError(null);
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

  // Qo'shiq uslubi tanlash
  const handleSongStyleChange = useCallback((value) => {
    setSongStyle(value);
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
        script: selectedScript, // Bu script parametri to'g'ri uzatiladi
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
  }, [inputText, selectedLanguage, selectedScript, styleType, improvementLevel]);

  // Qo'shiq yaratish
  const handleGenerateSong = useCallback(async () => {
    if (!songTopic.trim()) {
      message.warning("Iltimos, qo'shiq mavzusini kiriting");
      return;
    }

    if (songTopic.trim().length < 3) {
      message.warning("Mavzu juda qisqa. Kamida 3 ta belgi kiriting");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await generateSong({
        topic: songTopic,
        style: songStyle,
        language: selectedLanguage,
        script: selectedScript,
        conditions: songConditions,
      });

      if (response.success) {
        setGeneratedSong(response.data.song);
        setRecommendedMusic(response.data.recommendedMusic);
        setShowResult(true);
        message.success("Qo'shiq muvaffaqiyatli yaratildi!");
      } else {
        setError(response.error);
        message.error("Qo'shiq yaratishda xato yuz berdi");
      }
    } catch (error) {
      const errorMsg = error.message || "Qo'shiq yaratishda xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsImproving(false);
    }
  }, [songTopic, songStyle, selectedLanguage, selectedScript, songConditions]);

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
    setGeneratedSong("");
    setRecommendedMusic("");
    setSongTopic("");
    setSongConditions("");
    setError(null);
    setShowResult(false);
    message.info("Hammasi tozalandi");
  }, []);

  // Yuklab olish
  const handleDownload = useCallback(() => {
    const textToDownload = contentType === "song" ? generatedSong : improvedText;
    
    if (!textToDownload.trim()) {
      message.warning("Yuklab olish uchun matn yo'q");
      return;
    }

    const element = document.createElement("a");
    const fileName = contentType === "song" ? "qoshiq" : "yaxshilangan_matn";
    const file = new Blob([textToDownload], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success(`${contentType === "song" ? "Qo'shiq" : "Matn"} yuklab olindi`);
  }, [improvedText, generatedSong, contentType]);

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6} md={4}>
              <Space className="w-full">
                <RobotOutlined className="text-blue-500" />
                <Select
                  value={contentType}
                  onChange={handleContentTypeChange}
                  className="w-full min-w-[150px]"
                  placeholder="Tur tanlang"
                >
                  {contentTypeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>

            <Col xs={24} sm={6} md={4}>
              <Select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="w-full"
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
            </Col>

            {showScriptSelector && (
              <Col xs={24} sm={6} md={3}>
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

            {contentType === "text" && (
              <>
                <Col xs={24} sm={6} md={showScriptSelector ? 4 : 5}>
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

                <Col xs={24} sm={6} md={showScriptSelector ? 4 : 5}>
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
              </>
            )}

            {contentType === "song" && (
              <Col xs={24} sm={6} md={showScriptSelector ? 5 : 6}>
                <Select
                  value={songStyle}
                  onChange={handleSongStyleChange}
                  className="w-full"
                  placeholder="Qo'shiq uslubini tanlang"
                >
                  {songStyleOptions.map((style) => (
                    <Option key={style.value} value={style.value}>
                      <Space>
                        <span>{style.icon}</span>
                        {style.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            )}

            <Col xs={24} sm={24} md={showScriptSelector ? 4 : 5}>
              <Space className="w-full justify-end" wrap>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!inputText.trim() && !songTopic.trim() && !improvedText.trim() && !generatedSong.trim()}
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
            <Col xs={24} md={6}>
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
              <Text strong>Tur:</Text>{" "}
              {contentTypeOptions.find((c) => c.value === contentType)?.label}
            </Col>
            {contentType === "text" && (
              <Col xs={24} md={showScriptSelector ? 8 : 10}>
                <Text strong>Uslub:</Text>{" "}
                {styleTypes.find((s) => s.value === styleType)?.label} |{" "}
                <Text strong>Daraja:</Text> {getLevelDescription(improvementLevel)}
              </Col>
            )}
            {contentType === "song" && (
              <Col xs={24} md={showScriptSelector ? 8 : 10}>
                <Text strong>Qo'shiq uslubi:</Text>{" "}
                {songStyleOptions.find((s) => s.value === songStyle)?.label}
              </Col>
            )}
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
          {contentType === "text" ? (
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
          ) : (
            <Card
              title={
                <Space>
                  <SoundOutlined />
                  <span>Qo'shiq yaratish</span>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerateSong}
                    loading={isImproving}
                    disabled={!songTopic.trim()}
                    size="large"
                  >
                    AI Qo'shiq yarat
                  </Button>
                </Space>
              }
              className="h-full shadow-lg"
            >
              <div className="relative">
                {isImproving && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                    <Spin size="large" tip="Gemini AI qo'shiq yaratayapti..." />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Text strong className="block mb-2">
                      Qo'shiq mavzusi *
                    </Text>
                    <Input
                      value={songTopic}
                      onChange={(e) => setSongTopic(e.target.value)}
                      placeholder="Masalan: sevgi, vatan, dostlik, tabiat..."
                      size="large"
                    />
                  </div>

                  <div>
                    <Text strong className="block mb-2">
                      Qo'shimcha shartlar (ixtiyoriy)
                    </Text>
                    <TextArea
                      value={songConditions}
                      onChange={(e) => setSongConditions(e.target.value)}
                      placeholder="Qo'shiq haqida qo'shimcha talablar yoki shartlar kiriting...

Masalan:
- 4 kuplet bo'lsin
- Har kupletda 4 qator bo'lsin
- Qofiya ABAB bo'lsin
- Yosh odamlarga mo'ljallangan bo'lsin"
                      className="min-h-[200px] resize-none"
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    />
                  </div>

                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Text className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>AI Qo'shiq yaratuvchi:</strong> Tanlangan uslub va tilga mos holda professional qo'shiq matnini yaratadi va mos musiqa tavsiya qiladi.
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          )}
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
                    <span>{contentType === "song" ? "Yaratilgan qo'shiq" : "Yaxshilangan matn"}</span>
                    <Tag color="green">Tayyor</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(contentType === "song" ? generatedSong : improvedText)}
                      disabled={!(contentType === "song" ? generatedSong.trim() : improvedText.trim())}
                    >
                      Nusxalash
                    </Button>

                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      disabled={!(contentType === "song" ? generatedSong.trim() : improvedText.trim())}
                    >
                      Yuklab olish
                    </Button>
                  </Space>
                }
                className="h-full shadow-lg"
              >
                <div className="relative">
                  <TextArea
                    value={contentType === "song" ? generatedSong : improvedText}
                    readOnly
                    className="min-h-[400px] resize-none bg-gray-50 dark:bg-gray-800"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                    }}
                  />

                  {contentType === "song" && recommendedMusic && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <Title level={5} className="!mb-2 flex items-center">
                        <SoundOutlined className="mr-2 text-green-500" />
                        Tavsiya etilgan musiqa
                      </Title>
                      <Text className="text-sm">{recommendedMusic}</Text>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Belgilar: {(contentType === "song" ? generatedSong : improvedText).length}</span>
                    <span>
                      So'zlar:{" "}
                      {
                        (contentType === "song" ? generatedSong : improvedText)
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
                {contentType === "text" ? (
                  <>
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
                        <div>• Professional qo'shiq matnini oling</div>
                        <div>• Mos musiqa tavsiyasini ko'ring</div>
                      </div>

                      <Divider />

                      <Title level={5}>Qo'shiq uslublari:</Title>
                      <div className="space-y-1 text-sm">
                        {songStyleOptions.map((style) => (
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
                          <strong>AI Qo'shiq yaratuvchi:</strong> Kamida 3 kuplet qo'shiq yaratadi va mos musiqa tavsiya qiladi!
                        </Text>
                      </div>
                    </div>
                  </>
                ) : ""}
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DocumentGenerator;