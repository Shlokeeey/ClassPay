"use client";

import { useEffect, useState } from "react";
import IntroScreen from "./IntroScreen";

export default function AppLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIntro, setShowIntro] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem("introPlayed");

    if (!alreadyPlayed) {
      setShowIntro(true);
    }

    setReady(true);
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem("introPlayed", "true");
    setShowIntro(false);
  };

  if (!ready) return null;

  if (showIntro) {
    return <IntroScreen onFinish={handleFinish} />;
  }

  return <>{children}</>;
}