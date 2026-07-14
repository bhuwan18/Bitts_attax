"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HALF_TURN = 180;
/** Fraction of the card's width a drag must cross to complete a flip on distance alone. */
const COMMIT_DISTANCE_RATIO = 0.3;
/** px/ms — a flick this quick commits the flip however short it was. */
const COMMIT_VELOCITY = 0.4;
/** How far a pointer travels before we claim the gesture instead of leaving it to the page scroller. */
const AXIS_LOCK_SLOP_PX = 8;
/** A finger that has been still this long before lifting isn't flicking, however fast it was moving earlier. */
const STALE_VELOCITY_MS = 70;
/**
 * Deliberately under critical damping (which would be ~2·√stiffness ≈ 26): the card
 * overshoots its resting face by a degree or two and eases back, which is what makes it
 * read as an object with weight rather than as a CSS transition.
 */
const SPRING_STIFFNESS = 170;
const SPRING_DAMPING = 22;
/** deg/s — caps what a violent flick hands the spring, so the card can't whip through several turns. */
const MAX_LAUNCH_VELOCITY = 1600;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  /**
   * Pointer x when the gesture locked to the horizontal axis. Rotation is measured from
   * here, not from where the pointer first went down, so engaging the lock doesn't jump
   * the card by AXIS_LOCK_SLOP_PX worth of rotation.
   */
  originX: number;
  lastX: number;
  lastTime: number;
  /** px/ms, signed. */
  velocity: number;
  /** Angle the card was showing when grabbed — it may have been mid-spring. */
  baseAngle: number;
  /** Face the card was nearest when grabbed; an abandoned swipe returns here. */
  homeAngle: number;
  width: number;
  locked: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalize = (angle: number) => ((angle % 360) + 360) % 360;

/**
 * Which way a released swipe resolves: -1 or 1 to complete a flip that way, 0 to fall back
 * to the face it started from.
 *
 * A short swipe still flips if it was flicked hard enough, and a long one still flips even
 * if the finger came to a stop first. The case worth spelling out is a flick back the way
 * it came — dragged the card halfway, then whipped it back — which is a user changing their
 * mind, so it abandons the flip rather than committing one in the opposite direction.
 */
export function resolveFlipDirection({
  dx,
  velocity,
  width,
  cancelled = false,
}: {
  /** Horizontal travel since the swipe engaged, px. */
  dx: number;
  /** Signed pointer velocity at release, px/ms. Pass 0 for a finger that had already stopped. */
  velocity: number;
  /** Card width, px — thresholds scale with it so the gesture feels the same at any tile size. */
  width: number;
  cancelled?: boolean;
}): -1 | 0 | 1 {
  if (cancelled) return 0;

  const flicked = Math.abs(velocity) > COMMIT_VELOCITY ? Math.sign(velocity) : 0;
  if (flicked !== 0) {
    return (flicked === Math.sign(dx) ? flicked : 0) as -1 | 0 | 1;
  }
  const far = Math.abs(dx) > width * COMMIT_DISTANCE_RATIO;
  return (far ? Math.sign(dx) : 0) as -1 | 0 | 1;
}

/**
 * Swipe-to-flip for a two-faced card (a user's own photo on the front, the catalog's stock
 * image on the back).
 *
 * The rotation is written straight onto the scene element as `--flip-angle` / `--flip-tilt`
 * rather than held in React state: the angle changes every frame, and re-rendering a whole
 * tile 60 times a second across an inventory grid is the difference between a flip that
 * tracks your thumb and one that stutters. Only `showingBack` — which crosses over once per
 * flip — is state.
 */
