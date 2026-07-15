"use client";

import { useEffect, useRef } from "react";

export default function IntroScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.play().catch(() => {});

    video.onended = () => {
      onFinish();
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}