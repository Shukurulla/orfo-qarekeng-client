import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "antd";
import {
  CheckOutlined,
  ClearOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  checkText,
  setOriginalText,
  clearAll,
  applySuggestion,
  selectWord,
  closeSuggestions,
} from "@/store/slices/spellCheckSlice";
import { addNotification } from "@/store/slices/uiSlice";
import TextEditor from "./TextEditor";
import SuggestionPopup from "./SuggestionPopup";
import StatisticsPanel from "./StatisticsPanel";
import { motion } from "framer-motion";
import { debounce } from "lodash";

const SpellChecker = () => {
  const dispatch = useAppDispatch();
  const textEditorRef = useRef(null);

  const {
    originalText,
    currentText,
    results,
    statistics,
    isChecking,
    error,
    selectedWordIndex,
    showSuggestions,
    highlightErrors,
    autoCheck,
  } = useAppSelector((state) => state.spellCheck);

  const { device } = useAppSelector((state) => state.ui);
  const { isMobile } = device;

  // Local state
  const [hasChecked, setHasChecked] = useState(false);

  // Debounced auto-check
  const debouncedCheck = useCallback(
    debounce((text) => {
      if (text.trim().length > 0 && autoCheck) {
        dispatch(checkText({ text, options: { errorsOnly: false } }));
        setHasChecked(true);
      }
    }, 1000),
    [dispatch, autoCheck]
  );

  // Handle text changes
  const handleTextChange = useCallback(
    (text) => {
      dispatch(setOriginalText(text));

      if (autoCheck && text.trim().length > 10) {
        debouncedCheck(text);
      }
    },
    [dispatch, debouncedCheck, autoCheck]
  );

  // Manual check
  const handleCheck = useCallback(() => {
    if (currentText.trim().length === 0) {
      dispatch(
        addNotification({
          type: "warning",
          title: "Ogohlantirish",
          message: "Tekshirish uchun matn kiriting",
        })
      );
      return;
    }

    dispatch(checkText({ text: currentText, options: { errorsOnly: false } }));
    setHasChecked(true);
  }, [dispatch, currentText]);

  // Clear all
  const handleClear = useCallback(() => {
    dispatch(clearAll());
    setHasChecked(false);
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

        dispatch(
          addNotification({
            type: "success",
            title: "Muvaffaqiyat",
            message: `"${suggestion}" bilan almashtirildi`,
          })
        );

        // Re-check after applying suggestion if auto-check is enabled
        if (autoCheck) {
          setTimeout(() => {
            dispatch(checkText({ text: currentText }));
          }, 100);
        }
      }
    },
    [dispatch, selectedWordIndex, currentText, autoCheck]
  );

  // Handle word selection
  const handleWordSelect = useCallback(
    (wordIndex) => {
      dispatch(selectWord(wordIndex));
    },
    [dispatch]
  );

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest(".suggestion-popup")) {
        dispatch(closeSuggestions());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions, dispatch]);

  // Error and incorrect word counts
  const errorCount = results.filter((r) => !r.isCorrect).length;
  const totalWords = results.length;
  const accuracy =
    totalWords > 0 ? ((totalWords - errorCount) / totalWords) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 h-full">
      <Row gutter={[24, 24]} className="h-full">
        {/* Main Editor Column */}
        <Col xs={24} lg={showSuggestions || statistics ? 16 : 24}>
          <Card
            className="h-full shadow-lg"
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <FileTextOutlined />
                  <span>Matn tahrirlovchi</span>
                </Space>

                <Space>
                  {hasChecked && (
                    <Tag color={errorCount === 0 ? "success" : "warning"}>
                      {errorCount === 0 ? "Xatosiz" : `${errorCount} ta xato`}
                    </Tag>
                  )}
                </Space>
              </div>
            }
            extra={
              <Space>
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
                  message="Xato yuz berdi"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  className="mb-4"
                />
              )}

              {/* Loading Overlay */}
              {isChecking && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center rounded-lg">
                  <Spin size="large" tip="Tekshirilmoqda..." />
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
                placeholder="Bu yerga Qoraqolpoq tilida matn yozing..."
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
        <Col xs={24} lg={8}>
          <div className="space-y-6">
            {/* Suggestion Popup */}
            {showSuggestions && selectedWordIndex >= 0 && (
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

            {/* Empty State */}
            {!hasChecked && (
              <Card className="text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p>Matn kiriting va tekshirishni boshlang</p>
                      <p className="text-sm text-gray-500">
                        Avtomatik tekshiruv yoqilgan bo'lsa, yozish jarayonida
                        avtomatik tekshiriladi
                      </p>
                    </div>
                  }
                />
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SpellChecker;
