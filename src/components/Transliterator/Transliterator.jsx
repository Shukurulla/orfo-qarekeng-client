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
} from "antd";
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  TranslationOutlined,
  ScanOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  convertText,
  detectScript,
  setOriginalText,
  setConvertedText,
  setConversionMode,
  swapTexts,
  clearAll,
} from "@/store/slices/transliterateSlice";
import { addNotification } from "@/store/slices/uiSlice";
import { Input } from "antd";
import { motion } from "framer-motion";

const { TextArea } = Input;
const { Option } = Select;

const Transliterator = () => {
  const dispatch = useAppDispatch();

  const {
    originalText,
    convertedText,
    fromScript,
    toScript,
    conversionMode,
    isConverting,
    isDetecting,
    error,
    detectedScript,
    scriptStatistics,
  } = useAppSelector((state) => state.transliterate);

  const { device } = useAppSelector((state) => state.ui);
  const { isMobile } = device;

  // Handle text input
  const handleOriginalTextChange = useCallback(
    (e) => {
      dispatch(setOriginalText(e.target.value));
    },
    [dispatch]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (mode) => {
      dispatch(setConversionMode(mode));
    },
    [dispatch]
  );

  // Convert text
  const handleConvert = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("Aylantirish uchun matn kiriting");
      return;
    }

    try {
      const result = await dispatch(
        convertText({
          text: originalText,
          mode: conversionMode,
        })
      ).unwrap();

      dispatch(
        addNotification({
          type: "success",
          title: "Muvaffaqiyat",
          message: `Matn ${result.from} dan ${result.to} ga aylantirildi`,
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          title: "Xato",
          message: error || "Aylantirish xatosi",
        })
      );
    }
  }, [dispatch, originalText, conversionMode]);

  // Detect script
  const handleDetectScript = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning("Aniqlash uchun matn kiriting");
      return;
    }

    try {
      await dispatch(detectScript(originalText)).unwrap();
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          title: "Xato",
          message: "Alifbo aniqlashda xato",
        })
      );
    }
  }, [dispatch, originalText]);

  // Swap texts
  const handleSwap = useCallback(() => {
    if (!convertedText.trim()) {
      message.warning("Almashtirish uchun natija kerak");
      return;
    }
    dispatch(swapTexts());
  }, [dispatch, convertedText]);

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
    dispatch(clearAll());
    message.info("Hammasi tozalandi");
  }, [dispatch]);

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
                <TranslationOutlined className="text-blue-500" />
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
                    {!isMobile && "Aniqlash"}
                  </Button>
                </Tooltip>

                <Tooltip title="Matnlarni almashtirish">
                  <Button
                    icon={<SwapOutlined />}
                    onClick={handleSwap}
                    disabled={!convertedText.trim()}
                  >
                    {!isMobile && "Almashtirish"}
                  </Button>
                </Tooltip>

                <Tooltip title="Hammani tozalash">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    disabled={!originalText.trim() && !convertedText.trim()}
                  >
                    {!isMobile && "Tozalash"}
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
            message={`Aniqlangan alifbo: ${
              detectedScript === "cyrillic"
                ? "Kirill"
                : detectedScript === "latin"
                ? "Lotin"
                : "Aralash"
            }`}
            description={
              <div>
                <span>Kirill: {scriptStatistics.cyrillic.percentage}% | </span>
                <span>Lotin: {scriptStatistics.latin.percentage}%</span>
              </div>
            }
            type="info"
            showIcon
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
                  <span className="text-sm text-gray-500">
                    ({fromScript === "cyrillic" ? "Kirill" : "Lotin"})
                  </span>
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
              placeholder="Bu yerga Qoraqolpoq tilida matn yozing (kirill yoki lotin alifboda)..."
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
                <span>Natija</span>
                {toScript && (
                  <span className="text-sm text-gray-500">
                    ({toScript === "cyrillic" ? "Kirill" : "Lotin"})
                  </span>
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
                  {isMobile ? "" : "Aylantirish"}
                </Button>
              </Space>
            }
            className="h-full shadow-lg"
          >
            <div className="relative">
              {isConverting && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin size="large" tip="Aylantirilmoqda..." />
                </div>
              )}

              <TextArea
                value={convertedText}
                readOnly
                placeholder="Aylantirish natijasi bu yerda ko'rsatiladi..."
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
              <TranslationOutlined className="text-4xl text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Transliteratsiya qoidalari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Kirill → Lotin</h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>а → a, ә → ә, б → b</div>
                    <div>ғ → ğ, қ → q, ң → ń</div>
                    <div>ө → ö, ү → ü, ш → ş</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Lotin → Kirill</h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div>a → а, ә → ә, b → б</div>
                    <div>ğ → ғ, q → қ, ń → ң</div>
                    <div>ö → ө, ü → ү, ş → ш</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Transliterator;
