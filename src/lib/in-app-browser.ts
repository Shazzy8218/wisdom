// Detects in-app browsers (Snapchat, Instagram, TikTok, Facebook, LinkedIn, etc.)
// Google OAuth blocks these with "Error 403: disallowed_useragent".
// Users must open the app in their real browser (Safari/Chrome) to sign in with Google.

export function detectInAppBrowser(): { isInApp: boolean; appName: string | null } {
  if (typeof navigator === "undefined") return { isInApp: false, appName: null };
  const ua = navigator.userAgent || "";

  const checks: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /Snapchat/i, name: "Snapchat" },
    { pattern: /Instagram/i, name: "Instagram" },
    { pattern: /(FBAN|FBAV|FB_IAB|FBIOS)/i, name: "Facebook" },
    { pattern: /Messenger/i, name: "Messenger" },
    { pattern: /TikTok|musical_ly|BytedanceWebview/i, name: "TikTok" },
    { pattern: /LinkedInApp/i, name: "LinkedIn" },
    { pattern: /Twitter/i, name: "Twitter / X" },
    { pattern: /Line\//i, name: "Line" },
    { pattern: /KAKAOTALK/i, name: "KakaoTalk" },
    { pattern: /MicroMessenger/i, name: "WeChat" },
    { pattern: /Pinterest/i, name: "Pinterest" },
  ];

  for (const c of checks) {
    if (c.pattern.test(ua)) return { isInApp: true, appName: c.name };
  }

  // Generic iOS WebView heuristic: iOS Safari UA contains "Safari" — WebViews don't.
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS && !/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) {
    return { isInApp: true, appName: "in-app browser" };
  }

  return { isInApp: false, appName: null };
}
