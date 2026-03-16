import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("clearclaim_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — redirect to /login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem("clearclaim_token");
      localStorage.removeItem("clearclaim_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ── Types ──────────────────────────────────────────────────────── */

export interface User {
  id: string;
  email: string;
  full_name: string;
  practice_name: string;
  practice_type?: string;
  physician_count?: string;
  primary_specialty?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  practice_id: string;
  full_name: string;
  dob: string;
  member_id: string;
  insurance_payer: string;
  insurance_plan?: string;
  created_at: string;
}

export interface Task {
  id: string;
  practice_id: string;
  patient_id: string;
  patient_name?: string;
  task_type: string;
  status: string;
  payer: string;
  procedure_code?: string;
  diagnosis_code?: string;
  result?: Record<string, unknown>;
  auth_number?: string;
  failure_reason?: string;
  agent_trace?: { step: string; timestamp: string; data: Record<string, unknown> }[];
  tinyfish_run_id?: string;
  streaming_url?: string;
  progress_steps?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  requires_human: number;
  avg_completion_seconds?: number;
  time_saved_minutes?: number;
  success_rate?: number;
  tasks_today?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/* ── Auth ────────────────────────────────────────────────────────── */

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/auth/login", { email, password });
  return data;
}

export async function register(body: {
  email: string;
  password: string;
  full_name: string;
  practice_name: string;
  practice_type?: string;
  physician_count?: string;
  primary_specialty?: string;
  phone?: string;
  role?: string;
}): Promise<User> {
  const { data } = await apiClient.post<User>("/api/auth/register", body);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/auth/me");
  return data;
}

/* ── Patients ────────────────────────────────────────────────────── */

export async function getPatients(): Promise<Patient[]> {
  const { data } = await apiClient.get<Patient[]>("/api/patients/");
  return data;
}

export async function createPatient(body: {
  full_name: string;
  dob: string;
  member_id: string;
  insurance_payer: string;
  insurance_plan?: string;
}): Promise<Patient> {
  const { data } = await apiClient.post<Patient>("/api/patients/", body);
  return data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await apiClient.get<Patient>(`/api/patients/${id}`);
  return data;
}

/* ── Tasks ───────────────────────────────────────────────────────── */

export interface TaskFilters {
  status?: string;
  task_type?: string;
  payer?: string;
  limit?: number;
  skip?: number;
  sort_by?: string;
  sort_order?: string;
}

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.limit)      params.set("limit",      String(filters.limit));
  if (filters?.skip)       params.set("skip",       String(filters.skip));
  if (filters?.sort_by)    params.set("sort_by",    filters.sort_by);
  if (filters?.sort_order) params.set("sort_order", filters.sort_order);
  const qs = params.toString();
  const { data } = await apiClient.get<Task[]>(`/api/tasks/${qs ? `?${qs}` : ""}`);
  return data;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const { data } = await apiClient.get("/health");
    return data?.status === "ok";
  } catch {
    return false;
  }
}

export async function createTask(body: {
  patient_id: string;
  task_type: string;
  payer: string;
  procedure_code?: string;
  diagnosis_code?: string;
}): Promise<Task> {
  const { data } = await apiClient.post<Task>("/api/tasks/", body);
  return data;
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await apiClient.get<Task>(`/api/tasks/${id}`);
  return data;
}

export async function getTaskResult(id: string): Promise<Task> {
  const { data } = await apiClient.get<Task>(`/api/tasks/${id}/result`);
  return data;
}

export async function getStats(): Promise<TaskStats> {
  const { data } = await apiClient.get<TaskStats>("/api/tasks/stats");
  return data;
}

