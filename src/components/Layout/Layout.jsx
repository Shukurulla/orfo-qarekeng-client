import React, { useState, useEffect } from "react";
import {
  Layout as AntLayout,
  Menu,
  Button,
  Drawer,
  Switch,
  Tooltip,
} from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  setActiveTab,
  toggleTheme,
  setSidebarOpen,
  openModal,
} from "@/store/slices/uiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const { Header, Content, Sider } = AntLayout;

const Layout = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, activeTab, sidebarOpen, device } = useAppSelector(
    (state) => state.ui
  );

  const isDark = theme === "dark";
  const { isMobile, isTablet } = device;

  // Local state
  const [collapsed, setCollapsed] = useState(isMobile);

  // Update collapsed state based on device
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  // Menu items
  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Bosh sahifa",
      onClick: () => {
        dispatch(setActiveTab("/"));
        navigate("/");
      },
    },
    {
      key: "spellcheck",
      icon: <CheckCircleOutlined />,
      label: "Imlo tekshiruv",
      onClick: () => {
        dispatch(setActiveTab("spellcheck"));
        navigate("/spellcheck");
      },
    },
    {
      key: "translate",
      icon: <TranslationOutlined />,
      label: "Transliteratsiya",
      onClick: () => {
        dispatch(setActiveTab("translate"));
        navigate("/translate");
      },
    },
    {
      type: "divider",
    },
    {
      key: "about",
      icon: <InfoCircleOutlined />,
      label: "Loyiha haqida",
      onClick: () => {
        navigate("/about");
        dispatch(setActiveTab("about"));
      },
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Sozlamalar",
      onClick: () => dispatch(openModal("settings")),
    },
  ];

  // Active menu key
  const getActiveKey = () => {
    if (location.pathname !== "/") {
      return "Bosh sahifa";
    }
    return activeTab;
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">қ</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Qoraqolpoq
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Imlo tekshiruvchi
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 py-4">
        <Menu
          mode="inline"
          selectedKeys={[getActiveKey()]}
          style={{ border: "none" }}
          className="bg-transparent"
          items={menuItems}
        />
      </div>

      {/* Theme toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Dark mode
            </span>
          )}
          <Switch
            checked={isDark}
            onChange={() => dispatch(toggleTheme())}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AntLayout className="min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="shadow-lg"
          width={280}
          collapsedWidth={80}
          theme={isDark ? "dark" : "light"}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">қ</span>
              </div>
              <span>Qoraqolpoq</span>
            </div>
          }
          placement="left"
          onClose={() => dispatch(setSidebarOpen(false))}
          open={sidebarOpen}
          width={280}
          className="mobile-drawer"
        >
          {sidebarContent}
        </Drawer>
      )}

      <AntLayout>
        {/* Header */}
        <Header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => dispatch(setSidebarOpen(true))}
                  className="text-gray-600 dark:text-gray-300"
                />
              )}

              {/* Desktop collapse toggle */}
              {!isMobile && (
                <Button
                  type="text"
                  icon={collapsed ? <MenuOutlined /> : <CloseOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="text-gray-600 dark:text-gray-300"
                />
              )}

              {/* Page title */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {location.pathname === "/about"
                    ? "Loyiha haqida"
                    : activeTab === "spellcheck"
                    ? "Imlo tekshiruv"
                    : activeTab === "translate"
                    ? "Transliteratsiya"
                    : "Bosh sahifa"}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme toggle for mobile */}
              {isMobile && (
                <Tooltip title="Rang rejimini almashtirish">
                  <Button
                    type="text"
                    icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                    onClick={() => dispatch(toggleTheme())}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </Tooltip>
              )}

              {/* Settings */}
              <Tooltip title="Sozlamalar">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => dispatch(openModal("settings"))}
                  className="text-gray-600 dark:text-gray-300"
                />
              </Tooltip>
            </div>
          </div>
        </Header>

        {/* Main Content */}
        <Content className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
