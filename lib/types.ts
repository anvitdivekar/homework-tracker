export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ta" | "student";
}

export interface Question {
  id: string;
  chapter: number;
  title: string;
  prompt: string;
  correct_answer: string;
  explanation: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  question_id: string;
  answer: string;
  submitted_at: string;
}
