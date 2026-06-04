
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

const AuthContext = createContext();

const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

function avatarColorForPseudonym(pseudonym = "") {
  return AVATAR_COLORS[(pseudonym.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

const MAX_ACCOUNTS = 3;
const ACCOUNTS_KEY = "hush_accounts";
const ACTIVE_KEY   = "hush_active";
const API_BASE     = "https://wecare-backend-anxl.onrender.com/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [accounts, setAccounts] = useState([]);

  // ─── Storage helpers ───────────────────────────────────────────────────────

  const loadAccountsFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveAccountsToStorage = async (accs) => {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
  };

  // ─── Fetch refresh bypassing axios interceptor ─────────────────────────────
  // We use native fetch so the interceptor cannot overwrite the Authorization
  // header with the currently stored token.
  const fetchRefresh = async (tokenToUse) => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.message || "Refresh failed");
      err.status = res.status;
      throw err;
    }
    return data.user;
  };

  // ─── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const savedAccounts   = await loadAccountsFromStorage();
      const activePseudonym = await AsyncStorage.getItem(ACTIVE_KEY);

      setAccounts(savedAccounts);

      const activeAcc   = savedAccounts.find((a) => a.pseudonym === activePseudonym);
      const storedToken = activeAcc?.token || (await AsyncStorage.getItem("token"));

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      // Show cached user immediately while we refresh
      if (!activeAcc) {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
      } else {
        // Set the cached account user from accounts list
        const cachedUser = { pseudonym: activeAcc.pseudonym, email: activeAcc.email };
        setUser(cachedUser);
      }

      // Refresh from server using the correct token
      try {
        const freshUser = await fetchRefresh(storedToken);
        setUser(freshUser);

        if (activeAcc) {
          const updated = savedAccounts.map((a) =>
            a.pseudonym === freshUser.pseudonym
              ? { ...a, email: freshUser.email, avatarColor: avatarColorForPseudonym(freshUser.pseudonym) }
              : a
          );
          setAccounts(updated);
          await saveAccountsToStorage(updated);
        }
        await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      } catch (refreshError) {
        if (refreshError.status === 401) {
          await clearAuth();
        }
      }
    } catch (error) {
      console.log("Auth load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Core helpers ──────────────────────────────────────────────────────────

  const clearAuth = async () => {
    await AsyncStorage.multiRemove(["token", "user", ACTIVE_KEY]);
    setToken(null);
    setUser(null);
  };

  const setAuth = async (newToken, newUser) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    const savedAccounts = await loadAccountsFromStorage();
    const exists = savedAccounts.find((a) => a.pseudonym === newUser.pseudonym);
    let updated;
    if (exists) {
      updated = savedAccounts.map((a) =>
        a.pseudonym === newUser.pseudonym
          ? { ...a, token: newToken, email: newUser.email }
          : a
      );
    } else {
      updated = [
        ...savedAccounts,
        {
          pseudonym:   newUser.pseudonym,
          email:       newUser.email,
          token:       newToken,
          avatarColor: avatarColorForPseudonym(newUser.pseudonym),
        },
      ];
    }
    await saveAccountsToStorage(updated);
    await AsyncStorage.setItem(ACTIVE_KEY, newUser.pseudonym);
    setAccounts(updated);
  };

  // ─── Internal: activate an account (write storage THEN set state) ──────────

  const _activateAccount = async (newToken, newUser) => {
    // Write to storage first so the axios interceptor picks up the new token
    // on the very next request after state updates.
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    await AsyncStorage.setItem(ACTIVE_KEY, newUser.pseudonym);

    const savedAccounts = await loadAccountsFromStorage();
    const updated = savedAccounts.map((a) =>
      a.pseudonym === newUser.pseudonym ? { ...a, token: newToken } : a
    );
    await saveAccountsToStorage(updated);

    // Update React state — this triggers re-render across the app
    setAccounts(updated);
    setToken(newToken);
    setUser(newUser);
  };

  // ─── Signup ────────────────────────────────────────────────────────────────

  const signup = async (pseudonym, email, password) => {
    const response = await api.post("/auth/signup", { pseudonym, email, password });
    const { user: newUser } = response.data;
    await AsyncStorage.removeItem("onboarded");
    return { user: newUser, unverified: true, email };
  };

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    if (newUser.isVerified === false) {
      return { user: newUser, unverified: true };
    }

    await setAuth(newToken, newUser);
    return response.data;
  };

  // ─── Add Account ───────────────────────────────────────────────────────────

  const addAccount = async (email, password) => {
    const savedAccounts = await loadAccountsFromStorage();

    if (savedAccounts.length >= MAX_ACCOUNTS) {
      return { success: false, message: `You can save up to ${MAX_ACCOUNTS} accounts.` };
    }

    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    if (newUser.isVerified === false) {
      return { success: false, message: "This account hasn't been verified yet." };
    }

    const alreadyExists = savedAccounts.find((a) => a.pseudonym === newUser.pseudonym);
    if (alreadyExists) {
      await _activateAccount(alreadyExists.token, newUser);
      return { success: true, alreadyExisted: true };
    }

    const newEntry = {
      pseudonym:   newUser.pseudonym,
      email:       newUser.email,
      token:       newToken,
      avatarColor: avatarColorForPseudonym(newUser.pseudonym),
    };

    const updated = [...savedAccounts, newEntry];
    await saveAccountsToStorage(updated);
    setAccounts(updated);

    await _activateAccount(newToken, newUser);
    return { success: true };
  };

  // ─── Switch Account ────────────────────────────────────────────────────────

  const switchAccount = useCallback(async (pseudonym, overrideToken, overrideUser) => {
    const savedAccounts = await loadAccountsFromStorage();
    const acc = savedAccounts.find((a) => a.pseudonym === pseudonym);
    if (!acc && !overrideToken) throw new Error("Account not found");

    const tokenToUse = overrideToken || acc.token;

    try {
      // Use fetchRefresh (native fetch) so axios interceptor doesn't
      // overwrite the Authorization header with the old token
      let freshUser = overrideUser;
      if (!freshUser) {
        freshUser = await fetchRefresh(tokenToUse);
      }

      await _activateAccount(tokenToUse, freshUser);
    } catch (err) {
      if (err.status === 401 || err.response?.status === 401) {
        const cleaned = savedAccounts.filter((a) => a.pseudonym !== pseudonym);
        await saveAccountsToStorage(cleaned);
        setAccounts(cleaned);
        throw new Error("SESSION_EXPIRED");
      }
      throw err;
    }
  }, []);

  // ─── Remove Account ────────────────────────────────────────────────────────

  const removeAccount = async (pseudonym) => {
    if (user?.pseudonym === pseudonym) {
      throw new Error("Cannot remove the active account. Switch first.");
    }
    const savedAccounts = await loadAccountsFromStorage();
    const updated = savedAccounts.filter((a) => a.pseudonym !== pseudonym);
    await saveAccountsToStorage(updated);
    setAccounts(updated);
  };

  const getAllAccounts = () => accounts;

  // ─── Update user locally ───────────────────────────────────────────────────

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // ─── Clear reinstated flag ─────────────────────────────────────────────────

  const clearReinstatedStatus = async () => {
    try {
      await api.patch("/auth/clear-reinstated");
    } catch (e) {}
    updateUser({ appealStatus: "none" });
  };

  // ─── Logout (active account only) ─────────────────────────────────────────

  const logout = async () => {
    try {
      await api.put("/auth/offline");
    } catch (e) {}

    const savedAccounts   = await loadAccountsFromStorage();
    const activePseudonym = user?.pseudonym;
    const remaining       = savedAccounts.filter((a) => a.pseudonym !== activePseudonym);

    await saveAccountsToStorage(remaining);
    setAccounts(remaining);

    if (remaining.length > 0) {
      try {
        await switchAccount(remaining[0].pseudonym);
        return;
      } catch {
        // fall through to full clear
      }
    }

    await AsyncStorage.multiRemove(["token", "user", ACTIVE_KEY]);
    setToken(null);
    setUser(null);
  };

  // ─── Refresh user from backend ─────────────────────────────────────────────

  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/refresh");
      const freshUser = res.data.user;
      setUser(freshUser);
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
    } catch (e) {
      console.log("Refresh user error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Provider ──────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        login,
        logout,
        updateUser,
        clearReinstatedStatus,
        refreshUser,
        setAuth,
        accounts,
        addAccount,
        switchAccount,
        removeAccount,
        getAllAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
