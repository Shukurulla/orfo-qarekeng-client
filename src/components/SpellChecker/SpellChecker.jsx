// src/components/SpellChecker/SpellChecker.jsx - IMPORT FIX

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
  Input, // QO'SHILDI
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
  FontSizeOutlined,
  EditOutlined,
  LockOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkSpelling,
  correctText,
  testConnection,
} from "@/utils/OrfoAIService";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { showLoginModal, authUtils } from "@/store/slices/authSlice"; // authUtils import qilindi

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SpellChecker = () => {
  const textAreaRef = useRef(null);
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  // Auth state - xavfsiz destructuring
  const authState = useAppSelector((state) => state.auth || {});
  const { user = null, isAuthenticated = false } = authState;

  // State
  const [originalText, setOriginalText] = useState("");
  const [results, setResults] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [correctionInProgress, setCorrectionInProgress] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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

  // Check if user can use feature
  const canUseFeature = (action) => {
    if (!isAuthenticated) return false;
    return authUtils.checkDailyLimit(user, action);
  };

  // Get remaining limit
  const getRemainingLimit = (action) => {
    if (!isAuthenticated) return 0;
    return authUtils.getRemainingLimit(user, action);
  };

  // Show auth required modal
  const showAuthRequired = () => {
    Modal.confirm({
      title: "Tizimga kirish kerak",
      content: "Bu funksiyadan foydalanish uchun tizimga kirishingiz kerak.",
      okText: "Kirish",
      cancelText: "Bekor qilish",
      onOk: () => {
        dispatch(showLoginModal("/spellcheck"));
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
        // Navigate to pricing page
        window.open("/pricing", "_blank");
      },
    });
  };

  // DEMO TEST DATA - faqat testing uchun
  const demoTest = () => {
    setOriginalText(
      "Bu yerda imloviy xattalar bor. Menimcha bu matn to'g'rilanish kerek."
    );
    setDisplayText(
      "Bu yerda imloviy xattalar bor. Menimcha bu matn to'g'rilanish kerek."
    );

    // Demo results
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
      message.info("Demo natija ko'rsatildi");
    }, 1000);
  };

  // Matn o'zgarishi
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

  // Edit mode toggle
  const handleEditToggle = useCallback(() => {
    if (isEditMode) {
      // Save changes
      setOriginalText(displayText);
      setHasChecked(false);
      setResults([]);
      setMistakes([]);
      setStatistics(null);
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, displayText]);

  // Language change handler
  const handleLanguageChange = useCallback((value) => {
    setSelectedLanguage(value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);

    // Auto-detect appropriate script for language
    if (value === "ru") {
      setSelectedScript("cyrillic");
    } else if (value === "uz") {
      setSelectedScript("latin"); // O'zbek tili uchun lotin default
    }
    // Qoraqalpoq uchun user tanlashi mumkin
  }, []);

  // Script change handler
  const handleScriptChange = useCallback((value) => {
    setSelectedScript(value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);
  }, []);

  // Imlo tekshirish
  const handleCheck = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUseFeature("spellCheck")) {
      showLimitExceeded("spellCheck");
      return;
    }

    if (!originalText.trim()) {
      message.warning(t("spellChecker.errors.empty"));
      return;
    }

    if (originalText.trim().length < 5) {
      message.warning(t("spellChecker.errors.tooShort"));
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
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

        // Xato so'zlarni ajratib olish
        const errorWords = spellResults
          .filter((result) => !result.isCorrect)
          .map((result) => ({
            mistakeWord: result.word,
            similarWords:
              result.suggestions?.map((suggestion, index) => ({
                word: suggestion.word || suggestion,
                similarity: suggestion.confidence || 95 - index * 5, // Default confidence
              })) || [],
          }));

        setMistakes(errorWords);

        const { lang } = getCurrentLanguageInfo();

        if (errorWords.length === 0) {
          message.success(`${lang.label}da xato topilmadi`);
        } else {
          message.info(
            `${lang.label}da ${errorWords.length} ta imlo xatosi topildi`
          );
        }
      } else {
        setError(response.error);
        message.error(t("spellChecker.errors.unknown"));
      }
    } catch (err) {
      const errorMsg = err.message || t("spellChecker.errors.unknown");

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsChecking(false);
    }
  }, [
    originalText,
    selectedLanguage,
    selectedScript,
    t,
    isAuthenticated,
    user,
  ]);

  // Avtomatik to'g'irlash
  const handleAutoCorrect = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUseFeature("correctText")) {
      showLimitExceeded("correctText");
      return;
    }

    if (!originalText.trim()) {
      message.warning(t("spellChecker.errors.empty"));
      return;
    }

    setCorrectionInProgress(true);
    setIsCorrecting(true);
    setError(null);

    try {
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

          const { lang } = getCurrentLanguageInfo();
          message.success(t("common.success"));

          // Auto-check after correction
          setTimeout(() => {
            handleAutoCheckAfterCorrection(correctedText);
          }, 1000);
        } else {
          message.info(t("spellChecker.suggestions.noSuggestions"));
        }
      } else {
        setError(response.error);
        message.error(response.error);
      }
    } catch (err) {
      const errorMsg = err.message || t("spellChecker.errors.unknown");
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
    t,
    isAuthenticated,
    user,
  ]);

  // To'g'irlashdan keyin avtomatik tekshirish
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
            message.success(t("common.success"));
          }
        }
      } catch (error) {
        console.error("Auto-check error:", error);
      }
    },
    [selectedLanguage, selectedScript, t]
  );

  // Tozalash
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
    message.info(t("common.clear"));
  }, [t]);

  // So'zni almashtirish
  const handleReplaceWord = useCallback(
    (mistakeWord, replacement) => {
      // Aniq so'zni topish uchun word boundary ishlatish
      const regex = new RegExp(
        `\\b${mistakeWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi" // case-insensitive qo'shildi
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

  // Tekshirilgan matnni render qilish
  const renderCheckedText = useCallback(() => {
    if (!originalText || !mistakes.length) {
      return originalText;
    }

    // Xato so'zlarning ro'yxatini yaratish
    const errorWords = new Set();
    mistakes.forEach((mistake) => {
      errorWords.add(mistake.mistakeWord.toLowerCase().trim());
    });

    // Matnni so'zlar bo'yicha ajratish
    const words = originalText.split(/(\s+)/); // Oraliq bo'shliqlarni ham saqlash

    return words.map((word, index) => {
      const cleanWord = word
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:"'()]/g, "");

      if (errorWords.has(cleanWord) && word.trim()) {
        // Xato so'z - qizil tagiga chiziq bilan
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
        // Oddiy so'z yoki bo'shliq
        return <span key={index}>{word}</span>;
      }
    });
  }, [originalText, mistakes]);

  // Tekshirilgan matndagi so'zga click qilish
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
          message.info(t("spellChecker.suggestions.noSuggestions"));
        }
      }
    },
    [mistakes, handleReplaceWord, t]
  );

  // Initialize display text
  useEffect(() => {
    setDisplayText(originalText);
  }, [originalText]);

  const { lang, script } = getCurrentLanguageInfo();

  // Alifbo ko'rsatilishini tekshirish
  const showScriptSelector =
    selectedLanguage === "uz" || selectedLanguage === "kaa";

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} className="justify-between" align="middle">
            <Col xs={24} sm={6} md={5}>
              <Space className="">
                <GlobalOutlined className="text-blue-500" />
                <Select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="w-full min-w-[150px]"
                  placeholder={t("common.language")}
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
                  placeholder={t("language.latin")}
                  disabled={selectedLanguage === "ru"} // Rus tili uchun faqat kirill
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

            <Col xs={24} sm={8} md={14}>
              <div className="w-full flex items-center gap-2">
                {/* Auth status indicator */}
                {!isAuthenticated && (
                  <Tooltip title="Tizimga kirishingiz kerak">
                    <LockOutlined className="text-red-500" />
                  </Tooltip>
                )}

                {isAuthenticated && user?.plan === "pro" && (
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
                  {t("spellChecker.checkWithLanguage")}
                  {isAuthenticated && (
                    <span className="ml-1">
                      ({getRemainingLimit("spellCheck")})
                    </span>
                  )}
                </Button>

                <Button
                  icon={<SyncOutlined />}
                  onClick={handleAutoCorrect}
                  loading={isCorrecting}
                  disabled={!originalText.trim() || isChecking}
                  type="default"
                  className="bg-green-500 text-white border-green-500 hover:bg-green-600"
                >
                  {t("spellChecker.autoCorrect")}
                  {isAuthenticated && (
                    <span className="ml-1">
                      ({getRemainingLimit("correctText")})
                    </span>
                  )}
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!originalText.trim()}
                >
                  {t("common.clear")}
                </Button>

                {/* DEMO BUTTON - faqat testing uchun */}
                <Button
                  onClick={demoTest}
                  className="bg-purple-500 text-white border-purple-500"
                >
                  Demo
                </Button>
              </div>
            </Col>
          </Row>

          {/* Limit warning */}
          {isAuthenticated && user?.plan === "start" && (
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
              <Text className="text-orange-700 dark:text-orange-300 text-xs">
                Kunlik limit: Imlo tekshirish {getRemainingLimit("spellCheck")}
                /3, To'g'irlash {getRemainingLimit("correctText")}/3.
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

      {/* Correction Progress Alert */}
      {correctionInProgress && (
        <Alert
          message={`${lang?.label} - ${t("spellChecker.correcting")}`}
          description={t("spellChecker.correcting")}
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
                  <span>{t("spellChecker.title")}</span>
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
                      {statistics.accuracy}%{" "}
                      {t("spellChecker.statistics.accuracy")}
                    </Tag>
                  )}
                </Space>

                {/* Edit button */}
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
                      isChecking
                        ? t("spellChecker.checking")
                        : t("spellChecker.correcting")
                    }
                  />
                </div>
              )}

              {/* Text Editor */}
              <div className="relative">
                {/* Normal textarea - ko'rinadi agar tekshirilmagan bo'lsa yoki edit mode da */}
                {(!hasChecked || isEditMode) && (
                  <TextArea
                    ref={textAreaRef}
                    value={isEditMode ? displayText : originalText}
                    onChange={
                      isEditMode
                        ? (e) => setDisplayText(e.target.value)
                        : handleTextChange
                    }
                    placeholder={t("spellChecker.placeholder")}
                    className="w-full min-h-[400px] resize-none"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5715",
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {/* Checked text display - ko'rinadi agar tekshirilgan bo'lsa va edit mode da emas */}
                {hasChecked && !isEditMode && (
                  <div
                    className="w-full min-h-[400px] p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-text overflow-auto"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5715",
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
                  {t("common.characters")}:{" "}
                  {(isEditMode ? displayText : originalText).length} |{" "}
                  {t("common.words")}:{" "}
                  {
                    (isEditMode ? displayText : originalText)
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }
                </span>
                {statistics && (
                  <span>
                    {t("spellChecker.statistics.correctWords")}:{" "}
                    {statistics.correctWords} |{" "}
                    {t("spellChecker.statistics.incorrectWords")}:{" "}
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
                        <span>{t("spellChecker.statistics.title")}</span>
                        <Tag color="blue">{lang?.label}</Tag>
                      </Space>
                    }
                    size="small"
                    className="shadow-lg"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Text strong>
                            {t("spellChecker.statistics.accuracy")}
                          </Text>
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
                          <Text type="secondary">
                            {t("spellChecker.statistics.totalWords")}
                          </Text>
                          <div className="font-semibold">
                            {statistics.totalWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">
                            {t("spellChecker.statistics.correctWords")}
                          </Text>
                          <div className="font-semibold text-green-500">
                            {statistics.correctWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">
                            {t("spellChecker.statistics.incorrectWords")}
                          </Text>
                          <div className="font-semibold text-red-500">
                            {statistics.incorrectWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">
                            {t("spellChecker.detectedScript")}
                          </Text>
                          <div className="font-semibold">
                            {statistics.scriptType === "cyrillic"
                              ? t("transliterator.cyrillic")
                              : statistics.scriptType === "latin"
                              ? t("transliterator.latin")
                              : t("transliterator.mixed")}
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
                        <span>{t("spellChecker.suggestions.title")}</span>
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
                                {mistake.similarWords.length}{" "}
                                {t("spellChecker.suggestions.title")}
                              </Tag>
                            </div>

                            {mistake.similarWords.length > 0 && (
                              <div className="space-y-1">
                                <Text
                                  type="secondary"
                                  className="text-xs flex items-center"
                                >
                                  <BulbOutlined className="mr-1" />
                                  {lang?.label}da{" "}
                                  {t("spellChecker.suggestions.title")}:
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
                                          {t("common.apply")}
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
                              {t("common.success")}!
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
                  <div className="space-y-2">
                    <Title level={4}>{t("spellChecker.title")}</Title>
                    <Text className="text-gray-500">
                      {t("spellChecker.placeholder")}
                    </Text>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>• {t("spellChecker.statistics.accuracy")}</div>
                      <div>
                        • {lang?.label} va {script?.label}
                      </div>
                      <div>• {t("spellChecker.title")}</div>
                      <div>• {t("spellChecker.autoCorrect")}</div>
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
                            onClick={() =>
                              dispatch(showLoginModal("/spellcheck"))
                            }
                          >
                            tizimga kiring
                          </Button>
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
      `}</style>
    </div>
  );
};

export default SpellChecker;
