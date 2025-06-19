// src/components/SpellChecker/SpellChecker.jsx

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
} from "antd";
import {
  CheckOutlined,
  ClearOutlined,
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  BulbOutlined,
  RobotOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkSpelling,
  correctText,
  testConnection,
} from "@/utils/geminiService";

const { Text, Title } = Typography;

const SpellChecker = () => {
  const textAreaRef = useRef(null);

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

  // Matn o'zgarishi
  const handleTextChange = useCallback((e) => {
    setOriginalText(e.target.value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);
  }, []);
  useEffect(() => {
    console.log(mistakes);
  }, [mistakes]);

  // Imlo tekshirish - Gemini bilan
  const handleCheck = useCallback(async () => {
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
      const response = await checkSpelling(originalText);
      console.log("Spell check response:", response); // Debug uchun

      if (response.success) {
        const spellResults = response.data.results || [];
        const stats = response.data.statistics;

        console.log("Spell results:", spellResults); // Debug uchun

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

        if (errorWords.length === 0) {
          message.success("Ajoyib! Matnda xato topilmadi");
        } else {
          message.info(`${errorWords.length} ta imlo xatosi topildi`);
        }
      } else {
        console.error("Spell check failed:", response.error); // Debug uchun
        setError(response.error);
        message.error(response.error);
      }
    } catch (err) {
      const errorMsg = err.message || "Tekshirishda xato yuz berdi";
      console.error("Spell check error:", err);

      // Gemini API specific errors
      if (err.message?.includes("API Error: 404")) {
        setError(
          "RapidAPI endpoint topilmadi. URL yoki API kalitini tekshiring."
        );
      } else if (err.message?.includes("API Error: 403")) {
        setError(
          "RapidAPI kaliti noto'g'ri yoki ruxsat yo'q. API kalitingizni tekshiring."
        );
      } else if (err.message?.includes("API Error: 429")) {
        setError(
          "RapidAPI quotasini oshirib yubordingiz. Keyinroq urinib ko'ring."
        );
      } else if (err.message?.includes("Network error")) {
        setError("Internet aloqasi muammosi. Internetingizni tekshiring.");
      } else {
        setError(errorMsg);
      }
      message.error(errorMsg);
    } finally {
      setIsChecking(false);
    }
  }, [originalText]);

  // Avtomatik to'g'irlash - Gemini bilan
  const handleAutoCorrect = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("To'g'irlash uchun matn kiriting");
      return;
    }

    setCorrectionInProgress(true);
    setIsCorrecting(true);
    setError(null);

    try {
      const response = await correctText(originalText);

      if (response.success) {
        const correctedText = response.data.corrected;

        if (correctedText !== originalText) {
          setOriginalText(correctedText);
          setHasChecked(false);
          setResults([]);
          setMistakes([]);
          setStatistics(null);

          message.success("Matn muvaffaqiyatli to'g'irlandi!");

          // Auto-check after correction
          setTimeout(() => {
            handleAutoCheckAfterCorrection(correctedText);
          }, 1000);
        } else {
          message.info("To'g'irlanadigan xato topilmadi");
        }
      } else {
        setError(response.error);
        message.error(response.error);
      }
    } catch (err) {
      const errorMsg = err.message || "To'g'irlashda xato yuz berdi";
      console.error("Auto correct error:", err);

      // Gemini API specific errors
      if (err.message?.includes("API Error: 404")) {
        setError(
          "RapidAPI endpoint topilmadi. URL yoki API kalitini tekshiring."
        );
      } else if (err.message?.includes("API Error: 403")) {
        setError(
          "RapidAPI kaliti noto'g'ri yoki ruxsat yo'q. API kalitingizni tekshiring."
        );
      } else if (err.message?.includes("API Error: 429")) {
        setError(
          "RapidAPI quotasini oshirib yubordingiz. Keyinroq urinib ko'ring."
        );
      } else if (err.message?.includes("Network error")) {
        setError("Internet aloqasi muammosi. Internetingizni tekshiring.");
      } else {
        setError(errorMsg);
      }
      message.error(errorMsg);
    } finally {
      setIsCorrecting(false);
      setCorrectionInProgress(false);
    }
  }, [originalText]);

  // To'g'irlashdan keyin avtomatik tekshirish
  const handleAutoCheckAfterCorrection = useCallback(async (text) => {
    try {
      const response = await checkSpelling(text);
      if (response.success) {
        setResults(response.data.results || []);
        setStatistics(response.data.statistics);
        setHasChecked(true);

        const errorCount =
          response.data.results?.filter((r) => !r.isCorrect).length || 0;
        if (errorCount === 0) {
          message.success("To'g'irlash muvaffaqiyatli yakunlandi!");
        }
      }
    } catch (error) {
      console.error("Auto-check error:", error);
    }
  }, []);

  // Tozalash
  const handleClear = useCallback(() => {
    setOriginalText("");
    setResults([]);
    setMistakes([]);
    setStatistics(null);
    setHasChecked(false);
    setError(null);
    setCorrectionInProgress(false);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

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

  // YANGILANGAN: Highlighted text yaratish - har bir so'zni alohida tekshirish
  const createHighlightedText = useCallback(() => {
    if (!hasChecked || !results.length || !originalText) {
      return originalText;
    }

    // Xato so'zlarni Set obyektiga saqlash (tezroq qidirish uchun)
    const errorWordsSet = new Set();
    results
      .filter((result) => !result.isCorrect)
      .forEach((result) => {
        if (result.word) {
          // Kichik harflar bilan saqlash
          errorWordsSet.add(result.word.toLowerCase().trim());
        }
      });

    if (errorWordsSet.size === 0) {
      return originalText;
    }

    console.log("Error words set:", Array.from(errorWordsSet)); // Debug uchun

    // Regex orqali so'zlarni topish va xato so'zlarni highlight qilish
    // Kirill va lotin harflarini qo'llab-quvvatlovchi regex
    return originalText.replace(/\b[\wА-Яа-яЁёЎўҚқҒғҲҳҞҟӮӯ]+\b/g, (match) => {
      const cleanWord = match.toLowerCase().trim();

      if (errorWordsSet.has(cleanWord)) {
        return `<span class="spell-error" title="Xato so'z: ${match}" data-word="${cleanWord}" data-original="${match}">${match}</span>`;
      }

      return match;
    });
  }, [originalText, results, hasChecked]);

  // Xato so'zga click qilganda takliflarni ko'rsatish
  const handleErrorWordClick = useCallback(
    (event) => {
      event.preventDefault();
      const errorSpan = event.target.closest(".spell-error");
      if (!errorSpan) return;

      const originalWord = errorSpan.dataset.original;
      const mistake = mistakes.find(
        (m) => m.mistakeWord.toLowerCase() === originalWord.toLowerCase()
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
        message.info(`"${originalWord}" so'zi uchun taklif topilmadi`);
      }
    },
    [mistakes, handleReplaceWord]
  );

  // Click event listener qo'shish
  useEffect(() => {
    const handleClick = (event) => {
      if (event.target.classList.contains("spell-error")) {
        handleErrorWordClick(event);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [handleErrorWordClick]);

  return (
    <div className="p-4 lg:p-6 h-full">
      <Row gutter={[24, 24]} className="h-full">
        {/* Main Editor Column */}
        <Col xs={24} lg={hasChecked && mistakes.length > 0 ? 16 : 24}>
          <Card
            className="h-full shadow-lg"
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <RobotOutlined className="text-blue-500" />
                  <span>Gemini AI Imlo Tekshiruvchi</span>
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
              </div>
            }
            extra={
              <Space wrap>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleCheck}
                  loading={isChecking}
                  disabled={!originalText.trim() || correctionInProgress}
                >
                  Tekshirish
                </Button>

                <Button
                  icon={<SyncOutlined />}
                  onClick={handleAutoCorrect}
                  loading={isCorrecting}
                  disabled={!originalText.trim() || isChecking}
                  type="default"
                  className="bg-green-500 text-white border-green-500 hover:bg-green-600"
                >
                  AI To'g'irlash
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!originalText.trim()}
                >
                  Tozalash
                </Button>

                {process.env.NODE_ENV === "development" && (
                  <Button
                    icon={<BugOutlined />}
                    onClick={() => setShowDebug(!showDebug)}
                    type="dashed"
                  >
                    Debug
                  </Button>
                )}
              </Space>
            }
          >
            <div className="relative">
              {/* Debug Panel */}
              {showDebug && process.env.NODE_ENV === "development" && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-bold mb-2">
                    🐛 RapidAPI Gemini Debug Info
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      RapidAPI Key:{" "}
                      {import.meta.env.VITE_RAPIDAPI_KEY
                        ? "✅ Set"
                        : "❌ Missing"}
                    </div>
                    <div>Environment: {import.meta.env.MODE}</div>
                    <div>
                      <button
                        onClick={async () => {
                          try {
                            const result = await testConnection();
                            console.log("API Test result:", result);
                            if (result.success) {
                              alert(
                                `✅ RapidAPI Connection Success!\nResponse: ${result.response}`
                              );
                            } else {
                              alert(`❌ Connection Failed: ${result.error}`);
                            }
                          } catch (error) {
                            console.error("Debug error:", error);
                            alert(`❌ Error: ${error.message}`);
                          }
                        }}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                      >
                        Test RapidAPI Connection
                      </button>
                    </div>
                    {hasChecked && results.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-100 rounded">
                        <div className="font-bold">Found error words:</div>
                        <div className="text-xs">
                          {results
                            .filter((r) => !r.isCorrect)
                            .map((r) => r.word)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert
                  message="Tekshirishda xato"
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
                  message="AI to'g'irlash jarayoni"
                  description="RapidAPI Gemini matnni tahlil qilib, xatolarni to'g'irlamoqda..."
                  type="info"
                  showIcon
                  className="mb-4"
                />
              )}

              {/* Loading Overlay */}
              {(isChecking || isCorrecting) && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin
                    size="large"
                    tip={
                      isChecking
                        ? "RapidAPI Gemini tekshirmoqda..."
                        : "RapidAPI Gemini to'g'irlamoqda..."
                    }
                  />
                </div>
              )}

              {/* Text Editor */}
              <div className="relative">
                {/* Highlighted text overlay */}
                {hasChecked && results.length > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10 p-2 border border-transparent rounded overflow-hidden whitespace-pre-wrap"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5715",
                      fontFamily: "inherit",
                      color: "transparent",
                      pointerEvents: "auto", // Click eventi uchun
                    }}
                    dangerouslySetInnerHTML={{
                      __html: createHighlightedText(),
                    }}
                  />
                )}

                <textarea
                  ref={textAreaRef}
                  value={originalText}
                  onChange={handleTextChange}
                  placeholder="Bu yerda Qoraqalpoq tilida matn yozing... (RapidAPI Gemini Pro yordami bilan)"
                  className={`w-full min-h-[400px] p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    hasChecked ? "relative z-20 bg-transparent" : ""
                  }`}
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.5715",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Text Statistics */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  Belgilar: {originalText.length} | So'zlar:{" "}
                  {
                    originalText
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
                        <span>RapidAPI Gemini Tahlili</span>
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
                          <Text type="secondary">To'g'ri</Text>
                          <div className="font-semibold text-green-500">
                            {statistics.correctWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">Xato</Text>
                          <div className="font-semibold text-red-500">
                            {statistics.incorrectWords}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">Alifbo</Text>
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
                        <span>RapidAPI Gemini Takliflari</span>
                        <Tag color="red">{mistakes.length} ta xato</Tag>
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
                                  RapidAPI Takliflari:
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
                              RapidAPI Gemini xato topmadi
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
                    <Title level={4}>
                      RapidAPI Gemini Pro Imlo Tekshiruvchisi
                    </Title>
                    <Text className="text-gray-500">
                      Matn kiriting va AI yordamida tekshiring
                    </Text>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>• RapidAPI Gemini Pro quvvati</div>
                      <div>• Kirill va Lotin alifbolari</div>
                      <div>• Professional aniqlik</div>
                      <div>• Avtomatik to'g'irlash</div>
                      <div>• Xato so'zlarga click qiling</div>
                    </div>
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
          background-color: rgba(255, 77, 79, 0.2);
          border-bottom: 2px wavy #ff4d4f;
          border-radius: 2px;
          padding: 1px 2px;
          margin: 0 1px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: inline-block;
        }

        :global(.spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
        }

        :global(.spell-error:active) {
          transform: translateY(0);
          background-color: rgba(255, 77, 79, 0.4);
        }

        :global(.dark .spell-error) {
          background-color: rgba(255, 77, 79, 0.15);
        }

        :global(.dark .spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.25);
        }

        /* Tooltip style */
        :global(.spell-error::after) {
          content: attr(title);
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
