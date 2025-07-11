// src/components/Transliterator/Transliterator.jsx - AUTH CHEKLOVI BILAN TO'LIQ VERSIYA

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
  Modal,
} from "antd";
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  TranslationOutlined,
  ScanOutlined,
  LockOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import {
  transliterate,
  autoTransliterate,
  detectScript,
} from "../../utils/OrfoAIService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

const { TextArea } = Input;
const { Option } = Select;

const Transliterator = () => {
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
          <p>Transliteratsiya uchun kunlik limitingiz tugagan.</p>
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

  // Demo function for non-authenticated users
  const demoTransliterate = () => {
    const demoText = "Qaraqalpaqstan Respublikası";
    setOriginalText(demoText);
    setIsConverting(true);

    setTimeout(() => {
      setConvertedText("Қарақалпақстан Республикасы");
      setFromScript("latin");
      setToScript("cyrillic");
      setIsConverting(false);
      message.info("Demo transliteratsiya ko'rsatildi");
    }, 1500);
  };

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

  // Convert text with API
  const handleConvert = useCallback(async () => {
    // Auth check
    if (!isAuthenticated) {
      showAuthRequired();
      return;
    }

    // Limit check
    if (!canUse("transliterate")) {
      showLimitExceeded();
      return;
    }

    if (!originalText.trim()) {
      message.warning(t("transliterator.placeholder"));
      return;
    }

    if (originalText.trim().length < 3) {
      message.warning("Matn juda qisqa, kamida 3 ta harf kiriting");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Use action to decrement limit
      await useAction("transliterate");

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

        const fromName =
          response.data.from === "cyrillic"
            ? t("transliterator.cyrillic")
            : t("transliterator.latin");
        const toName =
          response.data.to === "cyrillic"
            ? t("transliterator.cyrillic")
            : t("transliterator.latin");

        message.success(`${fromName}dan ${toName}ga muvaffaqiyatli aylandi`);
      } else {
        setError(response.error);
        message.error(response.error);
      }
    } catch (error) {
      const errorMsg = error.message || t("common.error");
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsConverting(false);
    }
  }, [originalText, conversionMode, t, isAuthenticated, canUse, useAction]);

  // Detect script
  const handleDetectScript = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning(t("transliterator.placeholder"));
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
          ? t("transliterator.cyrillic")
          : script === "latin"
          ? t("transliterator.latin")
          : t("transliterator.mixed");
      message.success(`${t("transliterator.detectedAs")} ${scriptName}`);
    } catch (error) {
      message.error(t("common.error"));
    } finally {
      setIsDetecting(false);
    }
  }, [originalText, t]);

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

    message.info(t("transliterator.swap"));
  }, [originalText, convertedText, fromScript, toScript, t]);

  // Copy to clipboard
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

  // Clear all
  const handleClear = useCallback(() => {
    setOriginalText("");
    setConvertedText("");
    setFromScript(null);
    setToScript(null);
    setDetectedScript(null);
    setScriptStatistics(null);
    setError(null);
    message.info(t("common.clear"));
  }, [t]);

  // Mode options
  const modeOptions = [
    {
      value: "auto",
      label: t("transliterator.autoDetect"),
      icon: <ScanOutlined />,
    },
    {
      value: "toLatin",
      label: t("transliterator.cyrilToLatin"),
      icon: <TranslationOutlined />,
    },
    {
      value: "toCyrillic",
      label: t("transliterator.latinToCyril"),
      icon: <TranslationOutlined />,
    },
  ];

  const planStatus = getPlanStatus();

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header Controls */}
      <div className="mb-6">
        <Card size="small" className="shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space className="w-full">
                <TranslationOutlined className="text-blue-500" />
                <Select
                  value={conversionMode}
                  onChange={handleModeChange}
                  className="w-full min-w-[200px]"
                  placeholder={t("transliterator.title")}
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

                <Tooltip title={t("transliterator.detect")}>
                  <Button
                    icon={<ScanOutlined />}
                    onClick={handleDetectScript}
                    loading={isDetecting}
                    disabled={!originalText.trim()}
                  >
                    {t("transliterator.detect")}
                  </Button>
                </Tooltip>

                <Tooltip title={t("transliterator.swap")}>
                  <Button
                    icon={<SwapOutlined />}
                    onClick={handleSwap}
                    disabled={!convertedText.trim()}
                  >
                    {t("transliterator.swap")}
                  </Button>
                </Tooltip>

                <Button
                  onClick={demoTransliterate}
                  className="bg-purple-500 text-white border-purple-500"
                >
                  Demo
                </Button>

                <Tooltip title={t("common.clear")}>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    disabled={!originalText.trim() && !convertedText.trim()}
                  >
                    {t("common.clear")}
                  </Button>
                </Tooltip>
              </Space>
            </Col>
          </Row>

          {/* Auth warning for non-authenticated users */}
          {!isAuthenticated && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <div className="text-yellow-700 dark:text-yellow-300 text-xs">
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
              </div>
            </div>
          )}

          {/* Limit warning for authenticated users */}
          {isAuthenticated && planStatus.plan === "start" && (
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
              <div className="text-orange-700 dark:text-orange-300 text-xs">
                Kunlik limit: Transliteratsiya{" "}
                {getRemainingLimit("transliterate")}/3.{" "}
                <a
                  href="/pricing"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Pro rejasiga o'ting
                </a>
              </div>
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
                <span>{t("transliterator.detectedAs")}</span>
                <Tag color="blue">
                  {detectedScript === "cyrillic"
                    ? t("transliterator.cyrillic")
                    : detectedScript === "latin"
                    ? t("transliterator.latin")
                    : t("transliterator.mixed")}
                </Tag>
              </Space>
            }
            description={
              <div>
                <span>
                  {t("transliterator.cyrillic")}:{" "}
                  {scriptStatistics.cyrillic.percentage}% |{" "}
                </span>
                <span>
                  {t("transliterator.latin")}:{" "}
                  {scriptStatistics.latin.percentage}%
                </span>
                {scriptStatistics.total > 0 && (
                  <span>
                    {" "}
                    | {t("common.total")}: {scriptStatistics.total}
                  </span>
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
                <span>{t("transliterator.inputText")}</span>
                {fromScript && (
                  <Tag color="green">
                    {fromScript === "cyrillic"
                      ? t("transliterator.cyrillic")
                      : t("transliterator.latin")}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Tooltip title={t("common.copy")}>
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
              placeholder={t("transliterator.placeholder")}
              className="min-h-[400px] resize-none"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            />

            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>
                {t("common.characters")}: {originalText.length}
              </span>
              <span>
                {t("common.words")}:{" "}
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
                <span>{t("transliterator.result")}</span>
                {toScript && (
                  <Tag color="orange">
                    {toScript === "cyrillic"
                      ? t("transliterator.cyrillic")
                      : t("transliterator.latin")}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Tooltip title={t("common.copy")}>
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
                  {isAuthenticated ? (
                    <>
                      {t("transliterator.convert")}
                      <span className="ml-1">
                        ({getRemainingLimit("transliterate")})
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
              {isConverting && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin size="large" tip={t("transliterator.converting")} />
                </div>
              )}

              <TextArea
                value={convertedText}
                readOnly
                placeholder={t("transliterator.result")}
                className="min-h-[400px] resize-none bg-gray-50 dark:bg-gray-800"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              />

              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  {t("common.characters")}: {convertedText.length}
                </span>
                <span>
                  {t("common.words")}:{" "}
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
              <TranslationOutlined className="text-4xl text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("transliterator.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">
                    {t("transliterator.cyrilToLatin")}
                  </h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>а → a, ә → ә, б → b</div>
                    <div>ғ → ğ, қ → q, ң → ń</div>
                    <div>ө → ö, ү → ü, ҳ → h</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    {t("transliterator.latinToCyril")}
                  </h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>a → а, ә → ә, b → б</div>
                    <div>ğ → ғ, q → қ, ń → ң</div>
                    <div>ö → ө, ü → ү, h → ҳ</div>
                  </div>
                </div>
              </div>

              {/* Auth prompt for non-authenticated users */}
              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
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
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Transliterator;
