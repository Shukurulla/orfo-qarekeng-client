// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./i18n"; // i18n konfiguratsiyasini import qilish

// Initialize theme from localStorage
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
