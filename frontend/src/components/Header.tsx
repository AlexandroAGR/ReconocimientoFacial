import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  return (
    <header className="top-header">
      <button
        className="mobile-menu"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <div className="header-title">
        <span>Sistema de reconocimiento</span>
        <strong>Centro de control</strong>
      </div>

      <div className="header-actions">
        <button
          className="theme-button"
          onClick={() => setDarkMode(!darkMode)}
          title="Cambiar tema"
        >
          {darkMode ? "☀" : "☾"}
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            A
          </div>

          <div className="user-info">
            <strong>Administrador</strong>
            <span>Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

