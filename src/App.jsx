import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { ConfigProvider, App as AntApp, theme } from "antd"; // Import theme from antd
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import { store } from "./store";
import { useAppSelector, useAppDispatch } from "./hooks/redux";
import { updateDeviceInfo } from "./store/slices/uiSlice";

// Components
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Styles
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles/globals.css";

// Error Boundary
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import SpellChecker from "./components/SpellChecker/SpellChecker";
import Transliterator from "./components/Transliterator/Transliterator";

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
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor:
              mode === "dark" ? "#6b7280 #374151" : "#d1d5db #f9fafb",
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              backgroundColor: mode === "dark" ? "#374151" : "#f9fafb",
              width: 8,
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: mode === "dark" ? "#6b7280" : "#d1d5db",
              minHeight: 24,
            },
          },
        },
      },
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
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, // Use imported theme algorithms
});

// Main App component with theme and device detection
function AppContent() {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === "dark";

  // Device resize handler
  useEffect(() => {
    const handleResize = () => {
      dispatch(updateDeviceInfo());
    };

    // Initial device info
    dispatch(updateDeviceInfo());

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  // Theme initialization
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

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
                  <Route path="/spellcheck" element={<SpellChecker />} />
                  <Route path="/translate" element={<Transliterator />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ErrorBoundary>
          </Router>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={isDark ? "dark" : "light"}
            className="toast-container"
          />
        </AntApp>
      </ConfigProvider>
    </ThemeProvider>
  );
}

// Main App wrapper with Redux Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
