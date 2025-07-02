import React from "react";
import { Result, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full flex items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle={t("notFound.message")}
        extra={
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate("/")}
          >
            {t("menu.home")}
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
