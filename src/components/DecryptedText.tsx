import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

const styles = {
  wrapper: {
    display: "inline-block",
    whiteSpace: "pre-wrap",
  },
  srOnly: {
    position: "absolute" as const,
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
  },
};

interface DecryptedTextProps extends HTMLMotionProps<"span"> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover" | "inViewHover" | "click";
  clickMode?: "once" | "toggle";
}

type Direction = "forward" | "reverse";

export default function DecryptedText({
  text,
  speed = 70,
  maxIterations = 15,
  sequential = true,
  revealDirection = "end",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  clickMode = "once",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(
    animateOn !== "click",
  );
  const [direction, setDirection] = useState<Direction>("forward");

  const containerRef = useRef<HTMLSpanElement>(null);
  const orderRef = useRef<number[]>([]);
  const pointerRef = useRef<number>(0);
  const animStateRef = useRef<{
    revealed: Set<number>;
    currentIteration: number;
    display: string;
    rafId: number | null;
    lastFrameTime: number;
  }>({
    revealed: new Set(),
    currentIteration: 0,
    display: text,
    rafId: null,
    lastFrameTime: 0,
  });

  const availableChars = useMemo<string[]>(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  // Pre-generate shuffled text to avoid Math.random() in render
  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      let result = "";
      for (let i = 0; i < originalText.length; i++) {
        const char = originalText[i];
        if (char === " " || currentRevealed.has(i)) {
          result += char === " " ? " " : originalText[i];
        } else {
          result += availableChars[Math.floor(Math.random() * availableChars.length)];
        }
      }
      return result;
    },
    [availableChars],
  );

  const computeOrder = useCallback(
    (len: number): number[] => {
      const order: number[] = [];
      if (len <= 0) return order;
      if (revealDirection === "start") {
        for (let i = 0; i < len; i++) order.push(i);
        return order;
      }
      if (revealDirection === "end") {
        for (let i = len - 1; i >= 0; i--) order.push(i);
        return order;
      }
      // center
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.ceil(offset / 2);
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
      return order.slice(0, len);
    },
    [revealDirection],
  );

  const fillAllIndices = useCallback((): Set<number> => {
    const s = new Set<number>();
    for (let i = 0; i < text.length; i++) s.add(i);
    return s;
  }, [text]);

  const removeRandomIndices = useCallback(
    (set: Set<number>, count: number): Set<number> => {
      const arr = Array.from(set);
      for (let i = 0; i < count && arr.length > 0; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        arr.splice(idx, 1);
      }
      return new Set(arr);
    },
    [],
  );

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    animStateRef.current.revealed = emptySet;
    const shuffled = shuffleText(text, emptySet);
    setDisplayText(shuffled);
    animStateRef.current.display = shuffled;
    setIsDecrypted(false);
  }, [text, shuffleText]);

  const triggerDecrypt = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length);
      pointerRef.current = 0;
      const emptySet = new Set<number>();
      setRevealedIndices(emptySet);
      animStateRef.current.revealed = emptySet;
    } else {
      const emptySet = new Set<number>();
      setRevealedIndices(emptySet);
      animStateRef.current.revealed = emptySet;
    }
    animStateRef.current.currentIteration = 0;
    setDirection("forward");
    setIsAnimating(true);
  }, [sequential, computeOrder, text.length]);

  const triggerReverse = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length).slice().reverse();
      pointerRef.current = 0;
      const all = fillAllIndices();
      setRevealedIndices(all);
      animStateRef.current.revealed = all;
      const shuffled = shuffleText(text, all);
      setDisplayText(shuffled);
      animStateRef.current.display = shuffled;
    } else {
      const all = fillAllIndices();
      setRevealedIndices(all);
      animStateRef.current.revealed = all;
      const shuffled = shuffleText(text, all);
      setDisplayText(shuffled);
      animStateRef.current.display = shuffled;
    }
    setDirection("reverse");
    setIsAnimating(true);
  }, [sequential, computeOrder, fillAllIndices, shuffleText, text]);

  // Use requestAnimationFrame instead of setInterval for better performance
  useEffect(() => {
    if (!isAnimating) return;

    const state = animStateRef.current;
    const frameInterval = speed;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const textLength = text.length;
      switch (revealDirection) {
        case "start":
          return revealedSet.size;
        case "end":
          return textLength - 1 - revealedSet.size;
        case "center": {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex =
            revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (
            nextIndex >= 0 &&
            nextIndex < textLength &&
            !revealedSet.has(nextIndex)
          ) {
            return nextIndex;
          }

          for (let i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    const tick = (timestamp: number) => {
      if (!isAnimating) return;

      if (timestamp - state.lastFrameTime < frameInterval) {
        state.rafId = requestAnimationFrame(tick);
        return;
      }
      state.lastFrameTime = timestamp;

      if (sequential) {
        // Forward
        if (direction === "forward") {
          if (state.revealed.size < text.length) {
            const nextIndex = getNextIndex(state.revealed);
            const newRevealed = new Set(state.revealed);
            newRevealed.add(nextIndex);
            state.revealed = newRevealed;
            const newText = shuffleText(text, newRevealed);
            state.display = newText;
            setRevealedIndices(newRevealed);
            setDisplayText(newText);
            state.rafId = requestAnimationFrame(tick);
          } else {
            setIsAnimating(false);
            setIsDecrypted(true);
          }
          return;
        }
        // Reverse
        if (direction === "reverse") {
          if (pointerRef.current < orderRef.current.length) {
            const idxToRemove = orderRef.current[pointerRef.current++];
            const newRevealed = new Set(state.revealed);
            newRevealed.delete(idxToRemove);
            state.revealed = newRevealed;
            const newText = shuffleText(text, newRevealed);
            state.display = newText;
            setRevealedIndices(newRevealed);
            setDisplayText(newText);
            if (newRevealed.size === 0) {
              setIsAnimating(false);
              setIsDecrypted(false);
            } else {
              state.rafId = requestAnimationFrame(tick);
            }
          } else {
            setIsAnimating(false);
            setIsDecrypted(false);
          }
          return;
        }
      } else {
        // Non-Sequential
        if (direction === "forward") {
          const newText = shuffleText(text, state.revealed);
          state.display = newText;
          setDisplayText(newText);
          state.currentIteration++;
          if (state.currentIteration >= maxIterations) {
            setIsAnimating(false);
            setDisplayText(text);
            setIsDecrypted(true);
          } else {
            state.rafId = requestAnimationFrame(tick);
          }
          return;
        }

        // Non-Sequential Reverse
        if (direction === "reverse") {
          let currentSet = state.revealed;
          if (currentSet.size === 0) {
            currentSet = fillAllIndices();
            state.revealed = currentSet;
          }
          const removeCount = Math.max(
            1,
            Math.ceil(text.length / Math.max(1, maxIterations)),
          );
          const nextSet = removeRandomIndices(currentSet, removeCount);
          state.revealed = nextSet;
          const newText = shuffleText(text, nextSet);
          state.display = newText;
          setDisplayText(newText);
          state.currentIteration++;
          if (nextSet.size === 0 || state.currentIteration >= maxIterations) {
            setIsAnimating(false);
            setIsDecrypted(false);
            const finalText = shuffleText(text, new Set());
            setDisplayText(finalText);
            state.display = finalText;
            state.revealed = new Set();
          } else {
            state.rafId = requestAnimationFrame(tick);
          }
          return;
        }
      }
    };

    state.rafId = requestAnimationFrame(tick);

    return () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    };
  }, [
    isAnimating,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    shuffleText,
    direction,
    fillAllIndices,
    removeRandomIndices,
  ]);

  /* Click Behaviour */
  const handleClick = () => {
    if (animateOn !== "click") return;

    if (clickMode === "once") {
      if (isDecrypted) return;
      setDirection("forward");
      triggerDecrypt();
    }

    if (clickMode === "toggle") {
      if (isDecrypted) {
        triggerReverse();
      } else {
        setDirection("forward");
        triggerDecrypt();
      }
    }
  };

  /* Hover Behaviour */
  const triggerHoverDecrypt = useCallback(() => {
    if (isAnimating) return;

    // Reset animation state cleanly
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    animStateRef.current.revealed = emptySet;
    setIsDecrypted(false);
    setDisplayText(text);
    animStateRef.current.display = text;

    setDirection("forward");
    setIsAnimating(true);
  }, [isAnimating, text]);

  const resetToPlainText = useCallback(() => {
    setIsAnimating(false);
    if (animStateRef.current.rafId) {
      cancelAnimationFrame(animStateRef.current.rafId);
      animStateRef.current.rafId = null;
    }
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    animStateRef.current.revealed = emptySet;
    setDisplayText(text);
    animStateRef.current.display = text;
    setIsDecrypted(true);
    setDirection("forward");
  }, [text]);

  /* View Observer */
  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "inViewHover") return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => {
    // Defer state updates to next microtask to avoid cascading renders
    queueMicrotask(() => {
    if (animateOn === "click") {
      encryptInstantly();
    } else {
      setDisplayText(text);
      animStateRef.current.display = text;
      setIsDecrypted(true);
    }
    setRevealedIndices(new Set());
    animStateRef.current.revealed = new Set();
      setDirection("forward");
    });
  }, [animateOn, text, encryptInstantly]);

  const animateProps =
    animateOn === "hover" || animateOn === "inViewHover"
      ? {
          onMouseEnter: triggerHoverDecrypt,
          onMouseLeave: resetToPlainText,
        }
      : animateOn === "click"
        ? {
            onClick: handleClick,
          }
        : {};

  // Memoize the character rendering to avoid recreating spans on every render
  const charElements = useMemo(() => {
    return displayText.split("").map((char, index) => {
      const isRevealedOrDone =
        revealedIndices.has(index) || (!isAnimating && isDecrypted);

      return (
        <span
          key={index}
          className={isRevealedOrDone ? className : encryptedClassName}
        >
          {char}
        </span>
      );
    });
  }, [displayText, revealedIndices, isAnimating, isDecrypted, className, encryptedClassName]);

  return (
    <motion.span
      className={parentClassName}
      ref={containerRef}
      style={styles.wrapper}
      {...animateProps}
      {...props}
    >
      <span style={styles.srOnly}>{displayText}</span>

      <span aria-hidden="true">
        {charElements}
      </span>
    </motion.span>
  );
}
