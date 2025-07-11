// src/components/SpellChecker/SpellChecker.jsx - AUTH CHEKLOVI BILAN TO'LIQ VERSIYA

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Spin,
  Alert,
  Space,
  Empty,
  message,
  List,
  Typography,
  Tag,
  Tooltip,
  Progress,
  Select,
  Modal,
  Input,
} from "antd";
import {
  CheckOutlined,
  ClearOutlined,
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  BulbOutlined,
  GlobalOutlined,
  EditOutlined,
  LockOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkSpelling,
  correctText,
  testConnection,
} from "../../utils/OrfoAIService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SpellChecker = () => {
  const textAreaRef = useRef(null);
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

  // Component state
  const [originalText, setOriginalText] = useState("");
  const [results, setResults] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [correctionInProgress, setCorrectionInProgress] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [displayText, setDisplayText] = useState("");

  // Language and script selection state
  const [selectedLanguage, setSelectedLanguage] = useState("uz");
  const [selectedScript, setSelectedScript] = useState("latin");

  // Language options
  const languageOptions = [
    {
      value: "uz",
      label: t("language.uz"),
      flag: "🇺🇿",
      description: "O'zbek tilida imlo tekshirish",
    },
    {
      value: "kaa",
      label: t("language.kaa"),
      flag: "🏳️",
      description: "Qoraqalpoq tilida imlo tekshirish",
    },
    {
      value: "ru",
      label: "Rus tili",
      flag: "🇷🇺",
      description: "Rus tilida imlo tekshirish",
    },
  ];

  // Script options
  const scriptOptions = [
    {
      value: "latin",
      label: t("language.latin"),
      icon: "🅰️",
      description: "Lotin harflari bilan",
    },
    {
      value: "cyrillic",
      label: t("language.cyrillic"),
      icon: "Я",
      description: "Kirill harflari bilan",
    },
  ];

  // Get current language info
  const getCurrentLanguageInfo = () => {
    const lang = languageOptions.find((l) => l.value === selectedLanguage);
    const script = scriptOptions.find((s) => s.value === selectedScript);
    return { lang, script };
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
  const showLimitExceeded = (action) => {
    const actionName =
      action === "spellCheck"
        ? "Imlo tekshirish"
        : action === "correctText"
        ? "Avtomatik to'g'irlash"
        : action;

    Modal.confirm({
      title: "Kunlik limit tugagan",
      content: (
        <div>
          <p>{actionName} uchun kunlik limitingiz tugagan.</p>
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

  // DEMO TEST DATA
  const demoTest = () => {
    const demoText =
      "Bu yerda imloviy xattalar bor. Menimcha bu matn to'g'rilanish kerek.";
    setOriginalText(demoText);
    setDisplayText(demoText);

    setIsChecking(true);
    setTimeout(() => {
      const demoResults = [
        {
          word: "xattalar",
          isCorrect: false,
          suggestions: ["xatolar"],
          start: 16,
          end: 24,
        },
        {
          word: "to'g'rilanish",
          isCorrect: false,
          suggestions: ["to'g'irlanishi"],
          start: 51,
          end: 64,
        },
        {
          word: "kerek",
          isCorrect: false,
          suggestions: ["kerak"],
          start: 65,
          end: 70,
        },
      ];

      const demoMistakes = [
        {
          mistakeWord: "xattalar",
          similarWords: [{ word: "xatolar", similarity: 95 }],
        },
        {
          mistakeWord: "to'g'rilanish",
          similarWords: [{ word: "to'g'irlanishi", similarity: 90 }],
        },
        {
          mistakeWord: "kerek",
          similarWords: [{ word: "kerak", similarity: 98 }],
        },
      ];

      setResults(demoResults);
      setMistakes(demoMistakes);
      setStatistics({
        totalWords: 10,
        correctWords: 7,
        incorrectWords: 3,
        accuracy: 70,
        textLength: 71,
        scriptType: "latin",
      });
      setHasChecked(true);
      setIsChecking(false);
      message.info("Demo natija ko'rsatildi");
    }, 1500);
  };

  // Event handlers
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setOriginalText(newText);
    setDisplayText(newText);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);
  }, []);

  const handleEditToggle = useCallback(() => {
    if (isEditMode) {
      setOriginalText(displayText);
      setHasChecked(false);
      setResults([]);
      setMistakes([]);
      setStatistics(null);
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, displayText]);

  const handleLanguageChange = useCallback((value) => {
    setSelectedLanguage(value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);

    if (value === "ru") {
      setSelectedScript("cyrillic");
    } else if (value === "uz") {
      setSelectedScript("latin");
    }
  }, []);

  const handleScriptChange = useCallback((value) => {
    setSelectedScript(value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);
  }, []);

  // Main spell check function
  const handleCheck = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUse("spellCheck")) {
      showLimitExceeded("spellCheck");
      return;
    }

    if (!originalText.trim()) {
      message.warning("Tekshirish uchun matn kiriting");
      return;
    }

    if (originalText.trim().length < 5) {
      message.warning("Matn juda qisqa, kamida 5 ta harf kiriting");
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Use action to decrement limit
      await useAction("spellCheck");

      const response = await checkSpelling(originalText, {
        language: selectedLanguage,
        script: selectedScript,
      });

      if (response.success) {
        const spellResults = response.data.results || [];
        const stats = response.data.statistics;

        setResults(spellResults);
        setStatistics(stats);
        setHasChecked(true);

        const errorWords = spellResults
          .filter((result) => !result.isCorrect)
          .map((result) => ({
            mistakeWord: result.word,
            similarWords:
              result.suggestions?.map((suggestion, index) => ({
                word: suggestion.word || suggestion,
                similarity: suggestion.confidence || 95 - index * 5,
              })) || [],
          }));

        setMistakes(errorWords);

        const { lang } = getCurrentLanguageInfo();

        if (errorWords.length === 0) {
          message.success(`${lang?.label || ""}da xato topilmadi`);
        } else {
          message.info(
            `${lang?.label || ""}da ${errorWords.length} ta imlo xatosi topildi`
          );
        }
      } else {
        setError(response.error);
        message.error("Tekshirishda xato yuz berdi");
      }
    } catch (err) {
      const errorMsg = err.message || "Noma'lum xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsChecking(false);
    }
  }, [
    originalText,
    selectedLanguage,
    selectedScript,
    isAuthenticated,
    canUse,
    useAction,
  ]);

  // Auto correct function
  const handleAutoCorrect = useCallback(async () => {
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    if (!canUse("correctText")) {
      showLimitExceeded("correctText");
      return;
    }

    if (!originalText.trim()) {
      message.warning("To'g'irlash uchun matn kiriting");
      return;
    }

    setCorrectionInProgress(true);
    setIsCorrecting(true);
    setError(null);

    try {
      // Use action to decrement limit
      await useAction("correctText");

      const response = await correctText(originalText, {
        language: selectedLanguage,
        script: selectedScript,
      });

      if (response.success) {
        const correctedText = response.data.corrected;

        if (correctedText !== originalText) {
          setOriginalText(correctedText);
          setDisplayText(correctedText);
          setHasChecked(false);
          setResults([]);
          setMistakes([]);
          setStatistics(null);

          message.success("Matn muvaffaqiyatli to'g'irlandi");

          setTimeout(() => {
            handleAutoCheckAfterCorrection(correctedText);
          }, 1000);
        } else {
          message.info("Matnda o'zgartirish kerak bo'lgan joy topilmadi");
        }
      } else {
        setError(response.error);
        message.error(response.error);
      }
    } catch (err) {
      const errorMsg = err.message || "To'g'irlashda xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsCorrecting(false);
      setCorrectionInProgress(false);
    }
  }, [
    originalText,
    selectedLanguage,
    selectedScript,
    isAuthenticated,
    canUse,
    useAction,
  ]);

  // Auto check after correction
  const handleAutoCheckAfterCorrection = useCallback(
    async (text) => {
      try {
        const response = await checkSpelling(text, {
          language: selectedLanguage,
          script: selectedScript,
        });
        if (response.success) {
          setResults(response.data.results || []);
          setStatistics(response.data.statistics);
          setHasChecked(true);

          const errorCount =
            response.data.results?.filter((r) => !r.isCorrect).length || 0;
          if (errorCount === 0) {
            message.success("Barcha xatolar to'g'irlandi");
          }
        }
      } catch (error) {
        console.error("Auto-check error:", error);
      }
    },
    [selectedLanguage, selectedScript]
  );

  // Clear function
  const handleClear = useCallback(() => {
    setOriginalText("");
    setDisplayText("");
    setResults([]);
    setMistakes([]);
    setStatistics(null);
    setHasChecked(false);
    setError(null);
    setCorrectionInProgress(false);
    setIsEditMode(false);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
    message.info("Tozalandi");
  }, []);

  // Replace word function
  const handleReplaceWord = useCallback(
    (mistakeWord, replacement) => {
      const regex = new RegExp(
        `\\b${mistakeWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      const newText = originalText.replace(regex, replacement);
      setOriginalText(newText);
      setDisplayText(newText);
      setHasChecked(false);
      setResults([]);
      setMistakes([]);
      setStatistics(null);
      message.success(
        `"${mistakeWord}" so'zi "${replacement}" bilan almashtirildi`
      );
    },
    [originalText]
  );

  // Render checked text with highlighting
  const renderCheckedText = useCallback(() => {
    if (!originalText || !mistakes.length) {
      return originalText;
    }

    const errorWords = new Set();
    mistakes.forEach((mistake) => {
      errorWords.add(mistake.mistakeWord.toLowerCase().trim());
    });

    const words = originalText.split(/(\s+)/);

    return words.map((word, index) => {
      const cleanWord = word
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:"'()]/g, "");

      if (errorWords.has(cleanWord) && word.trim()) {
        return (
          <span
            key={index}
            className="spell-error"
            data-word={cleanWord}
            style={{
              textDecoration: "underline",
              textDecorationStyle: "wavy",
              textDecorationColor: "#ff4d4f",
              textDecorationThickness: "2px",
              backgroundColor: "rgba(255, 77, 79, 0.1)",
              cursor: "pointer",
              borderRadius: "2px",
              padding: "1px 2px",
            }}
          >
            {word}
          </span>
        );
      } else {
        return <span key={index}>{word}</span>;
      }
    });
  }, [originalText, mistakes]);

  // Handle checked text click
  const handleCheckedTextClick = useCallback(
    (event) => {
      const target = event.target;
      if (target.classList.contains("spell-error")) {
        const wordData = target.dataset.word;
        const mistake = mistakes.find(
          (m) => m.mistakeWord.toLowerCase() === wordData
        );

        if (mistake && mistake.similarWords.length > 0) {
          const suggestions = mistake.similarWords.slice(0, 3);
          const suggestionText = suggestions
            .map((s) => `${s.word} (${s.similarity}%)`)
            .join("\n");

          const confirmed = window.confirm(
            `"${mistake.mistakeWord}" so'zi uchun takliflar:\n\n${suggestionText}\n\nEng yaxshi taklifni ("${suggestions[0].word}") qo'llashni istaysizmi?`
          );

          if (confirmed) {
            handleReplaceWord(mistake.mistakeWord, suggestions[0].word);
          }
        } else {
          message.info("Bu so'z uchun takliflar topilmadi");
        }
      }
    },
    [mistakes, handleReplaceWord]
  );

  // Initialize display text
  useEffect(() => {
    setDisplayText(originalText);
  }, [originalText]);

  // Get language and script info
  const { lang, script } = getCurrentLanguageInfo();
  const showScriptSelector =
    selectedLanguage === "uz" || selectedLanguage === "kaa";
  const planStatus = getPlanStatus();

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6} md={5}>
              <Space className="w-full">
                <GlobalOutlined className="text-blue-500" />
                <Select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="w-full min-w-[150px]"
                  placeholder="Tilni tanlang"
                >
                  {languageOptions.map((option) => (
                    <Option
                      key={option.value}
                      value={option.value}
                      title={option.description}
                    >
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
              <Col xs={24} sm={6} md={5}>
                <Select
                  value={selectedScript}
                  onChange={handleScriptChange}
                  className="w-full"
                  placeholder="Alifbo"
                  disabled={selectedLanguage === "ru"}
                >
                  {scriptOptions.map((option) => (
                    <Option
                      key={option.value}
                      value={option.value}
                      title={option.description}
                    >
                      <Space>
                        <span>{option.icon}</span>
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            )}

            <Col xs={24} sm={12} md={14}>
              <div className="w-full flex items-center gap-2">
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
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleCheck}
                  loading={isChecking}
                  disabled={!originalText.trim() || correctionInProgress}
                  size="large"
                >
                  {isAuthenticated ? (
                    <>
                      Tekshirish
                      <span className="ml-1">
                        ({getRemainingLimit("spellCheck")})
                      </span>
                    </>
                  ) : (
                    "Tizimga kiring"
                  )}
                </Button>

                <Button
                  icon={<SyncOutlined />}
                  onClick={handleAutoCorrect}
                  loading={isCorrecting}
                  disabled={!originalText.trim() || isChecking}
                  className="bg-green-500 text-white border-green-500 hover:bg-green-600"
                >
                  {isAuthenticated ? (
                    <>
                      To'g'irlash
                      <span className="ml-1">
                        ({getRemainingLimit("correctText")})
                      </span>
                    </>
                  ) : (
                    "Tizimga kiring"
                  )}
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!originalText.trim()}
                >
                  Tozalash
                </Button>

                <Button
                  onClick={demoTest}
                  className="bg-purple-500 text-white border-purple-500"
                >
                  Demo
                </Button>
              </div>
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
                Kunlik limit: Tekshirish {getRemainingLimit("spellCheck")}/3,
                To'g'irlash {getRemainingLimit("correctText")}/3.{" "}
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
          message="Xato yuz berdi"
          description={error}
          type="error"
          showIcon
          closable
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {/* Correction Progress Alert */}
      {correctionInProgress && (
        <Alert
          message={`${lang?.label || ""} - To'g'irlanmoqda`}
          description="Matn avtomatik to'g'irlanmoqda"
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Main Content */}
      <Row gutter={[24, 24]} className="h-full">
        {/* Main Editor Column */}
        <Col xs={24} lg={hasChecked && mistakes.length > 0 ? 16 : 24}>
          <Card
            className="h-full shadow-lg"
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <FileTextOutlined className="text-blue-500" />
                  <span>Imlo tekshirish</span>
                  <Tag color="blue">{lang?.label}</Tag>
                  <Tag color="green">{script?.label}</Tag>
                  {statistics && (
                    <Tag
                      color={
                        statistics.accuracy >= 90
                          ? "green"
                          : statistics.accuracy >= 70
                          ? "orange"
                          : "red"
                      }
                    >
                      {statistics.accuracy}% aniqlik
                    </Tag>
                  )}
                </Space>

                {hasChecked && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={handleEditToggle}
                    type={isEditMode ? "primary" : "default"}
                    size="small"
                  >
                    {isEditMode ? "Saqlash" : "Tahrirlash"}
                  </Button>
                )}
              </div>
            }
          >
            <div className="relative">
              {/* Loading Overlay */}
              {(isChecking || isCorrecting) && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin
                    size="large"
                    tip={
                      isChecking ? "Tekshirilmoqda..." : "To'g'irlanmoqda..."
                    }
                  />
                </div>
              )}

              {/* Text Editor */}
              <div className="relative">
                {(!hasChecked || isEditMode) && (
                  <TextArea
                    ref={textAreaRef}
                    value={isEditMode ? displayText : originalText}
                    onChange={
                      isEditMode
                        ? (e) => setDisplayText(e.target.value)
                        : handleTextChange
                    }
                    placeholder="Bu yerga tekshirmoqchi bo'lgan matnni yozing..."
                    className="w-full min-h-[400px] resize-none"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {hasChecked && !isEditMode && (
                  <div
                    className="w-full min-h-[400px] p-3 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-text overflow-auto"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                      fontFamily: "inherit",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                    onClick={handleCheckedTextClick}
                  >
                    {renderCheckedText()}
                  </div>
                )}
              </div>

              {/* Text Statistics */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  Belgilar: {(isEditMode ? displayText : originalText).length} |{" "}
                  So'zlar:{" "}
                  {
                    (isEditMode ? displayText : originalText)
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }
                </span>
                {statistics && (
                  <span>
                    To'g'ri: {statistics.correctWords} | Xato:{" "}
                    {statistics.incorrectWords}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Col>

        {/* Results Panel */}
        {hasChecked && (
          <Col xs={24} lg={8}>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Statistics Card */}
                {statistics && (
                  <Card
                    title={
                      <Space>
                        <BookOutlined />
                        <span>Statistika</span>
                        <Tag color="blue">{lang?.label}</Tag>
                      </Space>
                    }
                    size="small"
                    className="shadow-lg"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Text strong>Aniqlik darajasi</Text>
                          <Text
                            strong
                            className={
                              statistics.accuracy >= 90
                                ? "text-green-500"
                                : statistics.accuracy >= 70
                                ? "text-orange-500"
                                : "text-red-500"
                            }
                          >
                            {statistics.accuracy}%
                          </Text>
                        </div>
                        <Progress
                          percent={statistics.accuracy}
                          strokeColor={
                            statistics.accuracy >= 90
                              ? "#52c41a"
                              : statistics.accuracy >= 70
                              ? "#faad14"
                              : "#ff4d4f"
                          }
                          size="small"
                          showInfo={false}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Text type="secondary">Jami so'zlar</Text>
                          <div className="font-semibold">
                            {statistics.totalWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">To'g'ri so'zlar</Text>
                          <div className="font-semibold text-green-500">
                            {statistics.correctWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">Xato so'zlar</Text>
                          <div className="font-semibold text-red-500">
                            {statistics.incorrectWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">Aniqlangan alifbo</Text>
                          <div className="font-semibold">
                            {statistics.scriptType === "cyrillic"
                              ? "Kirill"
                              : statistics.scriptType === "latin"
                              ? "Lotin"
                              : "Aralash"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Mistakes Card */}
                {mistakes.length > 0 ? (
                  <Card
                    title={
                      <Space>
                        <ExclamationCircleOutlined className="text-red-500" />
                        <span>Takliflar</span>
                        <Tag color="red">{mistakes.length} ta xato</Tag>
                        <Tag color="blue">{lang?.label}</Tag>
                      </Space>
                    }
                    size="small"
                    className="shadow-lg"
                  >
                    <List
                      size="small"
                      dataSource={mistakes}
                      renderItem={(mistake, index) => (
                        <List.Item key={index} className="px-0">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                              <Text className="text-red-500 font-medium">
                                "{mistake.mistakeWord}"
                              </Text>
                              <Tag size="small" color="blue">
                                {mistake.similarWords.length} taklif
                              </Tag>
                            </div>

                            {mistake.similarWords.length > 0 && (
                              <div className="space-y-1">
                                <Text
                                  type="secondary"
                                  className="text-xs flex items-center"
                                >
                                  <BulbOutlined className="mr-1" />
                                  {lang?.label}da takliflar:
                                </Text>
                                <div className="space-y-1">
                                  {mistake.similarWords
                                    .slice(0, 3)
                                    .map((similar, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Text className="font-medium">
                                            {similar.word}
                                          </Text>
                                          <Tag
                                            size="small"
                                            color={
                                              similar.similarity >= 80
                                                ? "green"
                                                : similar.similarity >= 60
                                                ? "orange"
                                                : "default"
                                            }
                                          >
                                            {similar.similarity}%
                                          </Tag>
                                        </div>
                                        <Button
                                          type="primary"
                                          size="small"
                                          onClick={() =>
                                            handleReplaceWord(
                                              mistake.mistakeWord,
                                              similar.word
                                            )
                                          }
                                        >
                                          Qo'llash
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                ) : (
                  hasChecked && (
                    <Card className="text-center shadow-lg">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div>
                            <Text strong className="text-green-500">
                              Ajoyib!
                            </Text>
                            <div className="text-sm text-gray-500">
                              {lang?.label}da xato topilmadi
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </Col>
        )}

        {/* Welcome Panel */}
        {!hasChecked && !originalText && (
          <Col xs={24} lg={8}>
            <Card className="text-center h-full">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-4">
                    <Title level={4}>Imlo tekshirish</Title>
                    <Text className="text-gray-500">
                      Bu yerga tekshirmoqchi bo'lgan matnni yozing...
                    </Text>

                    <div className="text-xs text-gray-400 space-y-1">
                      <div>• Aniqlik darajasi</div>
                      <div>
                        • {lang?.label} va {script?.label}
                      </div>
                      <div>• Imlo tekshirish</div>
                      <div>• Avtomatik to'g'irlash</div>
                    </div>

                    {/* Language specific tips */}
                    <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Text className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>{lang?.label}:</strong>{" "}
                        {selectedLanguage === "uz"
                          ? "O'zbek tilining so'z boyligi va grammatik qoidalariga mos tekshirish"
                          : selectedLanguage === "kaa"
                          ? "Qoraqalpoq tilining o'ziga xos xususiyatlari va leksikasiga mos tekshirish"
                          : "Rus tilining imlo va grammatik qoidalariga mos tekshirish"}
                      </Text>
                    </div>

                    {/* Auth prompt for non-authenticated users */}
                    {!isAuthenticated && (
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
                    )}
                  </div>
                }
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Custom CSS for spell error highlighting */}
      <style jsx>{`
        :global(.spell-error) {
          transition: all 0.2s ease;
          position: relative;
          display: inline;
        }

        :global(.spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.2) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
        }

        :global(.spell-error:active) {
          transform: translateY(0);
          background-color: rgba(255, 77, 79, 0.3) !important;
        }

        :global(.dark .spell-error) {
          background-color: rgba(255, 77, 79, 0.08) !important;
        }

        :global(.dark .spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.15) !important;
        }

        /* Tooltip style */
        :global(.spell-error::after) {
          content: "Xato so'z - bosing";
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 1000;
        }

        :global(.spell-error:hover::after) {
          opacity: 1;
        }

        /* Focus styles */
        :global(.spell-error:focus) {
          outline: 2px solid #1890ff;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default SpellChecker;
