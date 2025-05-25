import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Theme
  theme: localStorage.getItem("theme") || "light",

  // Active tab
  activeTab: "/", // spellcheck, translate

  // Sidebar
  sidebarOpen: false,
  sidebarCollapsed: false,

  // Modals
  modals: {
    about: false,
    settings: false,
    history: false,
    statistics: false,
    help: false,
  },

  // Loading states
  globalLoading: false,

  // Notifications
  notifications: [],

  // Layout
  layout: {
    textEditor: {
      fontSize: parseInt(localStorage.getItem("fontSize")) || 16,
      fontFamily: localStorage.getItem("fontFamily") || "Inter",
      lineHeight: parseFloat(localStorage.getItem("lineHeight")) || 1.6,
      showLineNumbers: localStorage.getItem("showLineNumbers") === "true",
      wordWrap: localStorage.getItem("wordWrap") !== "false",
    },
    panels: {
      showStatistics: true,
      showSuggestions: true,
      panelSize: "medium", // small, medium, large
    },
  },

  // Preferences
  preferences: {
    language: localStorage.getItem("appLanguage") || "kaa", // kaa, uz, ru, en
    autoSave: localStorage.getItem("autoSave") !== "false",
    shortcuts: localStorage.getItem("shortcuts") !== "false",
    animations: localStorage.getItem("animations") !== "false",
    sounds: localStorage.getItem("sounds") === "true",
  },

  // Device info
  device: {
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  },

  // Keyboard shortcuts
  shortcuts: {
    checkText: "Ctrl+Enter",
    translate: "Ctrl+T",
    clearText: "Ctrl+L",
    toggleTheme: "Ctrl+D",
    openSettings: "Ctrl+,",
  },

  // Error handling
  errorBoundary: {
    hasError: false,
    error: null,
    errorInfo: null,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);

      // DOM da class qo'shish/olib tashlash
      if (action.payload === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    toggleTheme: (state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      uiSlice.caseReducers.setTheme(state, { payload: newTheme });
    },

    // Active tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    // Sidebar
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },

    // Modals
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },

    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key] = false;
      });
    },

    // Global loading
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },

    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: action.payload.type || "info", // success, error, warning, info
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        timestamp: new Date().toISOString(),
      };

      state.notifications.unshift(notification);

      // Maksimal 10 ta notification saqlash
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(0, 10);
      }
    },

    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Layout - Text Editor
    setFontSize: (state, action) => {
      state.layout.textEditor.fontSize = action.payload;
      localStorage.setItem("fontSize", action.payload.toString());
    },

    setFontFamily: (state, action) => {
      state.layout.textEditor.fontFamily = action.payload;
      localStorage.setItem("fontFamily", action.payload);
    },

    setLineHeight: (state, action) => {
      state.layout.textEditor.lineHeight = action.payload;
      localStorage.setItem("lineHeight", action.payload.toString());
    },

    setShowLineNumbers: (state, action) => {
      state.layout.textEditor.showLineNumbers = action.payload;
      localStorage.setItem("showLineNumbers", action.payload.toString());
    },

    setWordWrap: (state, action) => {
      state.layout.textEditor.wordWrap = action.payload;
      localStorage.setItem("wordWrap", action.payload.toString());
    },

    // Layout - Panels
    setShowStatistics: (state, action) => {
      state.layout.panels.showStatistics = action.payload;
    },

    setShowSuggestions: (state, action) => {
      state.layout.panels.showSuggestions = action.payload;
    },

    setPanelSize: (state, action) => {
      state.layout.panels.panelSize = action.payload;
    },

    // Preferences
    setLanguage: (state, action) => {
      state.preferences.language = action.payload;
      localStorage.setItem("appLanguage", action.payload);
    },

    setAutoSave: (state, action) => {
      state.preferences.autoSave = action.payload;
      localStorage.setItem("autoSave", action.payload.toString());
    },

    setShortcuts: (state, action) => {
      state.preferences.shortcuts = action.payload;
      localStorage.setItem("shortcuts", action.payload.toString());
    },

    setAnimations: (state, action) => {
      state.preferences.animations = action.payload;
      localStorage.setItem("animations", action.payload.toString());
    },

    setSounds: (state, action) => {
      state.preferences.sounds = action.payload;
      localStorage.setItem("sounds", action.payload.toString());
    },

    // Device info yangilash
    updateDeviceInfo: (state) => {
      const width = window.innerWidth;
      state.device = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      };
    },

    // Shortcuts
    updateShortcut: (state, action) => {
      const { key, value } = action.payload;
      state.shortcuts[key] = value;
    },

    resetShortcuts: (state) => {
      state.shortcuts = initialState.shortcuts;
    },

    // Error boundary
    setError: (state, action) => {
      state.errorBoundary = {
        hasError: true,
        error: action.payload.error,
        errorInfo: action.payload.errorInfo,
      };
    },

    clearError: (state) => {
      state.errorBoundary = {
        hasError: false,
        error: null,
        errorInfo: null,
      };
    },

    // Bulk preferences update
    updatePreferences: (state, action) => {
      Object.keys(action.payload).forEach((key) => {
        if (key in state.preferences) {
          state.preferences[key] = action.payload[key];
          localStorage.setItem(key, action.payload[key].toString());
        }
      });
    },

    // Reset to defaults
    resetToDefaults: (state) => {
      // Theme
      state.theme = "light";
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");

      // Layout
      state.layout = initialState.layout;
      Object.keys(initialState.layout.textEditor).forEach((key) => {
        localStorage.setItem(
          key,
          initialState.layout.textEditor[key].toString()
        );
      });

      // Preferences
      state.preferences = initialState.preferences;
      Object.keys(initialState.preferences).forEach((key) => {
        localStorage.setItem(key, initialState.preferences[key].toString());
      });

      // Notifications
      state.notifications = [];

      // Modals
      state.modals = initialState.modals;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setActiveTab,
  setSidebarOpen,
  toggleSidebar,
  setSidebarCollapsed,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setFontSize,
  setFontFamily,
  setLineHeight,
  setShowLineNumbers,
  setWordWrap,
  setShowStatistics,
  setShowSuggestions,
  setPanelSize,
  setLanguage,
  setAutoSave,
  setShortcuts,
  setAnimations,
  setSounds,
  updateDeviceInfo,
  updateShortcut,
  resetShortcuts,
  setError,
  clearError,
  updatePreferences,
  resetToDefaults,
} = uiSlice.actions;

export default uiSlice.reducer;
