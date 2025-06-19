// src/components/Transliterator/Transliterator.jsx

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
  Tooltip,
  message,
  Input,
  Tag,
} from "antd";
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  TranslationOutlined,
  ScanOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import {
  transliterate,
  autoTransliterate,
  detectScript,
} from "@/utils/geminiService";

const { TextArea } = Input;
const { Option } = Select;

const Transliterator = () => {
  // State
  const [originalText, setOriginalText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [fromScript, setFromScript] = useState(null);
  const [toScript, setToScript] = useState(null);
  const [conversionMode, setConversionMode] = useState("auto");
  const [isConverting, setIsConverting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [detectedScript, setDetectedScript] = useState(null);
  const [scriptStatistics, setScriptStatistics] = useState(null);

  // Handle text input
  const handleOriginalTextChange = useCallback((e) => {
    setOriginalText(e.target.value);
    setError(null);
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((mode) => {
    setConversionMode(mode);
    setError(null);
  }, []);

  // Convert text with Gemini
  const handleConvert = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("Aylantirish uchun matn kiriting");
      return;
    }

    if (originalText.trim().length < 3) {
      message.warning("Matn juda qisqa, kamida 3 ta harf kiriting");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      let response;

      if (conversionMode === "auto") {
        response = await autoTransliterate(originalText);
      } else {
        const targetScript =
          conversionMode === "toLatin" ? "latin" : "cyrillic";
        response = await transliterate(originalText, targetScript);
      }

      if (response.success) {
        setConvertedText(response.data.converted);
        setFromScript(response.data.from);
        setToScript(response.data.to);

        const fromName = response.data.from === "cyrillic" ? "Kirill" : "Lotin";
        const toName = response.data.to === "cyrillic" ? "Kirill" : "Lotin";

        message.success(`${fromName}dan ${toName}ga muvaffaqiyatli aylandi`);
      } else {
        setError(response.error);
        message.error(response.error);
      }
    } catch (error) {
      const errorMsg = error.message || "Aylantirish xatosi";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsConverting(false);
    }
  }, [originalText, conversionMode]);

  // Detect script with Gemini
  const handleDetectScript = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("Aniqlash uchun matn kiriting");
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const script = detectScript(originalText);

      // Statistika hisoblash
      const cyrillicCount = (originalText.match(/[а-яәғқңөүһҳ]/gi) || [])
        .length;
      const latinCount = (originalText.match(/[a-zәğqńöüşıĞQŃÖÜŞI]/gi) || [])
        .length;
      const totalLetters = cyrillicCount + latinCount;

      const statistics = {
        cyrillic: {
          count: cyrillicCount,
          percentage:
            totalLetters > 0
              ? ((cyrillicCount / totalLetters) * 100).toFixed(1)
              : 0,
        },
        latin: {
          count: latinCount,
          percentage:
            totalLetters > 0
              ? ((latinCount / totalLetters) * 100).toFixed(1)
              : 0,
        },
        total: totalLetters,
      };

      setDetectedScript(script);
      setScriptStatistics(statistics);

      const scriptName =
        script === "cyrillic"
          ? "Kirill"
          : script === "latin"
          ? "Lotin"
          : "Aralash";
      message.success(`Alifbo aniqlandi: ${scriptName}`);
    } catch (error) {
      message.error("Alifbo aniqlashda xato");
    } finally {
      setIsDetecting(false);
    }
  }, [originalText]);

  // Swap texts
  const handleSwap = useCallback(() => {
    if (!convertedText.trim()) {
      message.warning("Almashtirish uchun natija kerak");
      return;
    }

    const tempText = originalText;
    const tempFrom = fromScript;

    setOriginalText(convertedText);
    setConvertedText(tempText);
    setFromScript(toScript);
    setToScript(tempFrom);

    message.info("Matnlar almashtirildi");
  }, [originalText, convertedText, fromScript, toScript]);

  // Copy to clipboard
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

  // Clear all
  const handleClear = useCallback(() => {
    setOriginalText("");
    setConvertedText("");
    setFromScript(null);
    setToScript(null);
    setDetectedScript(null);
    setScriptStatistics(null);
    setError(null);
    message.info("Hammasi tozalandi");
  }, []);

  // Mode options
  const modeOptions = [
    { value: "auto", label: "Avtomatik aniqlash", icon: <ScanOutlined /> },
    {
      value: "toLatin",
      label: "Kirildan Lotinga",
      icon: <TranslationOutlined />,
    },
    {
      value: "toCyrillic",
      label: "Lotindan Kirilga",
      icon: <TranslationOutlined />,
    },
  ];

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space className="w-full">
                <RobotOutlined className="text-blue-500" />
                <Select
                  value={conversionMode}
                  onChange={handleModeChange}
                  className="w-full min-w-[200px]"
                  placeholder="Rejimni tanlang"
                >
                  {modeOptions.map((option) => (
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

            <Col xs={24} sm={12} md={16}>
              <Space className="w-full justify-end" wrap>
                <Tooltip title="Alifbo turini aniqlash">
                  <Button
                    icon={<ScanOutlined />}
                    onClick={handleDetectScript}
                    loading={isDetecting}
                    disabled={!originalText.trim()}
                  >
                    Aniqlash
                  </Button>
                </Tooltip>

                <Tooltip title="Matnlarni almashtirish">
                  <Button
                    icon={<SwapOutlined />}
                    onClick={handleSwap}
                    disabled={!convertedText.trim()}
                  >
                    Almashtirish
                  </Button>
                </Tooltip>

                <Tooltip title="Hammani tozalash">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    disabled={!originalText.trim() && !convertedText.trim()}
                  >
                    Tozalash
                  </Button>
                </Tooltip>
              </Space>
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

      {/* Script Detection Results */}
      {detectedScript && scriptStatistics && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Alert
            message={
              <Space>
                <span>Aniqlangan alifbo:</span>
                <Tag color="blue">
                  {detectedScript === "cyrillic"
                    ? "Kirill"
                    : detectedScript === "latin"
                    ? "Lotin"
                    : "Aralash"}
                </Tag>
              </Space>
            }
            description={
              <div>
                <span>Kirill: {scriptStatistics.cyrillic.percentage}% | </span>
                <span>Lotin: {scriptStatistics.latin.percentage}%</span>
                {scriptStatistics.total > 0 && (
                  <span> | Jami harflar: {scriptStatistics.total}</span>
                )}
              </div>
            }
            type="info"
            showIcon
            closable
            onClose={() => {
              setDetectedScript(null);
              setScriptStatistics(null);
            }}
          />
        </motion.div>
      )}

      {/* Main Content */}
      <Row gutter={[24, 24]} className="h-full">
        {/* Input Column */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <span>Kirish matni</span>
                {fromScript && (
                  <Tag color="green">
                    {fromScript === "cyrillic" ? "Kirill" : "Lotin"}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Tooltip title="Matnni nusxalash">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(originalText)}
                    disabled={!originalText.trim()}
                  />
                </Tooltip>
              </Space>
            }
            className="h-full shadow-lg"
          >
            <TextArea
              value={originalText}
              onChange={handleOriginalTextChange}
              placeholder="Bu yerga Qoraqalpoq tilida matn yozing (kirill yoki lotin alifboda)..."
              className="min-h-[400px] resize-none"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            />

            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>Belgilar: {originalText.length}</span>
              <span>
                So'zlar:{" "}
                {
                  originalText
                    .trim()
                    .split(/\s+/)
                    .filter((w) => w).length
                }
              </span>
            </div>
          </Card>
        </Col>

        {/* Output Column */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <span>RapidAPI Gemini Natijasi</span>
                {toScript && (
                  <Tag color="orange">
                    {toScript === "cyrillic" ? "Kirill" : "Lotin"}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Tooltip title="Natijani nusxalash">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(convertedText)}
                    disabled={!convertedText.trim()}
                  />
                </Tooltip>

                <Button
                  type="primary"
                  icon={<TranslationOutlined />}
                  onClick={handleConvert}
                  loading={isConverting}
                  disabled={!originalText.trim()}
                >
                  AI Aylantirish
                </Button>
              </Space>
            }
            className="h-full shadow-lg"
          >
            <div className="relative">
              {isConverting && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin size="large" tip="RapidAPI Gemini aylantirilmoqda..." />
                </div>
              )}

              <TextArea
                value={convertedText}
                readOnly
                placeholder="RapidAPI Gemini transliteratsiya natijasi bu yerda ko'rsatiladi..."
                className="min-h-[400px] resize-none bg-gray-50 dark:bg-gray-800"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              />

              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Belgilar: {convertedText.length}</span>
                <span>
                  So'zlar:{" "}
                  {
                    convertedText
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Instructions */}
      {!originalText.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <RobotOutlined className="text-4xl text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                RapidAPI Gemini Pro bilan Professional Transliteratsiya
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Kirill → Lotin</h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>а → a, ә → ә, б → b</div>
                    <div>ғ → ğ, қ → q, ң → ń</div>
                    <div>ө → ö, ү → ü, ҳ → h</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Lotin → Kirill</h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>a → а, ә → ә, b → б</div>
                    <div>ğ → ғ, q → қ, ń → ң</div>
                    <div>ö → ө, ü → ү, h → ҳ</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>RapidAPI Gemini Pro:</strong> Eng so'nggi AI
                  texnologiyasi bilan yuqori aniqlikda transliteratsiya.
                  Avtomatik rejim alifboni aniqlab, kerakli tomonga aylantiradi.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Transliterator;
