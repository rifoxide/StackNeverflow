// Entity types

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  dislikesCount: number;
  commentCount: number;
  rankScore: number;
  author: {
    id: string;
    name: string;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  author: {
    id: string;
    name: string;
  };
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
}

export interface Experience {
  id: string;
  userId: string;
  title: string;
  company: string;
  fromDate: string;
  toDate: string | null;
  description: string;
}

export interface Developer {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  createdAt: string;
  skills: Skill[];
  experiences: Experience[];
}

export type ReactionType = 'like' | 'dislike';
export type TargetType = 'post' | 'comment';

export interface Reaction {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
  createdAt: string;
}

// API response types

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth DTOs

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

// Post DTOs

export interface CreatePostDto {
  title: string;
  body: string;
}

// Comment DTOs

export interface CreateCommentDto {
  body: string;
  parentCommentId?: string;
}

// Reaction DTOs

export interface CreateReactionDto {
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}

// Profile DTOs

export interface UpdateSkillsDto {
  skills: string[];
}

export interface UpdateExperiencesDto {
  experiences: Omit<Experience, 'id' | 'userId'>[];
}
