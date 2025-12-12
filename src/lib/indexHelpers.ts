// Helper functions for Index page

export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      audioContext.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.15,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    console.log("Audio play failed:", e);
  }
};

export const calculatePrice = (rubles: number) => {
  const discountPercent = ((rubles - 500) / (10000 - 500)) * 30;
  const baseEnergy = rubles;
  const bonus = Math.floor(baseEnergy * (discountPercent / 100));
  return {
    energy: baseEnergy + bonus,
    discount: Math.round(discountPercent),
  };
};

export const initializeUserId = (): number => {
  const appVersion = localStorage.getItem("app_version");
  console.log("[INIT] App version:", appVersion);
  
  if (appVersion !== "v3") {
    console.log("[INIT] Version mismatch, clearing localStorage");
    localStorage.clear();
    localStorage.setItem("app_version", "v3");
    localStorage.setItem("auxchat_user_id", "7");
    localStorage.setItem("username", "AuxChat");
    console.log("[INIT] Set default userId to 7");
    return 7;
  }

  const stored = localStorage.getItem("auxchat_user_id");
  console.log("[INIT] Stored userId from localStorage:", stored);
  
  if (stored && stored !== "null") {
    const parsed = parseInt(stored);
    console.log("[INIT] Parsed userId:", parsed);
    return parsed;
  }

  console.log("[INIT] No valid userId, setting to 7");
  localStorage.setItem("auxchat_user_id", "7");
  localStorage.setItem("username", "AuxChat");
  return 7;
};
