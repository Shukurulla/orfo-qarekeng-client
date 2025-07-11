// src/components/Layout/Layout.jsx - Auth bilan yangilangan

import React, { useState, useEffect } from "react";
import {
  Layout as AntLayout,
  Menu,
  Button,
  Drawer,
  Switch,
  Tooltip,
  Space,
  Dropdown,
  Avatar,
  Badge,
  Divider,
} from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  SunOutlined,
  MoonOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  HistoryOutlined,
  SettingOutlined,
  CrownOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  setActiveTab,
  toggleTheme,
  setSidebarOpen,
  openModal,
} from "@/store/slices/uiSlice";
import {
  showLoginModal,
  showSignupModal,
  showProfileModal,
  logoutLocal,
  authUtils,
} from "@/store/slices/AuthSlice";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

const { Header, Content, Sider } = AntLayout;

const Layout = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const { theme, activeTab, sidebarOpen, device } = useAppSelector(
    (state) => state.ui
  );

  // Auth state
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const isDark = theme === "dark";
  const { isMobile, isTablet } = device;

  // Local state
  const [collapsed, setCollapsed] = useState(isMobile);

  // Update collapsed state based on device
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  // Theme toggle effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Get user plan status
  const planStatus = user
    ? authUtils.getPlanStatus(user)
    : { plan: "start", isActive: false };

  // Menu items
  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: t("menu.home"),
      onClick: () => {
        dispatch(setActiveTab("/"));
        navigate("/");
        if (isMobile) dispatch(setSidebarOpen(false));
      },
    },
    {
      key: "spellcheck",
      icon: <CheckCircleOutlined />,
      label: t("menu.spellCheck"),
      onClick: () => {
        dispatch(setActiveTab("spellcheck"));
        navigate("/spellcheck");
        if (isMobile) dispatch(setSidebarOpen(false));
      },
    },
    {
      key: "translate",
      icon: <TranslationOutlined />,
      label: t("menu.transliteration"),
      onClick: () => {
        dispatch(setActiveTab("translate"));
        navigate("/translate");
        if (isMobile) dispatch(setSidebarOpen(false));
      },
    },
    {
      key: "document",
      icon: <FileTextOutlined />,
      label: t("menu.documentGenerator"),
      onClick: () => {
        dispatch(setActiveTab("document"));
        navigate("/document");
        if (isMobile) dispatch(setSidebarOpen(false));
      },
    },
    {
      type: "divider",
    },
    {
      key: "about",
      icon: <InfoCircleOutlined />,
      label: t("menu.about"),
      onClick: () => {
        navigate("/about");
        dispatch(setActiveTab("about"));
        if (isMobile) dispatch(setSidebarOpen(false));
      },
    },
  ];

  // Auth menu items - QO'SHILDI
  const authMenuItems = isAuthenticated
    ? [
        {
          type: "divider",
        },
        {
          key: "history",
          icon: <HistoryOutlined />,
          label: "Tarix",
          onClick: () => {
            navigate("/history");
            if (isMobile) dispatch(setSidebarOpen(false));
          },
        },
      ]
    : [];

  // Combined menu items
  const allMenuItems = [...menuItems, ...authMenuItems];

  // Profile dropdown menu
  const profileMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil",
      onClick: () => dispatch(showProfileModal()),
    },
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "Tarix",
      onClick: () => navigate("/history"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Chiqish",
      onClick: () => dispatch(logoutLocal()),
      danger: true,
    },
  ];

  // User display name
  const getUserDisplayName = () => {
    if (!user) return "";
    return `${user.firstName} ${user.lastName}`;
  };

  // User avatar
  const getUserAvatar = () => {
    if (user?.avatar) {
      return user.avatar;
    }
    return user?.firstName?.charAt(0)?.toUpperCase() || "U";
  };

  // Active menu key based on current route and tab
  const getActiveKey = () => {
    if (location.pathname === "/about") return "about";
    if (location.pathname === "/spellcheck") return "spellcheck";
    if (location.pathname === "/translate") return "translate";
    if (location.pathname === "/document") return "document";
    if (location.pathname === "/history") return "history";
    if (location.pathname === "/" && activeTab === "spellcheck")
      return "spellcheck";
    if (location.pathname === "/" && activeTab === "translate")
      return "translate";
    if (location.pathname === "/" && activeTab === "document")
      return "document";
    return "/";
  };

  // Get page title
  const getPageTitle = () => {
    if (location.pathname === "/about") return t("menu.about");
    if (location.pathname === "/spellcheck") return t("menu.spellCheck");
    if (location.pathname === "/translate") return t("menu.transliteration");
    if (location.pathname === "/document") return t("menu.documentGenerator");
    if (location.pathname === "/history") return "Tarix";
    if (location.pathname === "/" && activeTab === "spellcheck")
      return t("menu.spellCheck");
    if (location.pathname === "/" && activeTab === "translate")
      return t("menu.transliteration");
    if (location.pathname === "/" && activeTab === "document")
      return t("menu.documentGenerator");
    return t("menu.home");
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
                  {t("common.appName")}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("menu.spellCheck")}
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
          items={allMenuItems}
          theme={isDark ? "dark" : "light"}
        />
      </div>

      {/* Auth buttons for non-authenticated users - QO'SHILDI */}
      {!isAuthenticated && !collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => dispatch(showLoginModal())}
            block
          >
            Kirish
          </Button>
          <Button
            icon={<UserOutlined />}
            onClick={() => dispatch(showSignupModal())}
            block
          >
            Ro'yxatdan o'tish
          </Button>
        </div>
      )}

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
            className={collapsed ? "mx-auto" : ""}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AntLayout className="h-[100vh]">
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
              <span>{t("common.appName")}</span>
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
                  className="lg:hidden"
                />
              )}

              {/* Page title */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language switcher for desktop */}
              {!isMobile && <LanguageSwitcher />}

              {/* Notifications - placeholder */}
              {isAuthenticated && (
                <Tooltip title="Bildirishnomalar">
                  <Badge count={0} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </Badge>
                </Tooltip>
              )}

              {/* User Profile Dropdown - QO'SHILDI */}
              {isAuthenticated && user ? (
                <Dropdown
                  menu={{ items: profileMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    className="flex items-center space-x-2 px-2"
                  >
                    <Avatar size="small" className="bg-blue-500">
                      {getUserAvatar()}
                    </Avatar>
                    {!isMobile && (
                      <span className="text-gray-900 dark:text-white">
                        {user.firstName}
                      </span>
                    )}
                    {planStatus.plan === "pro" && planStatus.isActive && (
                      <CrownOutlined className="text-yellow-500" />
                    )}
                  </Button>
                </Dropdown>
              ) : (
                /* Auth buttons for header - QO'SHILDI */
                <Space>
                  <Button
                    type="text"
                    onClick={() => dispatch(showLoginModal())}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Kirish
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => dispatch(showSignupModal())}
                  >
                    Ro'yxatdan o'tish
                  </Button>
                </Space>
              )}

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
            </div>
          </div>
        </Header>

        {/* Main Content */}
        <Content className="bg-gray-50 dark:bg-gray-900 h-[90vh] overflow-y-scroll">
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
