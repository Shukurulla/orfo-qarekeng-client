// src/components/LanguageSwitcher/LanguageSwitcher.jsx
import React from "react";
import { Select, Space } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
    localStorage.setItem("userLanguage", value);
  };

  const languages = [
    { code: "kaa", name: t("language.kaa"), flag: "🏳️" },
    { code: "uz", name: t("language.uz"), flag: "🇺🇿" },
  ];

  return (
    <div className={className}>
      <Space align="center">
        <GlobalOutlined className="text-blue-500" />
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="min-w-[140px]"
        >
          {languages.map((lang) => (
            <Option key={lang.code} value={lang.code}>
              <Space>
                <span>{lang.name}</span>
              </Space>
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  );
};

export default LanguageSwitcher;
