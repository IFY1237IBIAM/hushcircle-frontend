import { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import translations from "../i18n/translations";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",    nativeLabel: "English",    flag: "🇬🇧" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português",  flag: "🇧🇷" },
  { code: "fr", label: "French",     nativeLabel: "Français",   flag: "🇫🇷" },
  { code: "es", label: "Spanish",    nativeLabel: "Español",    flag: "🇪🇸" },
];

// Languages we have full UI translations for
const FULLY_SUPPORTED = new Set(["en", "pt", "fr", "es"]);

const LANG_KEY = "hushcircle_language";
const UI_TRANSLATION_CACHE_KEY = "hushcircle_ui_translation_cache";

const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales?.() || [];
    const code = locales[0]?.languageCode?.toLowerCase() || "en";
    return code.split("-")[0];
  } catch {
    return "en";
  }
};

const LanguageContext = createContext({
  language: "en",
  t: (key) => key,
  setLanguage: () => {},
  SUPPORTED_LANGUAGES,
  isFullySupported: true,
  uiTranslating: false,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("en");
  const [loaded, setLoaded] = useState(false);
  // Cache of dynamically translated UI strings for unsupported languages
  const [uiTranslationCache, setUiTranslationCache] = useState({});
  const [uiTranslating, setUiTranslating] = useState(false);

  const isFullySupported = FULLY_SUPPORTED.has(language);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_KEY);
        const code = stored || getDeviceLanguage();
        setLanguageState(code);

        // Load any cached UI translations for unsupported language
        if (code && !FULLY_SUPPORTED.has(code)) {
          const cached = await AsyncStorage.getItem(`${UI_TRANSLATION_CACHE_KEY}_${code}`);
          if (cached) setUiTranslationCache(JSON.parse(cached));
        }
      } catch {
        setLanguageState("en");
      } finally {
        setLoaded(true);
      }
    };
    init();
  }, []);

  // When switching to an unsupported language, batch-translate all English UI strings
  const fetchUiTranslations = useCallback(async (targetLang) => {
    if (FULLY_SUPPORTED.has(targetLang)) return;

    setUiTranslating(true);
    const enStrings = translations.en;
    const keys = Object.keys(enStrings);
    const translated = {};

    try {
      // Batch into chunks of 10 to avoid URL length limits
      const CHUNK = 10;
      for (let i = 0; i < keys.length; i += CHUNK) {
        const chunk = keys.slice(i, i + CHUNK);
        await Promise.all(
          chunk.map(async (key) => {
            try {
              const text = enStrings[key];
              // Skip emoji-only strings and very short strings
              if (!text || text.length < 3 || /^[^\w\s]+$/.test(text)) {
                translated[key] = text;
                return;
              }
              const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
              const res = await fetch(url);
              const data = await res.json();
              if (data.responseStatus === 200 && data.responseData?.translatedText) {
                translated[key] = data.responseData.translatedText;
              } else {
                translated[key] = text; // fallback to English
              }
            } catch {
              translated[key] = enStrings[key];
            }
          })
        );
      }

      setUiTranslationCache(translated);
      await AsyncStorage.setItem(
        `${UI_TRANSLATION_CACHE_KEY}_${targetLang}`,
        JSON.stringify(translated)
      );
    } catch (e) {
      console.log("UI translation batch error:", e.message);
    } finally {
      setUiTranslating(false);
    }
  }, []);

  const setLanguage = useCallback(async (code) => {
    setLanguageState(code);
    await AsyncStorage.setItem(LANG_KEY, code);

    if (!FULLY_SUPPORTED.has(code)) {
      // Check if we already have a cache for this language
      const cached = await AsyncStorage.getItem(`${UI_TRANSLATION_CACHE_KEY}_${code}`);
      if (cached) {
        setUiTranslationCache(JSON.parse(cached));
      } else {
        // Fetch translations for this new language
        await fetchUiTranslations(code);
      }
    } else {
      // Clear unsupported cache when switching to a supported language
      setUiTranslationCache({});
    }
  }, [fetchUiTranslations]);

  // Translation function
  const t = useCallback((key, params = {}) => {
    let str;

    if (FULLY_SUPPORTED.has(language)) {
      // Use bundled translation
      const lang = translations[language] || translations.en;
      str = lang[key] ?? translations.en[key] ?? key;
    } else {
      // Use dynamically fetched translation, fall back to English
      str = uiTranslationCache[key] ?? translations.en[key] ?? key;
    }

    // Replace {param} placeholders
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{${k}}`, "g"), String(v));
    });

    return str;
  }, [language, uiTranslationCache]);

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{
      language,
      t,
      setLanguage,
      SUPPORTED_LANGUAGES,
      isFullySupported,
      uiTranslating,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);