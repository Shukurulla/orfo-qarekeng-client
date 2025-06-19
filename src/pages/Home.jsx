import React from "react";
import { useAppSelector } from "@/hooks/redux";
import SpellChecker from "@/components/SpellChecker/SpellChecker";
import Transliterator from "@/components/Transliterator/Transliterator";
import DocumentGenerator from "@/components/DocumentGenerator/DocumentGenerator";
import WelcomePage from "@/components/Welcome/WelcomePage";

const Home = () => {
  const { activeTab } = useAppSelector((state) => state.ui);

  const renderContent = () => {
    switch (activeTab) {
      case "spellcheck":
        return <SpellChecker />;
      case "translate":
        return <Transliterator />;
      case "document":
        return <DocumentGenerator />;
      default:
        return <WelcomePage />;
    }
  };

  return <div className="h-full">{renderContent()}</div>;
};

export default Home;
