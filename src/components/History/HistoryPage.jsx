// src/components/History/HistoryPage.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Empty,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const HistoryPage = () => {
  const { user, getAuthToken } = useAuth();
  const [histories, setHistories] = useState([]);
  const [filteredHistories, setFilteredHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://ofro-qarekeng-server.vercel.app/api";

  useEffect(() => {
    fetchHistories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [histories, searchText, filterType, dateRange]);

  const fetchHistories = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistories(data.data || []);
      }
    } catch (error) {
      console.error("History fetch error:", error);
      message.error("Tarix yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...histories];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.originalText.toLowerCase().includes(searchText.toLowerCase()) ||
          item.result?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((item) => {
        const itemDate = dayjs(item.createdAt);
        return (
          itemDate.isAfter(dateRange[0]) && itemDate.isBefore(dateRange[1])
        );
      });
    }

    setFilteredHistories(filtered);
  };

  const handleDelete = async (id) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHistories((prev) => prev.filter((item) => item._id !== id));
        message.success("O'chirildi");
      } else {
        message.error("O'chirishda xato");
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error("O'chirishda xato");
    }
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "spellCheck":
        return <CheckCircleOutlined className="text-blue-500" />;
      case "textImprovement":
        return <FileTextOutlined className="text-green-500" />;
      case "transliteration":
        return <TranslationOutlined className="text-purple-500" />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case "spellCheck":
        return "Imlo tekshirish";
      case "textImprovement":
        return "Matn yaxshilash";
      case "transliteration":
        return "Transliteratsiya";
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "spellCheck":
        return "blue";
      case "textImprovement":
        return "green";
      case "transliteration":
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Mening tarixim
        </Title>
        <Text type="secondary">Barcha ishlatgan matnlar va natijalar</Text>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Search
            placeholder="Matndan qidirish..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />

          <Select
            value={filterType}
            onChange={setFilterType}
            className="w-full"
            placeholder="Tur bo'yicha"
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Barcha turlar</Option>
            <Option value="spellCheck">Imlo tekshirish</Option>
            <Option value="textImprovement">Matn yaxshilash</Option>
            <Option value="transliteration">Transliteratsiya</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={["Boshlanish", "Tugash"]}
            suffixIcon={<CalendarOutlined />}
            className="w-full"
          />

          <Button
            onClick={() => {
              setSearchText("");
              setFilterType("all");
              setDateRange(null);
            }}
          >
            Tozalash
          </Button>
        </div>
      </Card>

      {/* History List */}
      <Card>
        <List
          loading={loading}
          dataSource={filteredHistories}
          locale={{
            emptyText: (
              <Empty
                description="Hali hech qanday tarix yo'q"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          renderItem={(item) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <List.Item
                className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-4 transition-colors"
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(item)}
                  >
                    Ko'rish
                  </Button>,
                  <Popconfirm
                    title="O'chirishni tasdiqlaysizmi?"
                    onConfirm={() => handleDelete(item._id)}
                    okText="Ha"
                    cancelText="Yo'q"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      O'chirish
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={getTypeIcon(item.type)}
                  title={
                    <Space>
                      <Tag color={getTypeColor(item.type)}>
                        {getTypeName(item.type)}
                      </Tag>
                      <Text className="text-sm text-gray-500">
                        {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
                      </Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        className="!mb-1 text-gray-700 dark:text-gray-300"
                      >
                        {item.originalText}
                      </Paragraph>
                      <Text type="secondary" className="text-xs">
                        {item.originalText.length} belgi
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            </motion.div>
          )}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Yopish
          </Button>,
        ]}
        title={
          selectedItem && (
            <Space>
              {getTypeIcon(selectedItem.type)}
              <span>{getTypeName(selectedItem.type)}</span>
              <Tag color={getTypeColor(selectedItem.type)}>
                {dayjs(selectedItem.createdAt).format("DD.MM.YYYY HH:mm")}
              </Tag>
            </Space>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <Title level={5}>Asl matn:</Title>
              <Card size="small" className="bg-gray-50 dark:bg-gray-800">
                <Paragraph className="!mb-0 whitespace-pre-wrap">
                  {selectedItem.originalText}
                </Paragraph>
              </Card>
            </div>

            {selectedItem.result && (
              <div>
                <Title level={5}>Natija:</Title>
                <Card size="small" className="bg-green-50 dark:bg-green-900/20">
                  <Paragraph className="!mb-0 whitespace-pre-wrap">
                    {selectedItem.result}
                  </Paragraph>
                </Card>
              </div>
            )}

            {selectedItem.metadata && (
              <div>
                <Title level={5}>Qo'shimcha ma'lumot:</Title>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedItem.metadata.language && (
                    <div>
                      <Text strong>Til: </Text>
                      <Text>{selectedItem.metadata.language}</Text>
                    </div>
                  )}
                  {selectedItem.metadata.script && (
                    <div>
                      <Text strong>Alifbo: </Text>
                      <Text>{selectedItem.metadata.script}</Text>
                    </div>
                  )}
                  {selectedItem.metadata.style && (
                    <div>
                      <Text strong>Uslub: </Text>
                      <Text>{selectedItem.metadata.style}</Text>
                    </div>
                  )}
                  {selectedItem.metadata.accuracy && (
                    <div>
                      <Text strong>Aniqlik: </Text>
                      <Text>{selectedItem.metadata.accuracy}%</Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryPage;
