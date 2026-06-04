import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://wecare-backend-anxl.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 90000,
});

// ── Request interceptor ────────────────────────────────────────────────────────
// Reads "token" from AsyncStorage on every request.
// AuthContext always writes the active account's token to this key,
// so switching accounts is automatically reflected here — no extra wiring.
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("TOKEN FOUND:", token ? "YES" : "NO TOKEN");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.log("Token error:", e.message);
  }
  return config;
});

// ── Response interceptor ───────────────────────────────────────────────────────
// Preserves your original 401 handling.
// Only removes the token if the server explicitly says it failed —
// same behaviour as before, but now it only clears "token" (the active slot),
// leaving other saved accounts in "hush_accounts" untouched.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("API ERROR:", error.response?.status, error.response?.data);

    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Not authorized, token failed"
    ) {
      // Only clear the active token — other saved accounts are unaffected.
      // AuthContext.switchAccount will detect the stale token on next switch
      // and remove that account entry from "hush_accounts" automatically.
      await AsyncStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default api;