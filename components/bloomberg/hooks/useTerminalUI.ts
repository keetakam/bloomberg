import { useAtom } from "jotai";
import { useCallback } from "react";
import {
  currentViewAtom,
  errorAtom,
  isDarkModeAtom,
  isShortcutsHelpOpenAtom,
  languageAtom,
} from "../atoms";

export function useTerminalUI() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [error, setError] = useAtom(errorAtom);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useAtom(isShortcutsHelpOpenAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  // Theme toggle handler
  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode, setIsDarkMode]);

  // Language toggle handler
  const handleLanguageToggle = useCallback(() => {
    setLanguage((l) => (l === "en" ? "th" : "en"));
  }, [setLanguage]);

  // View handlers
  const handleMarketView = useCallback(() => {
    setCurrentView("market");
  }, [setCurrentView]);

  const handleNewsView = useCallback(() => {
    setCurrentView("news");
  }, [setCurrentView]);

  const handleMoversView = useCallback(() => {
    setCurrentView("movers");
  }, [setCurrentView]);

  const handleVolatilityView = useCallback(() => {
    setCurrentView("volatility");
  }, [setCurrentView]);

  const handleRmiView = useCallback(() => {
    setCurrentView("rmi");
  }, [setCurrentView]);

  // Other UI handlers
  const handleCancelClick = useCallback(() => {
    console.log("Cancel clicked");
    // Add your cancel logic here
  }, []);

  const handleNewClick = useCallback(() => {
    console.log("New clicked");
    // Add your new item logic here
  }, []);

  const handleBlancClick = useCallback(() => {
    console.log("Blanc clicked");
    // Add your blanc logic here
  }, []);

  const handleHelpClick = useCallback(() => {
    setIsShortcutsHelpOpen(true);
  }, [setIsShortcutsHelpOpen]);

  const handleCloseShortcutsHelp = useCallback(() => {
    setIsShortcutsHelpOpen(false);
  }, [setIsShortcutsHelpOpen]);

  return {
    // State
    isDarkMode,
    language,
    error,
    isShortcutsHelpOpen,
    currentView,

    // Setters
    setIsDarkMode,
    setError,
    setIsShortcutsHelpOpen,
    setCurrentView,

    // Handlers
    handleThemeToggle,
    handleLanguageToggle,
    handleMarketView,
    handleNewsView,
    handleMoversView,
    handleVolatilityView,
    handleRmiView,
    handleCancelClick,
    handleNewClick,
    handleBlancClick,
    handleHelpClick,
    handleCloseShortcutsHelp,
  };
}
