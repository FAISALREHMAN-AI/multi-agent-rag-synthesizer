import math
import re
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from app.core.config import settings

class HybridSearchEngine:
    def __init__(self, rrf_k: float = settings.RRF_K):
        self.rrf_k = rrf_k
        self.documents: List[Dict[str, Any]] = []
        self.bm25_model: BM25Okapi = None
        self.corpus_tokenized: List[List[str]] = []

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into lowercase alphanumeric tokens."""
        return re.findall(r'\w+', text.lower())

    def index_chunks(self, chunks: List[Dict[str, Any]]):
        """Index chunks into the Hybrid Search engine (Dense + Sparse BM25)."""
        self.documents = chunks
        self.corpus_tokenized = [self._tokenize(chunk["text"]) for chunk in chunks]
        if self.corpus_tokenized:
            self.bm25_model = BM25Okapi(self.corpus_tokenized)

    def _compute_dense_similarity(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        """
        Compute lightweight semantic dense similarity score between query and doc
        using term frequency vector overlap & jaccard-cosine hybrid.
        """
        if not query_tokens or not doc_tokens:
            return 0.0
            
        q_set = set(query_tokens)
        d_set = set(doc_tokens)
        
        intersection = q_set.intersection(d_set)
        if not intersection:
            return 0.0
            
        # Cosine similarity on token frequency vectors
        q_freq = {t: query_tokens.count(t) for t in q_set}
        d_freq = {t: doc_tokens.count(t) for t in d_set}
        
        dot_product = sum(q_freq[t] * d_freq.get(t, 0) for t in q_set)
        mag_q = math.sqrt(sum(v ** 2 for v in q_freq.values()))
        mag_d = math.sqrt(sum(v ** 2 for v in d_freq.values()))
        
        cosine_sim = dot_product / (mag_q * mag_d) if (mag_q * mag_d) > 0 else 0.0
        return cosine_sim

    def dense_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Retrieve top_k documents using dense vector similarity."""
        query_tokens = self._tokenize(query)
        scores = []
        
        for idx, doc_tokens in enumerate(self.corpus_tokenized):
            score = self._compute_dense_similarity(query_tokens, doc_tokens)
            scores.append((idx, score))
            
        # Sort descending
        scores.sort(key=lambda x: x[1], reverse=True)
        return [{"doc_idx": idx, "score": score} for idx, score in scores[:top_k]]

    def sparse_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Retrieve top_k documents using BM25 sparse keyword ranking."""
        if not self.bm25_model:
            return []
            
        query_tokens = self._tokenize(query)
        doc_scores = self.bm25_model.get_scores(query_tokens)
        
        indexed_scores = [(idx, float(score)) for idx, score in enumerate(doc_scores)]
        indexed_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [{"doc_idx": idx, "score": score} for idx, score in indexed_scores[:top_k]]

    def hybrid_search_rrf(self, query: str, top_k: int = settings.TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """
        Reciprocal Rank Fusion (RRF) algorithm:
        RRF_Score(doc) = 1/(k + Rank_dense) + 1/(k + Rank_sparse)
        """
        if not self.documents:
            return []

        # Retrieve top 20 candidates from both sparse and dense
        search_k = min(len(self.documents), max(top_k * 3, 10))
        dense_results = self.dense_search(query, top_k=search_k)
        sparse_results = self.sparse_search(query, top_k=search_k)

        rrf_scores: Dict[int, float] = {}

        # Process Dense Ranks
        for rank, res in enumerate(dense_results, start=1):
            doc_idx = res["doc_idx"]
            rrf_scores[doc_idx] = rrf_scores.get(doc_idx, 0.0) + (1.0 / (self.rrf_k + rank))

        # Process Sparse BM25 Ranks
        for rank, res in enumerate(sparse_results, start=1):
            doc_idx = res["doc_idx"]
            rrf_scores[doc_idx] = rrf_scores.get(doc_idx, 0.0) + (1.0 / (self.rrf_k + rank))

        # Sort combined documents by RRF score descending
        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        final_results = []
        for doc_idx, rrf_score in sorted_docs[:top_k]:
            chunk_data = self.documents[doc_idx].copy()
            chunk_data["rrf_score"] = round(rrf_score, 6)
            final_results.append(chunk_data)

        return final_results
