export type UserRole = "client" | "operator" | "admin";

export type RequestStatus =
  | "submitted"
  | "in_progress"
  | "delivered"
  | "accepted"
  | "rejected";

export type EpisodeQuality = "good" | "usable" | "bad";

export interface SessionUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface RequestStatusHistory {
  id: number;
  from_status: RequestStatus | "";
  to_status: RequestStatus;
  changed_by: number;
  changed_by_email: string;
  changed_at: string;
}

export interface RequestAssignment {
  id: number;
  episode: number;
  episode_code: string;
  episode_quality: EpisodeQuality;
  assigned_by: number;
  assigned_at: string;
}

export interface DatasetRequest {
  id: number;
  client: number;
  client_email: string;
  client_name: string;
  task_name: string;
  episodes_requested: number;
  deadline: string;
  notes: string;
  status: RequestStatus;
  assignments: RequestAssignment[];
  status_history: RequestStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  episode_id: string;
  robot_id: string;
  task_name: string;
  recorded_at: string;
  duration_seconds: number;
  operator_name: string;
  quality: EpisodeQuality;
  assigned: boolean;
}
