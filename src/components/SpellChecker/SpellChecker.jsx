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
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { spellCheckAPI } from "@/utils/api";

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
  const [selectedMistake, setSelectedMistake] = useState(null);

  // Matn o'zgarishi
  const handleTextChange = useCallback((e) => {
    setOriginalText(e.target.value);
    setHasChecked(false);
    setError(null);
    setResults([]);
    setMistakes([]);
    setStatistics(null);
  }, []);

  // Imlo tekshirish
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
      const response = await spellCheckAPI.checkText(originalText);

      if (response.data.success) {
        setResults(response.data.data.results);
        setMistakes(response.data.data.mistakes);
        setStatistics(response.data.data.statistics);
        setHasChecked(true);
        message.success("Matn muvaffaqiyatli tekshirildi");
      } else {
        setError(response.data.error);
        message.error(response.data.error);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Tekshirishda xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsChecking(false);
    }
  }, [originalText]);

  // Avtomatik to'g'irlash
  const handleAutoCorrect = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("To'g'irlash uchun matn kiriting");
      return;
    }

    setIsCorrecting(true);
    setError(null);

    try {
      const response = await spellCheckAPI.autoCorrect(originalText);

      if (response.data.success) {
        setOriginalText(response.data.data.corrected);
        setHasChecked(false);
        setResults([]);
        setMistakes([]);
        setStatistics(null);

        if (response.data.data.correctionCount > 0) {
          message.success(
            `${response.data.data.correctionCount} ta so'z to'g'irlandi`
          );
        } else {
          message.info("To'g'irlanadigan xato topilmadi");
        }
      } else {
        setError(response.data.error);
        message.error(response.data.error);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "To'g'irlashda xato yuz berdi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsCorrecting(false);
    }
  }, [originalText]);

  // Tozalash
  const handleClear = useCallback(() => {
    setOriginalText("");
    setResults([]);
    setMistakes([]);
    setStatistics(null);
    setHasChecked(false);
    setError(null);
    setSelectedMistake(null);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  // So'zni almashtirish
  const handleReplaceWord = useCallback(
    (mistakeWord, replacement) => {
      const newText = originalText.replace(
        new RegExp(`\\b${mistakeWord}\\b`, "g"),
        replacement
      );
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

  // Highlighted text yaratish
  const createHighlightedText = useCallback(() => {
    if (!hasChecked || !results.length || !originalText) {
      return originalText;
    }

    let highlightedText = originalText;
    let offset = 0;

    // Xato so'zlarni highlight qilish
    results.forEach((result) => {
      if (!result.isCorrect) {
        const start = result.start + offset;
        const end = result.end + offset;
        const word = highlightedText.slice(start, end);
        const highlighted = `<span class="spell-error" title="Xato so'z: ${word}">${word}</span>`;

        highlightedText =
          highlightedText.slice(0, start) +
          highlighted +
          highlightedText.slice(end);
        offset += highlighted.length - word.length;
      }
    });

    return highlightedText;
  }, [originalText, results, hasChecked]);

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
                  <FileTextOutlined />
                  <span>Matn tahrirlovchi</span>
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
                  disabled={!originalText.trim()}
                >
                  Tekshirish
                </Button>

                <Button
                  icon={<SyncOutlined />}
                  onClick={handleAutoCorrect}
                  loading={isCorrecting}
                  disabled={!originalText.trim()}
                  type="default"
                >
                  Avtomatik to'g'irlash
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!originalText.trim()}
                >
                  Tozalash
                </Button>
              </Space>
            }
          >
            <div className="relative">
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
                {/* Highlighted text overlay */}
                {hasChecked && results.length > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10 p-2 border border-transparent rounded overflow-hidden whitespace-pre-wrap"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5715",
                      fontFamily: "inherit",
                      color: "transparent",
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
                  placeholder="Bu yerda Qoraqalpoq tilida matn yozing..."
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
                        <span>Statistika</span>
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
                            {statistics.scriptType === "kiril"
                              ? "Kirill"
                              : statistics.scriptType === "lotin"
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
                        <span>Xato so'zlar</span>
                        <Tag color="red">{mistakes.length} ta</Tag>
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
                                  Takliflar:
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
                              Matnda xato topilmadi
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
                    <Title level={4}>Qoraqalpoq tili imlo tekshiruvchisi</Title>
                    <Text className="text-gray-500">
                      Matn kiriting va tekshirishni boshlang
                    </Text>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>• 142,000+ so'z bazasi</div>
                      <div>• Kirill va Lotin alifbolari</div>
                      <div>• Professional aniqlik</div>
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
        }

        :global(.spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.3);
          transform: translateY(-1px);
        }

        :global(.dark .spell-error) {
          background-color: rgba(255, 77, 79, 0.15);
        }

        :global(.dark .spell-error:hover) {
          background-color: rgba(255, 77, 79, 0.25);
        }
      `}</style>
    </div>
  );
};

export default SpellChecker;
