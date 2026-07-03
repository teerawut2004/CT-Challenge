import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize Supabase Client if credentials exist, otherwise export null gracefully
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface StudentProgress {
  id?: number;
  student_name: string;
  student_class: string;
  student_number: string;
  unlocked_levels: number[];
  completed_levels: number[];
  updated_at?: string;
}

/**
 * Upsert a student's progress in Supabase.
 * Matches on the unique combination of (student_name, student_class, student_number).
 */
export async function syncStudentProgress(progress: Omit<StudentProgress, 'id' | 'updated_at'>): Promise<StudentProgress | null> {
  if (!supabase) {
    console.warn("Supabase is not configured. Saving progress only to local storage.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('students')
      .upsert(
        {
          student_name: progress.student_name,
          student_class: progress.student_class,
          student_number: progress.student_number,
          unlocked_levels: progress.unlocked_levels,
          completed_levels: progress.completed_levels,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'student_name,student_class,student_number' }
      )
      .select()
      .single();

    if (error) {
      console.error("Error syncing progress to Supabase:", error.message);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to sync student progress:", err);
    return null;
  }
}

/**
 * Fetch a student's progress by name, class, and number.
 */
export async function fetchStudentProgress(
  name: string,
  studentClass: string,
  number: string
): Promise<StudentProgress | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_name', name)
      .eq('student_class', studentClass)
      .eq('student_number', number)
      .maybeSingle();

    if (error) {
      console.error("Error fetching progress from Supabase:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch student progress:", err);
    return null;
  }
}

/**
 * Fetch all students' progress to show in the Classroom Leaderboard.
 */
export async function fetchLeaderboard(): Promise<StudentProgress[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard from Supabase:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    return [];
  }
}
