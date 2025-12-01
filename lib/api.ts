const API_BASE_URL = "http://10.142.213.163:8080";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw {
        message: error.message || "Request failed",
        status: response.status,
      } as ApiError;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    console.log("🔐 Attempting login...");
    const response = await this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    console.log("✅ Login successful");
    return response;
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<LoginResponse> {
    console.log("📝 Attempting registration...");
    const response = await this.request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    console.log("✅ Registration successful");
    return response;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    console.log("🔄 Refreshing token...");
    const response = await this.request<LoginResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    console.log("✅ Token refreshed");
    return response;
  }

  async logout(accessToken: string): Promise<void> {
    console.log("🚪 Logging out...");
    await this.request<void>("/api/auth/logout", {
      method: "POST",
      token: accessToken,
    });
    console.log("✅ Logout successful");
  }

  async verifyToken(accessToken: string): Promise<User> {
    console.log("🔍 Verifying token...");
    const response = await this.request<User>("/api/auth/me", {
      method: "GET",
      token: accessToken,
    });
    console.log("✅ Token verified");
    return response;
  }

  // Dashboard API endpoints
  async getAlerts(accessToken: string, resourceId?: string) {
    console.log("📢 Fetching alerts...");
    let endpoint = "/api/alerts";
    if (resourceId) {
      endpoint += `?resourceId=${resourceId}`;
    }
    return this.request("/api/alerts", {
      method: "GET",
      token: accessToken,
    });
  }

  async getNetworkData(accessToken: string) {
    console.log("🌐 Fetching network data...");
    return this.request("/api/network", {
      method: "GET",
      token: accessToken,
    });
  }

  async getMetrics(accessToken: string) {
    console.log("📊 Fetching metrics...");
    return this.request("/api/metrics", {
      method: "GET",
      token: accessToken,
    });
  }

  async getLogs(accessToken: string) {
    console.log("📝 Fetching logs...");
    return this.request("/api/logs", {
      method: "GET",
      token: accessToken,
    });
  }

  async getResources(accessToken: string) {
    console.log("📦 Fetching resources...");
    return this.request("/api/resources", {
      method: "GET",
      token: accessToken,
    });
  }

  async getSettings(accessToken: string) {
    console.log("⚙️ Fetching settings...");
    return this.request("/api/settings", {
      method: "GET",
      token: accessToken,
    });
  }

  async updateSettings(accessToken: string, settings: Record<string, any>) {
    console.log("⚙️ Updating settings...");
    return this.request("/api/settings", {
      method: "PUT",
      token: accessToken,
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
