import React from "react";
import {
  Card,
  Progress,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  Tag,
} from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const StatisticsPanel = ({ statistics, results = [] }) => {
  if (!statistics) return null;

  const { totalWords, correctWords, incorrectWords, accuracy, textLength } =
    statistics;

  // Get error words for list
  const errorWords = results.filter((result) => !result.isCorrect).slice(0, 10); // Show only first 10 errors

  // Calculate progress color
  const getProgressColor = (accuracy) => {
    if (accuracy >= 90) return "#52c41a";
    if (accuracy >= 70) return "#faad14";
    return "#ff4d4f";
  };

  // Calculate reading time (average 200 words per minute)
  const readingTime = Math.ceil(totalWords / 200);

  return (
    <Card
      title={
        <div className="flex items-center">
          <BarChartOutlined className="mr-2" />
          <span>Statistika</span>
        </div>
      }
      size="small"
      className="shadow-lg"
    >
      {/* Accuracy Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Text strong>Aniqlik darajasi</Text>
          <Text strong style={{ color: getProgressColor(accuracy) }}>
            {accuracy.toFixed(1)}%
          </Text>
        </div>
        <Progress
          percent={accuracy}
          strokeColor={getProgressColor(accuracy)}
          size="small"
          showInfo={false}
        />
      </div>

      {/* Main Statistics */}
      <Row gutter={[8, 16]} className="mb-4">
        <Col span={12}>
          <Statistic
            title="Jami so'zlar"
            value={totalWords}
            prefix={<FileTextOutlined />}
            valueStyle={{ fontSize: "16px" }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="To'g'ri so'zlar"
            value={correctWords}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ fontSize: "16px", color: "#52c41a" }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Xato so'zlar"
            value={incorrectWords}
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ fontSize: "16px", color: "#ff4d4f" }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="O'qish vaqti"
            value={`${readingTime} min`}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ fontSize: "16px" }}
          />
        </Col>
      </Row>

      {/* Additional Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary" className="text-xs">
              Belgilar soni
            </Text>
            <br />
            <Text strong>{textLength.toLocaleString()}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" className="text-xs">
              O'rtacha so'z uzunligi
            </Text>
            <br />
            <Text strong>
              {totalWords > 0 ? (textLength / totalWords).toFixed(1) : 0}
            </Text>
          </Col>
        </Row>
      </div>

      {/* Error Words List */}
      {errorWords.length > 0 && (
        <div>
          <Title level={5} className="!mb-2 flex items-center">
            <ExclamationCircleOutlined className="mr-1 text-red-500" />
            Xato so'zlar
          </Title>

          <List
            size="small"
            dataSource={errorWords}
            renderItem={(item, index) => (
              <List.Item key={index} className="px-0 py-1">
                <div className="flex items-center justify-between w-full">
                  <Text className="text-red-500 font-medium">{item.word}</Text>

                  <div className="flex items-center space-x-1">
                    {item.suggestions && item.suggestions.length > 0 && (
                      <Tag size="small" color="blue">
                        {item.suggestions.length} taklif
                      </Tag>
                    )}
                    <Text type="secondary" className="text-xs">
                      {item.start}-{item.end}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />

          {results.filter((r) => !r.isCorrect).length > 10 && (
            <Text type="secondary" className="text-xs">
              va yana {results.filter((r) => !r.isCorrect).length - 10} ta
              xato...
            </Text>
          )}
        </div>
      )}

      {/* Quality Assessment */}
      <div className="mt-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <div className="mb-2">
            {accuracy >= 95 ? (
              <CheckCircleOutlined className="text-2xl text-green-500" />
            ) : accuracy >= 80 ? (
              <ExclamationCircleOutlined className="text-2xl text-yellow-500" />
            ) : (
              <ExclamationCircleOutlined className="text-2xl text-red-500" />
            )}
          </div>

          <Text strong className="block">
            {accuracy >= 95
              ? "A'lo"
              : accuracy >= 80
              ? "Yaxshi"
              : accuracy >= 60
              ? "O'rta"
              : "Yomon"}
          </Text>

          <Text type="secondary" className="text-xs">
            {accuracy >= 95
              ? "Matn juda yaxshi yozilgan"
              : accuracy >= 80
              ? "Matn yaxshi, ozgina xatolar bor"
              : accuracy >= 60
              ? "Matnda bir nechta xatolar bor"
              : "Matnda ko'p xatolar bor, ko'rib chiqing"}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default StatisticsPanel;
