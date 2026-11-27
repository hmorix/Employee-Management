import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ouigbkolkigqtwuhmkfm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ZHWdEg8BHfUGsgEqeKHmrQ_5UmY78ZQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'hr' | 'team_leader' | 'employee' | 'intern';
  department: string;
  designation: string;
  avatar_url: string;
  employee_code: string;
  employment_type: string;
  status: string;
  join_date: string;
  end_date: string | null;
  stipend_or_ctc: string;
  team_id: string | null;
  skills: string[];
  bio: string;
}

export interface Team {
  id: string;
  name: string;
  department: string;
  description: string;
  leader_id: string | null;
  color_tag: string;
  created_at: string;
}

export interface Task {
  id: string;
  task_code: string;
  title: string;
  description: string;
  team_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  estimated_hours: number;
  logged_hours: number;
  attachment_url: string;
  submission_note: string;
  submission_url: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string; employee_code: string } | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  attachment_url: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string } | null;
}

export async function uploadFile(bucket: string, folder: string, file: File) {
  const name = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(name, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(name);
  return data.publicUrl;
}
