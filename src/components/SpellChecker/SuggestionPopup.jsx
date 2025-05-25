import React from "react";
import { Card, Button, List, Typography, Space, Tag, Empty } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Text, Title } = Typography;

const SuggestionPopup = ({ word, onApply, onClose }) => {
  if (!word) return null;

  const { word: originalWord, suggestions = [], isCorrect } = word;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="suggestion-popup"
    >
      <Card
        size="small"
        className="shadow-lg border-0"
        title={
          <Space>
            <ExclamationCircleOutlined className="text-orange-500" />
            <span className="text-sm">Xato so'z</span>
          </Space>
        }
        extra={
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        }
      >
        {/* Original word */}
        <div className="mb-4">
          <Text strong className="text-red-500">
            "{originalWord}"
          </Text>
          <br />
          <Text type="secondary" className="text-xs">
            Bu so'z lug'atda topilmadi
          </Text>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 ? (
          <div>
            <div className="flex items-center mb-2">
              <BulbOutlined className="text-blue-500 mr-1" />
              <Text strong className="text-sm">
                Tavsiya etilgan variantlar:
              </Text>
            </div>

            <List
              size="small"
              dataSource={suggestions}
              renderItem={(suggestion, index) => (
                <List.Item key={index} className="px-0 py-1">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Text className="font-medium">{suggestion.word}</Text>
                      {suggestion.confidence && (
                        <Tag
                          color={
                            suggestion.confidence > 80
                              ? "green"
                              : suggestion.confidence > 60
                              ? "orange"
                              : "default"
                          }
                          size="small"
                        >
                          {suggestion.confidence}%
                        </Tag>
                      )}
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => onApply(suggestion.word)}
                      className="ml-2"
                    >
                      Qo'llash
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <Text type="secondary" className="text-sm">
                  Tavsiya etilgan variantlar topilmadi
                </Text>
                <br />
                <Text type="secondary" className="text-xs">
                  So'zni qo'lda to'g'irlang yoki o'tkazib yuboring
                </Text>
              </div>
            }
          />
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <Space className="w-full justify-between">
            <Button size="small" onClick={onClose}>
              O'tkazib yuborish
            </Button>

            <Text type="secondary" className="text-xs">
              So'z ustiga ikki marta bosing
            </Text>
          </Space>
        </div>
      </Card>
    </motion.div>
  );
};

export default SuggestionPopup;
