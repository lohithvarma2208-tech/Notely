"use client";

import { useEffect, useState } from "react";

export default function RotatingWord({
  words,
  interval = 2200,
}: {
  words: string[];
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((v) => (v + 1) % words.length);
        setVisible(true);
      }, 220);
    }, interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span
      className="inline-block text-accent-600 transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {words[i]}
    </span>
  );
}
