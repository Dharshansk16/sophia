import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token might be expired, try to refresh
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/client/refresh`,
            { refreshToken }
          );
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem(
            "accessTokenExpires",
            data.accessTokenExpires.toString()
          );

          // Retry the original request
          const originalConfig = error.config;
          originalConfig.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(originalConfig);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = "/auth/login";
        }
      } else {
        // No refresh token, redirect to login
        localStorage.clear();
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
  field?: string;
  era?: string;
  avatar?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Upload {
  id: string;
  filename: string;
  url: string;
  uploadedById: string;
  personaId?: string | null;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  personaId?: string | null;
  type: "SINGLE" | "DEBATE";
  title?: string | null;
  messages?: Message[];
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  authorUserId?: string | null;
  authorPersonaId?: string | null;
  authorUser?: User | null;
  createdAt?: string;
}

export interface Debate {
  id: string;
  topic: string;
  createdById: string;
  conversationId: string;
  participants: DebateParticipant[];
  createdAt?: string;
}

export interface DebateParticipant {
  id: string;
  debateId: string;
  personaId: string;
  role: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/client/login", {
      email,
      password,
    });
    return data;
  },

  signUp: async (email: string, password: string, name?: string) => {
    const { data } = await api.post("/api/auth/signUp", {
      email,
      password,
      name,
    });
    return data;
  },

  signOut: async () => {
    await api.post("/api/auth/client/signOut", { refreshToken: localStorage.getItem("refreshToken") }); 
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post("/api/auth/client/refresh", {
      refreshToken,
    });
    return data;
  },
};

// Personas API
export const personasAPI = {
  list: async (): Promise<Persona[]> => {
    const { data } = await api.get("/api/personas");
    return data;
  },

  create: async (
    persona: Omit<Persona, "id" | "createdAt" | "updatedAt">
  ): Promise<Persona> => {
    const { data } = await api.post("/api/personas", persona);
    return data;
  },

  get: async (id: string): Promise<Persona> => {
    const { data } = await api.get(`/api/personas/${id}`);
    return data;
  },

  update: async (id: string, persona: Partial<Persona>): Promise<Persona> => {
    const { data } = await api.patch(`/api/personas/${id}`, persona);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/personas/${id}`);
  },

  assignTag: async (personaId: string, tagId: string): Promise<void> => {
    await api.post(`/api/personas/${personaId}/tags/${tagId}`);
  },

  removeTag: async (personaId: string, tagId: string): Promise<void> => {
    await api.delete(`/api/personas/${personaId}/tags/${tagId}`);
  },
};

// Tags API
export const tagsAPI = {
  list: async (): Promise<Tag[]> => {
    const { data } = await api.get("/api/tags");
    return data;
  },

  create: async (name: string): Promise<Tag> => {
    const { data } = await api.post("/api/tags", { name });
    return data;
  },
};

// Uploads API
export const uploadsAPI = {
  list: async (personaId?: string): Promise<Upload[]> => {
    const params = personaId ? { personaId } : {};
    const { data } = await api.get("/api/uploads", { params });
    return data;
  },

  upload: async (
    file: File,
    userId: string,
    personaId?: string
  ): Promise<Upload> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    if (personaId) {
      formData.append("personaId", personaId);
    }

    const { data } = await api.post("/api/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  get: async (id: string): Promise<Upload> => {
    const { data } = await api.get(`/api/uploads/${id}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/uploads/${id}`);
  },
};

// Conversations API
export const conversationsAPI = {
  create: async (
    userId: string,
    personaId?: string,
    type: "SINGLE" | "DEBATE" = "SINGLE",
    title?: string
  ): Promise<Conversation> => {
    const { data } = await api.post("/api/conversations", {
      userId,
      personaId,
      type,
      title,
    });
    return data;
  },

  get: async (id: string): Promise<Conversation> => {
    const { data } = await api.get(`/api/conversations/${id}`);
    return data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    authorUserId?: string
  ) => {
    const { data } = await api.post(
      `/api/conversations/${conversationId}/messages`,
      {
        content,
        authorUserId,
      }
    );
    return data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data } = await api.get(
      `/api/conversations/${conversationId}`
    );
    return data;
  },

  getAll: async (userId: string): Promise<Conversation[]> => {
    const { data } = await api.get(`/api/conversations?userId=${userId}`);
    return data;
  },

  setMessages: async (id: string): Promise<void> => {
    const { data } = await api.get(`/api/conversations/${id}`);
    return data;
  }
};

export const debatesAPI = {
  create: async (
    topic: string,
    participantIds: string[],
    userId: string
  ): Promise<Debate> => {
    const { data } = await api.post("/api/debates", {
      topic,
      participantIds,
      userId,
      type: "DEBATE",
    });
    return data;
  },

  get: async (id: string): Promise<Debate> => {
    const { data } = await api.get(`/api/debates/${id}`);
    return data;
  },

  sendMessage: async (debateId: string, initialMessage?: string) => {
    const payload: any = {};
    if (initialMessage !== undefined) payload.initialMessage = initialMessage;
    const { data } = await api.post(
      `/api/debates/${debateId}/messages`,
      payload
    );
    return data; // expected shape: { message }
  },

  getMessages: async (debateId: string): Promise<Message[]> => {
    const { data } = await api.get(`/api/debates/${debateId}/messages`);
    return data;
  },
};
export default api;
