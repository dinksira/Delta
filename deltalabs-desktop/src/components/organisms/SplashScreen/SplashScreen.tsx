/**
 * SplashScreen
 * Cinematic logo reveal animation shown only in the Electron desktop shell.
 * Five-phase sequence: spark → facet assembly → depth breath + shimmer →
 * wordmark rise → hold + exit.
 *
 * @example
 * ```tsx
 * <SplashScreen onComplete={() => setReady(true)} />
 * ```
 */

"use client";

import React, { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SplashScreenProps {
  /** Called once the full animation completes and the splash fades out. */
  onComplete: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGO_SRC = "/delta-logo.svg";

/** Exponential ease-out used across all cinematic reveals. */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Clip-path polygons matching the Delta prism's three visual faces. */
const FACE_CLIPS = {
  /** Bright left face — covers left half of the prism. */
  left: "polygon(0% 0%, 52% 0%, 52% 52%, 52% 102%, 0% 102%)",
  leftHidden: "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%)",

  /** Upper-right face — top edge of the right side. */
  topRight: "polygon(48% 0%, 100% 0%, 100% 54%, 48% 54%)",
  topRightHidden: "polygon(48% 0%, 100% 0%, 100% 0%, 48% 0%)",

  /** Dark lower-right face — bottom shadow of the prism. */
  bottomRight: "polygon(48% 46%, 100% 46%, 100% 102%, 48% 102%)",
  bottomRightHidden: "polygon(100% 46%, 100% 46%, 100% 102%, 100% 102%)",
} as const;

/** Phase timing in seconds. */
const TIMING = {
  sparkDuration: 0.4,
  face1Delay: 0.4,
  face2Delay: 0.58,
  face3Delay: 0.76,
  faceDuration: 0.28,
  breathDelay: 1.2,
  breathDuration: 0.6,
  shimmerDelay: 1.25,
  shimmerDuration: 0.5,
  wordmarkDelay: 1.8,
  wordmarkDuration: 0.6,
  holdEnd: 3.0,
  exitDuration: 0.4,
} as const;

const TOTAL_DURATION_MS =
  (TIMING.holdEnd + TIMING.exitDuration) * 1000;

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/** Shared absolute-fill style for logo face layers. */
const faceStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const exitTimer = setTimeout(
      () => setVisible(false),
      TIMING.holdEnd * 1000,
    );
    const completeTimer = setTimeout(onComplete, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TIMING.exitDuration } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* ── Phase 1: The Spark ── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 0.6, 0.4] }}
            transition={{ duration: TIMING.sparkDuration, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background:
                "radial-gradient(circle 60px, rgba(180,220,220,0.6), transparent)",
            }}
          />

          {/* ── Phases 2–3: Logo assembly + breath ── */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1, 1.06, 1] }}
            transition={{
              duration: TIMING.breathDelay + TIMING.breathDuration,
              times: [0, 0.67, 0.68, 1],
              ease: EASE_OUT_EXPO,
            }}
            style={{ position: "relative", width: 180, height: 180 }}
          >
            {/* Face 1 — bright left */}
            <motion.img
              src={LOGO_SRC}
              alt=""
              draggable={false}
              initial={{
                clipPath: FACE_CLIPS.leftHidden,
                filter: "blur(4px)",
              }}
              animate={{
                clipPath: FACE_CLIPS.left,
                filter: "blur(0px)",
              }}
              transition={{
                delay: TIMING.face1Delay,
                duration: TIMING.faceDuration,
                ease: EASE_OUT_EXPO,
              }}
              style={faceStyle}
            />

            {/* Face 2 — upper-right */}
            <motion.img
              src={LOGO_SRC}
              alt=""
              draggable={false}
              initial={{
                clipPath: FACE_CLIPS.topRightHidden,
                filter: "blur(4px)",
              }}
              animate={{
                clipPath: FACE_CLIPS.topRight,
                filter: "blur(0px)",
              }}
              transition={{
                delay: TIMING.face2Delay,
                duration: TIMING.faceDuration,
                ease: EASE_OUT_EXPO,
              }}
              style={faceStyle}
            />

            {/* Face 3 — dark bottom-right */}
            <motion.img
              src={LOGO_SRC}
              alt=""
              draggable={false}
              initial={{
                clipPath: FACE_CLIPS.bottomRightHidden,
                filter: "blur(4px)",
              }}
              animate={{
                clipPath: FACE_CLIPS.bottomRight,
                filter: "blur(0px)",
              }}
              transition={{
                delay: TIMING.face3Delay,
                duration: TIMING.faceDuration,
                ease: EASE_OUT_EXPO,
              }}
              style={faceStyle}
            />

            {/* Shimmer sweep overlay */}
            <motion.div
              initial={{ backgroundPositionX: "-200%" }}
              animate={{ backgroundPositionX: "200%" }}
              transition={{
                delay: TIMING.shimmerDelay,
                duration: TIMING.shimmerDuration,
                ease: "linear",
              }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                backgroundSize: "200% 100%",
                pointerEvents: "none",
              }}
            />
          </motion.div>

          {/* ── Phase 4: Wordmark rise ── */}
          <motion.p
            initial={{ opacity: 0, y: 10, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.12em" }}
            transition={{
              delay: TIMING.wordmarkDelay,
              duration: TIMING.wordmarkDuration,
              ease: EASE_OUT_EXPO,
            }}
            style={{
              marginTop: 24,
              fontSize: 14,
              fontFamily: "var(--font-syne), 'Syne', sans-serif",
              fontWeight: 300,
              color: "rgba(13,13,13,0.85)",
              textTransform: "uppercase",
            }}
          >
            Delta Labs
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SplashScreen;
