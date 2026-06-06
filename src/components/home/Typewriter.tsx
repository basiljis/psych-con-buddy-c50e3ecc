import { useEffect, useState } from "react";

interface TypewriterProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}

/**
 * Циклически печатает слова по буквам с эффектом мигающего курсора.
 */
export function Typewriter({
  words,
  className = "",
  typingSpeed = 70,
  deletingSpeed = 35,
  pauseMs = 1800,
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;
    const current = words[index % words.length];

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }

    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        );
      },
      deleting ? deletingSpeed : typingSpeed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, index, words, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className} aria-live="polite">
      {text}
      <span
        className="inline-block w-[0.08em] h-[0.9em] align-[-0.1em] ml-1 bg-current animate-pulse"
        aria-hidden="true"
      />
    </span>
  );
}