export function useCardFlip({ enabled }: { enabled: boolean }) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [showingBack, setShowingBack] = useState(false);
  const [dragging, setDragging] = useState(false);

  const angleRef = useRef(0);
  /** deg/s. */
  const velocityRef = useRef(0);
  const restAngleRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const swipedRef = useRef(false);

  const paint = useCallback((angle: number) => {
    angleRef.current = angle;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--flip-angle", `${angle}deg`);
    // 0 with a face square-on, 1 edge-on. Drives the scale dip and the sheen.
    scene.style.setProperty("--flip-tilt", `${Math.abs(Math.sin((angle * Math.PI) / 180))}`);
    const turned = normalize(angle);
    setShowingBack(turned > 90 && turned < 270);
  }, []);

  const stopSpring = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  /** Spring the card from wherever it is now to `restAngleRef`, keeping any momentum it has. */
  const settle = useCallback(() => {
    stopSpring();

    const land = () => {
      // Fold full turns away once the card is at rest so the angle can't drift upward
      // over a long session; 360° and 0° are the same face.
      restAngleRef.current = normalize(restAngleRef.current);
      velocityRef.current = 0;
      paint(restAngleRef.current);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land();
      return;
    }

    let previous = performance.now();
    const step = (now: number) => {
      // Clamped so a backgrounded tab doesn't resume with one enormous, unstable step.
      const dt = Math.min((now - previous) / 1000, 1 / 30);
      previous = now;

      const displacement = angleRef.current - restAngleRef.current;
      velocityRef.current +=
        (-SPRING_STIFFNESS * displacement - SPRING_DAMPING * velocityRef.current) * dt;
      const next = angleRef.current + velocityRef.current * dt;

      if (Math.abs(next - restAngleRef.current) < 0.3 && Math.abs(velocityRef.current) < 6) {
        frameRef.current = null;
        land();
        return;
      }
      paint(next);
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }, [paint, stopSpring]);

  /** The button affordance — same spring, no gesture. */
  const flip = useCallback(() => {
    if (!enabled) return;
    restAngleRef.current += HALF_TURN;
    velocityRef.current = 0;
    settle();
  }, [enabled, settle]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      swipedRef.current = false;
      if (!enabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // The overlay controls own their own gestures.
      if ((event.target as HTMLElement).closest("button")) return;

      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: event.clientX,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocity: 0,
        baseAngle: angleRef.current,
        homeAngle: Math.round(angleRef.current / HALF_TURN) * HALF_TURN,
        width: event.currentTarget.getBoundingClientRect().width || 1,
        locked: false,
      };
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      if (!gesture.locked) {
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (Math.abs(dx) < AXIS_LOCK_SLOP_PX && Math.abs(dy) < AXIS_LOCK_SLOP_PX) return;
        if (Math.abs(dx) <= Math.abs(dy)) {
          // Vertical: the user is scrolling the grid, not flipping. Hand it back.
          gestureRef.current = null;
          return;
        }

        gesture.locked = true;
        gesture.originX = event.clientX;
        gesture.lastX = event.clientX;
        gesture.lastTime = event.timeStamp;
        // Grabbing a card mid-spring picks it up wherever it currently is.
        stopSpring();
        gesture.baseAngle = angleRef.current;
        gesture.homeAngle = Math.round(angleRef.current / HALF_TURN) * HALF_TURN;
        velocityRef.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }

      const elapsed = event.timeStamp - gesture.lastTime;
      if (elapsed > 0) {
        gesture.velocity = (event.clientX - gesture.lastX) / elapsed;
        gesture.lastX = event.clientX;
        gesture.lastTime = event.timeStamp;
      }
      swipedRef.current = true;

      const dragged = ((event.clientX - gesture.originX) / gesture.width) * HALF_TURN;
      paint(
        clamp(
          gesture.baseAngle + dragged,
          gesture.homeAngle - HALF_TURN,
          gesture.homeAngle + HALF_TURN
        )
      );
    },
    [paint, stopSpring]
  );

  const endGesture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;
      if (!gesture.locked) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setDragging(false);

      const dx = event.clientX - gesture.originX;
      // A finger that had already come to rest before lifting isn't flicking, however fast
      // it was travelling at its last sample.
      const stale = cancelled || event.timeStamp - gesture.lastTime > STALE_VELOCITY_MS;
      const velocity = stale ? 0 : gesture.velocity;
      const direction = resolveFlipDirection({ dx, velocity, width: gesture.width, cancelled });

      restAngleRef.current = gesture.homeAngle + direction * HALF_TURN;
      // Hand the flick's momentum to the spring so the card carries through the turn
      // instead of restarting from a standstill at the resting angle.
      velocityRef.current = clamp(
        (velocity / gesture.width) * HALF_TURN * 1000,
        -MAX_LAUNCH_VELOCITY,
        MAX_LAUNCH_VELOCITY
      );
      settle();
    },
    [settle]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => endGesture(event, false),
    [endGesture]
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => endGesture(event, true),
    [endGesture]
  );

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!swipedRef.current) return;
    swipedRef.current = false;
    // The pointer-up that ended a swipe still produces a click. The swipe was the
    // user's intent, so don't also follow the card's link.
    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => stopSpring, [stopSpring]);

  return {
    /** Spread onto the element carrying `flip-card-scene`. */
    sceneProps: {
      ref: sceneRef,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
      "data-dragging": dragging,
    },
    /** True once the card has turned past edge-on, so labels change with the visible face. */
    showingBack,
    flip,
  };
}
