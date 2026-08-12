import Constants from "expo-constants";

/**
 * Injects the iOS/Android "Add to Home Screen" tags (apple-touch-icon,
 * manifest link, theme-color) directly into `document.head` on web.
 *
 * Expo Router's static-export `+html.tsx` is the "proper" way to do this,
 * but it left the app stuck on a blank screen (a hydration issue with no
 * console error) — this DOM-side-effect approach is a few lines and doesn't
 * touch how the page renders at all.
 */
export function injectPwaHeadTags(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[rel="apple-touch-icon"]')) return; // already injected

  const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? "";

  const appleTouchIcon = document.createElement("link");
  appleTouchIcon.rel = "apple-touch-icon";
  appleTouchIcon.href = `${base}/icon-192.png`;
  document.head.appendChild(appleTouchIcon);

  const manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = `${base}/manifest.json`;
  document.head.appendChild(manifestLink);

  const themeColor = document.createElement("meta");
  themeColor.name = "theme-color";
  themeColor.content = "#5B8DEF";
  document.head.appendChild(themeColor);

  const appleCapable = document.createElement("meta");
  appleCapable.name = "apple-mobile-web-app-capable";
  appleCapable.content = "yes";
  document.head.appendChild(appleCapable);

  const appleTitle = document.createElement("meta");
  appleTitle.name = "apple-mobile-web-app-title";
  appleTitle.content = "DayGridK&N";
  document.head.appendChild(appleTitle);
}
