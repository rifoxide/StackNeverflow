import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  User,
  Post,
  Comment,
  Developer,
  PaginatedResponse,
  RegisterDto,
  LoginDto,
  LoginResponse,
  CreatePostDto,
  CreateCommentDto,
  CreateReactionDto,
  ReactionType,
  TargetType,
  UpdateSkillsDto,
  UpdateExperiencesDto,
  Skill,
  Experience,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap envelope and handle 401 with token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => {
    // Unwrap the envelope: { success: true, data: ... } -> data
    if (response.data && response.data.success && 'data' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying, attempt token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token (cookie-based)
        const response = await axios.post<ApiResponse<LoginResponse>>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.data.accessToken;

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newToken);
        }

        isRefreshing = false;
        onRefreshed(newToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (dto: RegisterDto) =>
    api.post<User>('/auth/register', dto).then((res) => res.data),

  login: (dto: LoginDto) =>
    api.post<LoginResponse>('/auth/login', dto).then((res) => {
      // Store access token in localStorage
      if (typeof window !== 'undefined' && res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      return res.data;
    }),

  logout: () =>
    api.post('/auth/logout').then(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }),

  me: () => api.get<User>('/auth/me').then((res) => res.data),

  refresh: () =>
    api.post<LoginResponse>('/auth/refresh').then((res) => {
      if (typeof window !== 'undefined' && res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      return res.data;
    }),
};

// Posts API
export const postsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api
      .get<PaginatedResponse<Post>>('/posts', { params })
      .then((res) => res.data),

  getById: (id: string) => api.get<Post>(`/posts/${id}`).then((res) => res.data),

  create: (dto: CreatePostDto) =>
    api.post<Post>('/posts', dto).then((res) => res.data),
};

// Comments API
export const commentsApi = {
  getByPost: (postId: string) =>
    api.get<Comment[]>(`/posts/${postId}/comments`).then((res) => res.data),

  create: (postId: string, dto: CreateCommentDto) =>
    api.post<Comment>(`/posts/${postId}/comments`, dto).then((res) => res.data),
};

// Reactions API
export const reactionsApi = {
  toggle: (dto: CreateReactionDto) =>
    api.post('/reactions', dto).then((res) => res.data),

  getMine: (targetType: TargetType, targetId: string) =>
    api
      .get<ReactionType | null>('/reactions/me', {
        params: { targetType, targetId },
      })
      .then((res) => res.data),

  getMineBatch: (targetType: TargetType, targetIds: string[]) =>
    api
      .get<Record<string, ReactionType | null>>('/reactions/me/batch', {
        params: { targetType, targetIds: targetIds.join(',') },
      })
      .then((res) => res.data),
};

// Developers API
export const developersApi = {
  getById: (id: string) =>
    api.get<Developer>(`/developers/${id}`).then((res) => res.data),

  getMe: () => api.get<Developer>('/developers/me').then((res) => res.data),

  updateMySkills: (dto: UpdateSkillsDto) =>
    api.put<Skill[]>('/developers/me/skills', dto).then((res) => res.data),

  updateMyExperiences: (dto: UpdateExperiencesDto) =>
    api
      .put('/developers/me/experiences', dto)
      .then((res) => res.data),
};
