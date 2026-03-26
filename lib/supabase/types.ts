export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanType = "free" | "pro" | "team";
export type CourseStatus = "generating" | "active" | "completed" | "paused";
export type LevelType = "beginner" | "intermediate" | "advanced";
export type LearningStyle = "theory" | "practical" | "balanced";
export type QuizType = "lesson" | "module" | "final";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: PlanType;
          courses_generated_this_month: number;
          total_xp: number;
          current_streak: number;
          last_active_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: PlanType;
          courses_generated_this_month?: number;
          total_xp?: number;
          current_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: PlanType;
          courses_generated_this_month?: number;
          total_xp?: number;
          current_streak?: number;
          last_active_date?: string | null;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          domain: string;
          detected_level: LevelType;
          duration_weeks: number;
          minutes_per_day: number;
          learning_style: LearningStyle;
          status: CourseStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          domain: string;
          detected_level?: LevelType;
          duration_weeks: number;
          minutes_per_day: number;
          learning_style?: LearningStyle;
          status?: CourseStatus;
          created_at?: string;
        };
        Update: {
          title?: string;
          detected_level?: LevelType;
          status?: CourseStatus;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          file_name: string;
          storage_path: string;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          file_name: string;
          storage_path: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: {
          extracted_text?: string | null;
          course_id?: string | null;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          order_index: number;
          duration_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description: string;
          order_index: number;
          duration_days: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          content_markdown: string;
          content_json: Json | null;
          resources_json: Json;
          order_index: number;
          xp_reward: number;
          estimated_minutes: number;
          difficulty: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          content_markdown: string;
          content_json?: Json | null;
          resources_json?: Json;
          order_index: number;
          xp_reward?: number;
          estimated_minutes?: number;
          difficulty?: string;
          created_at?: string;
        };
        Update: {
          content_markdown?: string;
          content_json?: Json | null;
          resources_json?: Json;
          estimated_minutes?: number;
          difficulty?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string | null;
          module_id: string | null;
          course_id: string | null;
          type: QuizType;
          is_boss_battle: boolean;
          xp_reward: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id?: string | null;
          module_id?: string | null;
          course_id?: string | null;
          type: QuizType;
          is_boss_battle?: boolean;
          xp_reward?: number;
          created_at?: string;
        };
        Update: {
          xp_reward?: number;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options_json: Json;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options_json: Json;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Update: {
          question?: string;
          explanation?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          answers_json: Json;
          passed: boolean;
          xp_awarded: number;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          answers_json: Json;
          passed: boolean;
          xp_awarded?: number;
          attempted_at?: string;
        };
        Update: {
          score?: number;
          passed?: boolean;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan: PlanType;
          status: string;
          current_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan: PlanType;
          status: string;
          current_period_end: string;
          created_at?: string;
        };
        Update: {
          plan?: PlanType;
          status?: string;
          current_period_end?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
