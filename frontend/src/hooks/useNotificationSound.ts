import { useEffect, useRef } from "react";

const SOUND_SRC = "/sounds/notification.wav?v=2";

let audioUnlocked = false;

function unlockNotificationAudio() {
  if (audioUnlocked || typeof window === "undefined") {
    return;
  }
  const audio = new Audio(SOUND_SRC);
  audio.volume = 0;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audioUnlocked = true;
    })
    .catch(() => {
      // Autoplay can stay locked until the next user gesture.
    });
}

function playNotificationSound() {
  if (typeof window === "undefined") {
    return;
  }
  const audio = new Audio(SOUND_SRC);
  audio.volume = 0.7;
  void audio.play().catch(() => {
    // Ignore autoplay rejection; the next gesture unlocks playback.
  });
}

export function useNotificationSound(
  unreadIds: Array<string | undefined>,
  enabled: boolean,
) {
  const primedRef = useRef(false);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const unreadKey = unreadIds.join("|");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const unlock = () => unlockNotificationAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      primedRef.current = false;
      previousIdsRef.current = new Set();
      return;
    }

    const nextIds = new Set(
      unreadIds.filter((id): id is string => Boolean(id)),
    );

    if (!primedRef.current) {
      primedRef.current = true;
      previousIdsRef.current = nextIds;
      return;
    }

    let hasNewUnread = false;
    for (const id of nextIds) {
      if (!previousIdsRef.current.has(id)) {
        hasNewUnread = true;
        break;
      }
    }

    previousIdsRef.current = nextIds;

    if (hasNewUnread) {
      playNotificationSound();
    }
  }, [enabled, unreadKey, unreadIds]);
}
