// src/App.jsx - AuthProvider bilan yangilangan
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { ConfigProvider, App as AntApp, theme } from "antd";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import { store } from "./store";
import { useAppSelector, useAppDispatch } from "./hooks/redux";
import { updateDeviceInfo } from "./store/slices/uiSlice";
import { syncUserFromStorage } from "./store/slices/AuthSlice";
import { useTranslation } from "react-i18next";

// Auth Provider - QO'SHILDI
import { AuthProvider } from "./contexts/AuthContext";

// Components
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Simple Components
import SimpleSpellChecker from "./components/SpellChecker/SpellChecker";
import Transliterator from "./components/Transliterator/Transliterator";
import DocumentGenerator from "./components/DocumentGenerator/DocumentGenerator";

// Auth Components - QO'SHILDI
import { LoginModal, SignupModal, ProfileModal } from "./components/Auth";

// Styles
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles/globals.css";

// Error Boundary
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import HistoryPage from "./components/History/HistoryPage";

// Theme configuration
const createMuiTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#60a5fa" : "#3b82f6",
      },
      secondary: {
        main: mode === "dark" ? "#f87171" : "#ef4444",
      },
      background: {
        default: mode === "dark" ? "#1f2937" : "#ffffff",
        paper: mode === "dark" ? "#374151" : "#f9fafb",
      },
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
    },
  });

// Ant Design theme
const antTheme = (isDark) => ({
  token: {
    colorPrimary: "#3b82f6",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
});

// Main App component
function AppContent() {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === "dark";
  const { i18n } = useTranslation();

  // Device resize handler
  useEffect(() => {
    const handleResize = () => {
      dispatch(updateDeviceInfo());
    };

    // Initial device info
    dispatch(updateDeviceInfo());

    // Add event listener
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  // Auth initialization - QO'SHILDI
  useEffect(() => {
    // Sync user from localStorage on app start
    dispatch(syncUserFromStorage());
  }, [dispatch]);

  // Theme initialization
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Language initialization
  useEffect(() => {
    const savedLanguage = localStorage.getItem("userLanguage");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const muiTheme = createMuiTheme(isDark ? "dark" : "light");

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ConfigProvider theme={antTheme(isDark)}>
        <AntApp>
          <Router>
            <ErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/spellcheck" element={<SimpleSpellChecker />} />
                  <Route path="/translate" element={<Transliterator />} />
                  <Route path="/document" element={<DocumentGenerator />} />
                  <Route path="/about" element={<About />} />

                  {/* Protected Routes - QO'SHILDI */}
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ErrorBoundary>
          </Router>

          {/* Auth Modals - QO'SHILDI */}
          <LoginModal />
          <SignupModal />
          <ProfileModal />

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
            theme={isDark ? "dark" : "light"}
            className="toast-container"
            limit={3}
          />
        </AntApp>
      </ConfigProvider>
    </ThemeProvider>
  );
}

// Main App wrapper with Redux Provider and AuthProvider
function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
}

export default App;
