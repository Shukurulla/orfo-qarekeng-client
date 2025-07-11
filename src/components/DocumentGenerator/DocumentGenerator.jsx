// src/components/DocumentGenerator/DocumentGenerator.jsx - AUTH CHEKLOVI BILAN TO'LIQ VERSIYA

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
  Modal,
  Tooltip,
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
  LockOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { improveText, generateSong } from "../../utils/OrfoAIService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const DocumentGenerator = () => {
  const { t } = useTranslation();

  // Auth hook
  const {
    isAuthenticated,
    user,
    login,
    getRemainingLimit,
    canUse,
    useAction,
    getPlanStatus,
  } = useAuth();

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

  // Language options
  const languageOptions = [
    { value: "uz", label: t("language.uz"), flag: "🇺🇿" },
    { value: "kaa", label: t("language.kaa"), flag: "🏳️" },
    { value: "ru", label: "Rus tili", flag: "🇷🇺" },
  ];

  // Script options
  const scriptOptions = [
    { value: "latin", label: t("language.latin"), icon: "🅰️" },
    { value: "cyrillic", label: t("language.cyrillic"), icon: "Я" },
  ];

  // Show script selector
  const showScriptSelector =
    selectedLanguage === "uz" || selectedLanguage === "kaa";

  // Content type options
  const contentTypeOptions = [
    {
      value: "text",
      label: t("documentGenerator.improve"),
      icon: <FileTextOutlined />,
    },
    { value: "song", label: "Qo'shiq yaratish", icon: <SoundOutlined /> },
  ];

  // Song styles
  const songStyleOptions = [
    {
      value: "classik",
      label: "Klassik",
      icon: "🎼",
      desc: "An'anaviy uslubda",
    },
    { value: "rep", label: "Rep", icon: "🎤", desc: "Zamonaviy rep uslubida" },
    { value: "adabiy", label: "Adabiy", icon: "📚", desc: "Go'zal adabiy til" },
    {
      value: "dardli",
      label: "Dardli",
      icon: "💔",
      desc: "Hissiyotli va dardli",
    },
    {
      value: "hkz",
      label: "Halk",
      icon: "🎵",
      desc: "Xalq qo'shiqlari uslubida",
    },
  ];

  const styleTypes = [
    {
      value: "professional",
      label: t("documentGenerator.styles.professional"),
      icon: "💼",
      desc: "Rasmiy va professional uslub",
    },
    {
      value: "academic",
      label: t("documentGenerator.styles.academic"),
      icon: "🎓",
      desc: "Ilmiy-akademik uslub",
    },
    {
      value: "literary",
      label: t("documentGenerator.styles.literary"),
      icon: "📚",
      desc: "Go'zal va adabiy uslub",
    },
    {
      value: "formal",
      label: t("documentGenerator.styles.formal"),
      icon: "🏛️",
      desc: "Rasmiy hujjat uslubi",
    },
    {
      value: "friendly",
      label: t("documentGenerator.styles.friendly"),
      icon: "😊",
      desc: "Samimiy va do'stona uslub",
    },
    {
      value: "humorous",
      label: t("documentGenerator.styles.humorous"),
      icon: "😄",
      desc: "Hazil va kulgili uslub",
    },
  ];

  // Level descriptions
  const getLevelDescription = (level) => {
    const levels = {
      1: t("documentGenerator.levels.min"),
      2: t("documentGenerator.levels.light"),
      3: t("documentGenerator.levels.medium"),
      4: t("documentGenerator.levels.strong"),
      5: t("documentGenerator.levels.max"),
    };
    return levels[level] || levels[3];
  };

  // Show auth required modal
  const showAuthRequired = () => {
    Modal.confirm({
      title: "Tizimga kirish kerak",
      content: "Bu funksiyadan foydalanish uchun tizimga kirishingiz kerak.",
      okText: "Kirish",
      cancelText: "Bekor qilish",
      onOk: () => {
        login();
      },
    });
  };

  // Show limit exceeded modal
  const showLimitExceeded = () => {
    Modal.confirm({
      title: "Kunlik limit tugagan",
      content: (
        <div>
          <p>Document generator uchun kunlik limitingiz tugagan.</p>
          <p>Pro rejasiga o'tib cheksiz foydalaning!</p>
        </div>
      ),
      okText: "Pro rejasi",
      cancelText: "Yopish",
      onOk: () => {
        window.open("/pricing", "_blank");
      },
    });
  };

  // Demo functions
  const demoImproveText = () => {
    const demoText =
      "Bu matn yaxshilanishi kerak. U juda oddiy va professional emas.";
    setInputText(demoText);
    setIsImproving(true);

    setTimeout(() => {
      setImprovedText(
        "Ushbu matn professional darajada takomillashtirilishi zarur. U hozirgi holatda juda oddiy ko'rinishda bo'lib, ishbilarmonlik muhitida foydalanish uchun mos emas."
      );
      setShowResult(true);
      setIsImproving(false);
      message.info("Demo matn yaxshilash ko'rsatildi");
    }, 2000);
  };

  const demoGenerateSong = () => {
    setSongTopic("Sevgi");
    setIsImproving(true);

    setTimeout(() => {
      setGeneratedSong(`Sevgi - bu hayotning eng go'zal hissi,
Qalbimda yonib turadigan olov.
Sendan boshqa hech kim yo'q mening dunyomda,
Sen menga eng aziz va mukammal.

Kechalar uzun, seni sog'inaman,
Yulduzlarga qarab orzu qilaman.
Ertaga kelsa, senga uchrashaman,
Qalbimga to'lgan muhabbatni beraman.

O sevgilim, sen mening hayotimsan,
Sen mening umidim va kelajagim.
Sensiz bu dunyo ma'nosiz va qorong'i,
Sen bilan barcha orzular amalga oshi.`);
      setRecommendedMusic(
        "Klassik ballada uslubida, piano va skripka hamrohligida, sekin temp"
      );
      setShowResult(true);
      setIsImproving(false);
      message.info("Demo qo'shiq yaratish ko'rsatildi");
    }, 3000);
  };

  // Event handlers
  const handleInputChange = useCallback((e) => {
    setInputText(e.target.value);
    setError(null);
    setShowResult(false);
  }, []);

  const handleContentTypeChange = useCallback((value) => {
    setContentType(value);
    setError(null);
    setShowResult(false);
    setImprovedText("");
    setGeneratedSong("");
    setRecommendedMusic("");
  }, []);

  const handleLanguageChange = useCallback((value) => {
    setSelectedLanguage(value);
    setError(null);
  }, []);

  const handleScriptChange = useCallback((value) => {
    setSelectedScript(value);
    setError(null);
  }, []);

  const handleStyleChange = useCallback((value) => {
    setStyleType(value);
    setError(null);
  }, []);

  const handleSongStyleChange = useCallback((value) => {
    setSongStyle(value);
    setError(null);
  }, []);

  // Text improvement
  const handleImproveText = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUse("documentGenerator")) {
      showLimitExceeded();
      return;
    }

    if (!inputText.trim()) {
      message.warning(t("documentGenerator.placeholder"));
      return;
    }

    if (inputText.trim().length < 10) {
      message.warning("Matn juda qisqa. Kamida 10 ta belgi kiriting");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      // Use action to decrement limit
      await useAction("documentGenerator");

      const response = await improveText(inputText, {
        language: selectedLanguage,
        script: selectedScript,
        style: styleType,
        level: improvementLevel,
      });

      if (response.success) {
        setImprovedText(response.data.improved);
        setShowResult(true);
        message.success(t("common.success"));
      } else {
        setError(response.error);
        message.error(t("common.error"));
      }
    } catch (error) {
      const errorMsg = error.message || t("common.error");
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsImproving(false);
    }
  }, [
    inputText,
    selectedLanguage,
    selectedScript,
    styleType,
    improvementLevel,
    t,
    isAuthenticated,
    canUse,
    useAction,
  ]);

  // Song generation
  const handleGenerateSong = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUse("documentGenerator")) {
      showLimitExceeded();
      return;
    }

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
      // Use action to decrement limit
      await useAction("documentGenerator");

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

        const spellCheckedMsg = response.data.spellChecked
          ? " (Imloviy xatolar tekshirildi va to'g'irlandi)"
          : "";
        message.success(`${t("common.success")}${spellCheckedMsg}`);
      } else {
        setError(response.error);
        message.error(t("common.error"));
      }
    } catch (error) {
      const errorMsg = error.message || t("common.error");
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsImproving(false);
    }
  }, [
    songTopic,
    songStyle,
    selectedLanguage,
    selectedScript,
    songConditions,
    t,
    isAuthenticated,
    canUse,
    useAction,
  ]);

  // Copy function
  const handleCopy = useCallback(
    async (text) => {
      if (!text.trim()) {
        message.warning("Nusxalash uchun matn yo'q");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        message.success(t("common.copy"));
      } catch (error) {
        message.error(t("common.error"));
      }
    },
    [t]
  );

  // Clear function
  const handleClear = useCallback(() => {
    setInputText("");
    setImprovedText("");
    setGeneratedSong("");
    setRecommendedMusic("");
    setSongTopic("");
    setSongConditions("");
    setError(null);
    setShowResult(false);
    message.info(t("common.clear"));
  }, [t]);

  // Download function
  const handleDownload = useCallback(() => {
    const textToDownload =
      contentType === "song" ? generatedSong : improvedText;

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
    message.success(t("common.download"));
  }, [improvedText, generatedSong, contentType, t]);

  const planStatus = getPlanStatus();

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6} md={4}>
              <Space className="w-full">
                <FileTextOutlined className="text-blue-500" />
                <Select
                  value={contentType}
                  onChange={handleContentTypeChange}
                  className="w-full min-w-[150px]"
                  placeholder={t("documentGenerator.title")}
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
                placeholder={t("common.language")}
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
                  placeholder={t("language.latin")}
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
                    placeholder={t("documentGenerator.textStyle")}
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
                      {t("documentGenerator.improvementLevel")}:{" "}
                      {improvementLevel}
                    </Text>
                    <Slider
                      min={1}
                      max={5}
                      value={improvementLevel}
                      onChange={setImprovementLevel}
                      marks={{
                        1: t("documentGenerator.levels.min"),
                        3: t("documentGenerator.levels.medium"),
                        5: t("documentGenerator.levels.max"),
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
                {/* Auth status indicator */}
                {!isAuthenticated && (
                  <Tooltip title="Tizimga kirishingiz kerak">
                    <LockOutlined className="text-red-500" />
                  </Tooltip>
                )}

                {isAuthenticated &&
                  planStatus.plan === "pro" &&
                  planStatus.isActive && (
                    <Tooltip title="Pro foydalanuvchi">
                      <CrownOutlined className="text-yellow-500" />
                    </Tooltip>
                  )}

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={
                    !inputText.trim() &&
                    !songTopic.trim() &&
                    !improvedText.trim() &&
                    !generatedSong.trim()
                  }
                >
                  {t("common.clear")}
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Auth warning for non-authenticated users */}
          {!isAuthenticated && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <Text className="text-yellow-700 dark:text-yellow-300 text-xs">
                Bu funksiyalardan foydalanish uchun{" "}
                <Button
                  type="link"
                  size="small"
                  className="p-0 h-auto text-yellow-700"
                  onClick={login}
                >
                  tizimga kiring
                </Button>
                {" yoki demo versiyasini sinab ko'ring."}
              </Text>
            </div>
          )}

          {/* Limit warning for authenticated users */}
          {isAuthenticated && planStatus.plan === "start" && (
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
              <Text className="text-orange-700 dark:text-orange-300 text-xs">
                Kunlik limit: Document generator{" "}
                {getRemainingLimit("documentGenerator")}/3.{" "}
                <a
                  href="/pricing"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Pro rejasiga o'ting
                </a>
              </Text>
            </div>
          )}
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message={t("common.error")}
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
                  <span>{t("documentGenerator.originalText")}</span>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    onClick={demoImproveText}
                    className="bg-purple-500 text-white border-purple-500"
                  >
                    Demo
                  </Button>

                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleImproveText}
                    loading={isImproving}
                    disabled={!inputText.trim()}
                    size="large"
                  >
                    {isAuthenticated ? (
                      <>
                        {t("documentGenerator.improve")}
                        <span className="ml-1">
                          ({getRemainingLimit("documentGenerator")})
                        </span>
                      </>
                    ) : (
                      "Tizimga kiring"
                    )}
                  </Button>
                </Space>
              }
              className="h-full shadow-lg"
            >
              <div className="relative">
                {isImproving && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Spin size="large" />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {t("documentGenerator.improving")}
                      </div>
                    </div>
                  </div>
                )}

                <TextArea
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={t("documentGenerator.placeholder")}
                  className="min-h-[400px] resize-none"
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                />

                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>
                    {t("common.characters")}: {inputText.length}
                  </span>
                  <span>
                    {t("common.words")}:{" "}
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
                    onClick={demoGenerateSong}
                    className="bg-purple-500 text-white border-purple-500"
                  >
                    Demo
                  </Button>

                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerateSong}
                    loading={isImproving}
                    disabled={!songTopic.trim()}
                    size="large"
                  >
                    {isAuthenticated ? (
                      <>
                        Qo'shiq yaratish
                        <span className="ml-1">
                          ({getRemainingLimit("documentGenerator")})
                        </span>
                      </>
                    ) : (
                      "Tizimga kiring"
                    )}
                  </Button>
                </Space>
              }
              className="h-full shadow-lg"
            >
              <div className="relative">
                {isImproving && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Spin size="large" />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {t("common.loading")}
                      </div>
                    </div>
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
                      placeholder="Qo'shiq haqida qo'shimcha talablar yoki shartlar kiriting..."
                      className="min-h-[200px] resize-none"
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    />
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
                    <span>
                      {contentType === "song"
                        ? "Yaratilgan qo'shiq"
                        : t("documentGenerator.improvedText")}
                    </span>
                    <Tag color="green">{t("common.success")}</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() =>
                        handleCopy(
                          contentType === "song" ? generatedSong : improvedText
                        )
                      }
                      disabled={
                        !(contentType === "song"
                          ? generatedSong.trim()
                          : improvedText.trim())
                      }
                    >
                      {t("common.copy")}
                    </Button>

                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      disabled={
                        !(contentType === "song"
                          ? generatedSong.trim()
                          : improvedText.trim())
                      }
                    >
                      {t("common.download")}
                    </Button>
                  </Space>
                }
                className="h-full shadow-lg"
              >
                <div className="relative">
                  <TextArea
                    value={
                      contentType === "song" ? generatedSong : improvedText
                    }
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
                    <span>
                      {t("common.characters")}:{" "}
                      {
                        (contentType === "song" ? generatedSong : improvedText)
                          .length
                      }
                    </span>
                    <span>
                      {t("common.words")}:{" "}
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

        {/* Welcome Panel for non-authenticated users */}
        {!showResult && !inputText && !songTopic && !isAuthenticated && (
          <Col xs={24} lg={8}>
            <Card className="text-center h-full">
              <div className="space-y-4">
                <Title level={4}>
                  {contentType === "song"
                    ? "Qo'shiq yaratish"
                    : "Matn yaxshilash"}
                </Title>

                <Text className="text-gray-500">
                  {contentType === "song"
                    ? "Mavzu kiritib, professional qo'shiq yarating"
                    : "Matnni professional darajada yaxshilang"}
                </Text>

                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Professional uslub</div>
                  <div>• Grammatik to'g'irlash</div>
                  <div>• Mazmunni boyitish</div>
                  {contentType === "song" && <div>• Musiqa tavsiyalari</div>}
                </div>

                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                    Bu funksiyadan foydalanish uchun{" "}
                    <Button
                      type="link"
                      size="small"
                      className="p-0 h-auto"
                      onClick={login}
                    >
                      tizimga kiring
                    </Button>
                    {" yoki demo versiyasini sinab ko'ring"}
                  </Text>
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
