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
  Empty,
  message,
} from "antd";
import {
  CheckOutlined,
  ClearOutlined,
  FileTextOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  checkText,
  correctFullText,
  setOriginalText,
  clearAll,
} from "@/store/slices/spellCheckSlice";
import TextEditor from "./TextEditor";
import { motion } from "framer-motion";

const SpellChecker = () => {
  const dispatch = useAppDispatch();
  const textEditorRef = useRef(null);

  const {
    originalText,
    currentText,
    correctedText,
    results,
    isChecking,
    isCorrecting,
    error,
    correctError,
  } = useAppSelector((state) => state.spellCheck);

  const { device } = useAppSelector((state) => state.ui);
  const { isMobile } = device;

  // Local state
  const [hasChecked, setHasChecked] = useState(false);

  // Handle text changes
  const handleTextChange = useCallback(
    (text) => {
      dispatch(setOriginalText(text));
      setHasChecked(false);
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
      .then((result) => {
        // Avtomatik to'g'rilangan matnni qabul qilish
        if (result.corrected) {
          dispatch(setOriginalText(result.corrected));
          setHasChecked(false);
          message.success("Matn to'g'irlandi");
        }
      })
      .catch((error) => {
        message.error(error || "To'g'irlashda xato yuz berdi");
      });
  }, [dispatch, currentText]);

  // Clear all
  const handleClear = useCallback(() => {
    dispatch(clearAll());
    setHasChecked(false);
    if (textEditorRef.current) {
      textEditorRef.current.focus();
    }
  }, [dispatch]);

  // Get error words
  const errorWords = results.filter((r) => !r.isCorrect);

  return (
    <div className="p-4 lg:p-6 h-full">
      <Row gutter={[24, 24]} className="h-full">
        {/* Main Editor Column */}
        <Col xs={24} lg={hasChecked && errorWords.length > 0 ? 16 : 24}>
          <Card
            className="h-full shadow-lg"
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <FileTextOutlined />
                  <span>Matn tahrirlovchi</span>
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
                  disabled={!currentText.trim()}
                >
                  {isMobile ? "" : "Tekshirish"}
                </Button>

                <Button
                  icon={<SyncOutlined />}
                  onClick={handleCorrectText}
                  loading={isCorrecting}
                  disabled={!currentText.trim()}
                  type="default"
                >
                  {isMobile ? "" : "To'g'irlash"}
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={!currentText.trim()}
                >
                  {isMobile ? "" : "Tozalash"}
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
                highlightErrors={hasChecked}
                placeholder="Bu yerda Qoraqalpoq tilida matn yozing..."
                className="min-h-[400px]"
              />
            </div>
          </Card>
        </Col>

        {/* Error Words List */}
        {hasChecked && errorWords.length > 0 && (
          <Col xs={24} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card
                title={
                  <Space>
                    <span>Xato so'zlar</span>
                    <span className="text-sm text-gray-500">
                      ({errorWords.length} ta)
                    </span>
                  </Space>
                }
                className="shadow-lg"
              >
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {errorWords.map((word, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-red-500 font-medium">
                          {word.word}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-500 font-medium">
                          {word.suggestions && word.suggestions.length > 0
                            ? word.suggestions[0].word || word.suggestions[0]
                            : "taklif yo'q"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </Col>
        )}

        {/* Empty State */}
        {!hasChecked && (
          <Col xs={24} lg={8}>
            <Card className="text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p>Matn kiriting va tekshirishni boshlang</p>
                    <p className="text-sm text-gray-500">
                      Imlo tekshiruv va to'g'irlash
                    </p>
                  </div>
                }
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SpellChecker;
