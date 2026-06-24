export interface CaseRecord {
  id: number;
  students: string;
  date: string;
  date_filed: string;
  case: string;
  description: string;
  sanction: string;
  progress: string;
  proofs: string;
}

export interface ImportRow {
  first_name: string;
  last_name: string;
  level: string;
  section: string;
  date: string;
  adviser: string;
  case: string;
  sanction: string;
  progress: string;
  is_duplicate: boolean;
  existing_case: CaseRecord | null;
  has_errors: boolean;
  errors: string[];
}

export interface ImportRowInput {
  first_name: string;
  last_name: string;
  level: string;
  section: string;
  date: string;
  adviser: string;
  case: string;
  sanction: string;
  progress: string;
}

export interface ParseFileResult {
  rows: ImportRow[];
  valid_count: number;
  duplicate_count: number;
  error_count: number;
}
