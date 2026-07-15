"use client";

import { useState } from "react";
import IntroScreen from "./IntroScreen";

export default function AppLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return (
      <IntroScreen
        onFinish={() => setShowIntro(false)}
      />
    );
  }

  return <>{children}</>;
}