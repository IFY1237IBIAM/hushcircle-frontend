import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  createPost: "draft_createPost",
  repost: (postId) => `draft_repost:${postId}`,
  comment: (postId) => `draft_comment:${postId}`,
};

export const useDrafts = () => {
  // ── Create Post Draft ─────────────────────────────────────
  const saveCreatePostDraft = async (data) => {
    try {
      await AsyncStorage.setItem(KEYS.createPost, JSON.stringify(data));
    } catch (e) {}
  };

  const getCreatePostDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.createPost);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const clearCreatePostDraft = async () => {
    try {
      await AsyncStorage.removeItem(KEYS.createPost);
    } catch (e) {}
  };

  // ── Repost Draft ──────────────────────────────────────────
  const saveRepostDraft = async (postId, data) => {
    try {
      await AsyncStorage.setItem(KEYS.repost(postId), JSON.stringify(data));
    } catch (e) {}
  };

  const getRepostDraft = async (postId) => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.repost(postId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const clearRepostDraft = async (postId) => {
    try {
      await AsyncStorage.removeItem(KEYS.repost(postId));
    } catch (e) {}
  };

  // ── Comment Draft ─────────────────────────────────────────
  const saveCommentDraft = async (postId, text) => {
    try {
      if (text?.trim()) {
        await AsyncStorage.setItem(KEYS.comment(postId), text);
      } else {
        await AsyncStorage.removeItem(KEYS.comment(postId));
      }
    } catch (e) {}
  };

  const getCommentDraft = async (postId) => {
    try {
      return (await AsyncStorage.getItem(KEYS.comment(postId))) || "";
    } catch (e) {
      return "";
    }
  };

  const clearCommentDraft = async (postId) => {
    try {
      await AsyncStorage.removeItem(KEYS.comment(postId));
    } catch (e) {}
  };

  return {
    saveCreatePostDraft,
    getCreatePostDraft,
    clearCreatePostDraft,
    saveRepostDraft,
    getRepostDraft,
    clearRepostDraft,
    saveCommentDraft,
    getCommentDraft,
    clearCommentDraft,
  };
};

export default useDrafts;