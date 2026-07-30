export interface DocumentItem {
  id?: string;
  file_name: string;
  file_type: 'pdf' | 'url' | 'github' | 'overview';
  status: 'processing' | 'indexed' | 'failed';
  chunk_count: number;
  content_preview?: string;
}

export interface Project {
  id: string;
  title: string;
  created_at: string;
  document_count: number;
  status: string;
  documents?: DocumentItem[];
  reports?: ReportItem[];
}

export interface RagasScore {
  faithfulness: number;
  answer_relevance: number;
  context_precision: number;
  context_recall: number;
  overall_ragas_score: number;
}

export interface TraceEvent {
  step: 'Researcher' | 'Writer' | 'Reviewer' | 'Evaluation' | 'Finish';
  agent: string;
  status: 'active' | 'completed' | 'revision_requested' | 'failed';
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

export interface ReportItem {
  id: string;
  project_id: string;
  query: string;
  content: string;
  ragas_score?: RagasScore;
  execution_trace?: TraceEvent[];
  created_at: string;
}
