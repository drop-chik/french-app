export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    level: import('./user.js').LanguageLevel;
    placementTestDone: boolean;
    role: import('./user.js').UserRole;
    tag: string;
  };
}
