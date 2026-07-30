from typing import Dict, Any, List
from app.services.hybrid_search import HybridSearchEngine

class ResearcherAgent:
    def __init__(self, search_engine: HybridSearchEngine):
        self.search_engine = search_engine

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform hybrid search & synthesize initial research findings."""
        if not self.search_engine.documents and chunks:
            self.search_engine.index_chunks(chunks)
            
        retrieved_chunks = self.search_engine.hybrid_search_rrf(query, top_k=5)
        
        # Build research synthesis summary
        citations = []
        notes = [f"### Research Findings for Query: '{query}'\n"]
        
        for idx, chunk in enumerate(retrieved_chunks, start=1):
            source = chunk.get("source", "Unknown Source")
            section = chunk.get("section", "General")
            score = chunk.get("rrf_score", 0.0)
            text = chunk.get("text", "")
            
            citations.append({"id": idx, "source": source, "section": section, "score": score})
            notes.append(f"#### Finding {idx} [{source} | {section}] (RRF Score: {score}):")
            notes.append(f"> {text}\n")
            
        research_summary = "\n".join(notes)
        
        return {
            "research_notes": research_summary,
            "retrieved_chunks": retrieved_chunks,
            "citations": citations,
            "status": "research_completed"
        }
