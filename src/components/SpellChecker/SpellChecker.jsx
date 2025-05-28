// src/components/SpellChecker/SpellChecker.jsx

import React, { useState, useCallback, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Spin,
  Alert,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Divider,
  Empty,
  Modal,
  message,
} from "antd";
import {
  CheckOutlined,
  ClearOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  BulbOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  checkText,
  correctFullText,
  setOriginalText,
  clearAll,
  applySuggestion,
  selectWord,
  closeSuggestions,
  acceptCorrectedText,
  revertToVersion,
} from "@/store/slices/spellCheckSlice";
import { addNotification } from "@/store/slices/uiSlice";
import TextEditor from "./TextEditor";
import SuggestionPopup from "./SuggestionPopup";
import StatisticsPanel from "./StatisticsPanel";
import { motion } from "framer-motion";

const SpellChecker = () => {
  const dispatch = useAppDispatch();
  const textEditorRef = useRef(null);

  const {
    originalText,
    currentText,
    correctedText,
    results,
    statistics,
    isChecking,
    isCorrecting,
    error,
    correctError,
    selectedWordIndex,
    showSuggestions,
    highlightErrors,
    versions,
    currentVersion,
  } = useAppSelector((state) => state.spellCheck);

  const { device } = useAppSelector((state) => state.ui);
  const { isMobile } = device;

  // Local state
  const [hasChecked, setHasChecked] = useState(false);
  const [showCorrectedModal, setShowCorrectedModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Handle text changes
  const handleTextChange = useCallback(
    (text) => {
      dispatch(setOriginalText(text));
    },
    [dispatch]
  );

  // Manual check
  const handleCheck = useCallback(() => {
    if (currentText.trim().length === 0) {
      message.warning("Tekshirish uchun matn kiriting");
      return;
    }

    if (currentText.trim().length < 5) {
      message.warning("Matn juda qisqa, kamida 5 ta harf kiriting");
      return;
    }

    dispatch(checkText({ text: currentText }))
      .unwrap()
      .then(() => {
        setHasChecked(true);
        message.success("Matn muvaffaqiyatli tekshirildi");
      })
      .catch((error) => {
        message.error(error || "Tekshirishda xato yuz berdi");
      });
  }, [dispatch, currentText]);

  // Full text correction
  const handleCorrectText = useCallback(() => {
    if (currentText.trim().length === 0) {
      message.warning("To'g'irlash uchun matn kiriting");
      return;
    }

    dispatch(correctFullText(currentText))
      .unwrap()
      .then(() => {
        setShowCorrectedModal(true);
        message.success("Matn to'g'irlandi");
      })
      .catch((error) => {
        message.error(error || "To'g'irlashda xato yuz berdi");
      });
  }, [dispatch, currentText]);

  // Accept corrected text
  const handleAcceptCorrection = useCallback(() => {
    dispatch(acceptCorrectedText());
    setShowCorrectedModal(false);
    setHasChecked(false);
    message.success("To'g'irlangan matn qabul qilindi");
  }, [dispatch]);

  // Clear all
  const handleClear = useCallback(() => {
    dispatch(clearAll());
    setHasChecked(false);
    setShowCorrectedModal(false);
    if (textEditorRef.current) {
      textEditorRef.current.focus();
    }
  }, [dispatch]);

  // Apply suggestion
  const handleApplySuggestion = useCallback(
    (suggestion) => {
      if (selectedWordIndex >= 0) {
        dispatch(
          applySuggestion({
            wordIndex: selectedWordIndex,
            suggestion,
          })
        );

        message.success(`"${suggestion}" bilan almashtirildi`);
      }
    },
    [dispatch, selectedWordIndex]
  );

  // Handle word selection
  const handleWordSelect = useCallback(
    (wordIndex) => {
      dispatch(selectWord(wordIndex));
    },
    [dispatch]
  );

  // Error and incorrect word counts
  const errorCount = results.filter((r) => !r.isCorrect).length;
  const totalWords = results.length;
  const accuracy =
    totalWords > 0 ? ((totalWords - errorCount) / totalWords) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 h-full">
      <Row gutter={[24, 24]} className="h-full">
        {/* Main Editor Column */}
        <Col xs={24} lg={showSuggestions ? 16 : 24}>
          <Card
            className="h-full shadow-lg"
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <FileTextOutlined />
                  <span>Matn tahrirlovchi</span>
                </Space>

                <Space wrap>
                  {hasChecked && (
                    <Tag color={errorCount === 0 ? "success" : "warning"}>
                      {errorCount === 0 ? "Xatosiz" : `${errorCount} ta xato`}
                    </Tag>
                  )}

                  {versions.length > 0 && (
                    <Tooltip title="Versiyalar tarixi">
                      <Button
                        type="text"
                        icon={<HistoryOutlined />}
                        onClick={() => setShowVersionsModal(true)}
                        size="small"
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            }
            extra={
              <Space wrap>
                <Tooltip title="Tekshirish">
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleCheck}
                    loading={isChecking}
                    disabled={!currentText.trim()}
                  >
                    {isMobile ? "" : "Tekshirish"}
                  </Button>
                </Tooltip>

                <Tooltip title="To'liq to'g'irlash">
                  <Button
                    icon={<SyncOutlined />}
                    onClick={handleCorrectText}
                    loading={isCorrecting}
                    disabled={!currentText.trim()}
                    type="default"
                  >
                    {isMobile ? "" : "To'g'irlash"}
                  </Button>
                </Tooltip>

                <Tooltip title="Tozalash">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    disabled={!currentText.trim()}
                  >
                    {isMobile ? "" : "Tozalash"}
                  </Button>
                </Tooltip>
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
                />
              )}

              {/* Correct Error Alert */}
              {correctError && (
                <Alert
                  message="To'g'irlashda xato"
                  description={correctError}
                  type="error"
                  showIcon
                  closable
                  className="mb-4"
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
              <TextEditor
                ref={textEditorRef}
                value={currentText}
                onChange={handleTextChange}
                results={results}
                highlightErrors={highlightErrors}
                onWordSelect={handleWordSelect}
                selectedWordIndex={selectedWordIndex}
                placeholder="Bu yerga Qoraqalpoq tilida matn yozing..."
                className="min-h-[400px]"
              />

              {/* Quick Stats */}
              {hasChecked && totalWords > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Divider />
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Jami so'zlar"
                        value={totalWords}
                        prefix={<FileTextOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Xatolar"
                        value={errorCount}
                        prefix={<ExclamationCircleOutlined />}
                        valueStyle={{
                          color: errorCount > 0 ? "#ff4d4f" : "#52c41a",
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="To'g'ri"
                        value={totalWords - errorCount}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: "#52c41a" }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Aniqlik"
                        value={accuracy.toFixed(1)}
                        suffix="%"
                        valueStyle={{
                          color:
                            accuracy >= 90
                              ? "#52c41a"
                              : accuracy >= 70
                              ? "#faad14"
                              : "#ff4d4f",
                        }}
                      />
                    </Col>
                  </Row>
                </motion.div>
              )}
            </div>
          </Card>
        </Col>

        {/* Sidebar Column */}
        {showSuggestions && (
          <Col xs={24} lg={8}>
            <div className="space-y-6">
              {/* Suggestion Popup */}
              {selectedWordIndex >= 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <SuggestionPopup
                    word={results[selectedWordIndex]}
                    onApply={handleApplySuggestion}
                    onClose={() => dispatch(closeSuggestions())}
                  />
                </motion.div>
              )}

              {/* Statistics Panel */}
              {statistics && hasChecked && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <StatisticsPanel statistics={statistics} results={results} />
                </motion.div>
              )}
            </div>
          </Col>
        )}

        {/* Empty State */}
        {!hasChecked && !showSuggestions && (
          <Col xs={24} lg={8}>
            <Card className="text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p>Matn kiriting va tekshirishni boshlang</p>
                    <p className="text-sm text-gray-500">
                      ChatGPT 3.5 yordamida professional imlo tekshiruv
                    </p>
                  </div>
                }
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Corrected Text Modal */}
      <Modal
        title={
          <Space>
            <BulbOutlined className="text-green-500" />
            <span>To'g'irlangan matn</span>
          </Space>
        }
        open={showCorrectedModal}
        onCancel={() => setShowCorrectedModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCorrectedModal(false)}>
            Bekor qilish
          </Button>,
          <Button key="accept" type="primary" onClick={handleAcceptCorrection}>
            Qabul qilish
          </Button>,
        ]}
        width={800}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Asl matn:</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border">
              {currentText}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">To'g'irlangan matn:</h4>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              {correctedText}
            </div>
          </div>
        </div>
      </Modal>

      {/* Versions History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Versiyalar tarixi</span>
          </Space>
        }
        open={showVersionsModal}
        onCancel={() => setShowVersionsModal(false)}
        footer={null}
        width={700}
      >
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={index}
              className={`p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                index === currentVersion
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => {
                dispatch(revertToVersion(index));
                setShowVersionsModal(false);
                setHasChecked(false);
                message.success("Versiya qaytarildi");
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">
                    {new Date(version.timestamp).toLocaleString("uz-UZ")}
                  </div>
                  <div className="text-sm">
                    {version.text.length > 100
                      ? version.text.substring(0, 100) + "..."
                      : version.text}
                  </div>
                </div>
                {index === currentVersion && (
                  <Tag color="blue" size="small">
                    Joriy
                  </Tag>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SpellChecker;
