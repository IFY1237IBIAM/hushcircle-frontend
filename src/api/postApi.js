import api from "./api";

export const repostPost = (postId, thought = "") =>
  api.post(`/posts/${postId}/repost`, { thought });

export const deleteRepost = (postId) =>
  api.delete(`/posts/${postId}/repost`);

export const getReposts = (postId) =>
  api.get(`/posts/${postId}/reposts`);