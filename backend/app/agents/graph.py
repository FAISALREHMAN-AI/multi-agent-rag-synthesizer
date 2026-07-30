import asyncio
from typing import Dict, Any, List, TypedDict
from app.agents.researcher import ResearcherAgent
from app.agents.writer import WriterAgent
from app.agents.reviewer import ReviewerAgent
from app.services.hybrid_search import HybridSearchEngine
from app.services.stream_manager import stream_manager
from app.services.ragas_eval import RagasEvaluator

class SynthesizerState(TypedDict):
    project_id: str
    query: str
    chunks: List[Dict[str, Any]]
    research_notes: str
    retrieved_chunks: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    draft_report: str
    feedback: str
    iteration: int
    is_approved: bool
    final_report: str
    ragas_score: Dict[str, float]
    execution_trace: List[Dict[str, Any]]

class LangGraphWorkflow:
    def __init__(self):
        self.writer = WriterAgent()
        self.reviewer = ReviewerAgent(max_iterations=2)

    async def execute_workflow(self, project_id: str, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute the multi-agent RAG workflow with SSE streaming updates."""
        
        search_engine = HybridSearchEngine()
        researcher = ResearcherAgent(search_engine)

        execution_trace = []
        
        # Initial State Setup
        state: SynthesizerState = {
            "project_id": project_id,
            "query": query,
            "chunks": chunks,
            "research_notes": "",
            "retrieved_chunks": [],
            "citations": [],
            "draft_report": "",
            "feedback": "",
            "iteration": 1,
            "is_approved": False,
            "final_report": "",
            "ragas_score": {},
            "execution_trace": execution_trace
        }

        # ---------------- STEP 1: RESEARCHER AGENT ----------------
        trace_step1 = {
            "step": "Researcher",
            "agent": "Researcher Agent",
            "status": "active",
            "message": f"Executing Hybrid Search (Dense + BM25 RRF) for query: '{query}'..."
        }
        execution_trace.append(trace_step1)
        await stream_manager.broadcast(project_id, "step_update", trace_step1)
        await asyncio.sleep(0.8) # Smooth visual feedback delay

        research_res = await researcher.run(query, chunks)
        state["research_notes"] = research_res["research_notes"]
        state["retrieved_chunks"] = research_res["retrieved_chunks"]
        state["citations"] = research_res["citations"]

        trace_step1_done = {
            "step": "Researcher",
            "agent": "Researcher Agent",
            "status": "completed",
            "message": f"Retrieved {len(state['retrieved_chunks'])} top RRF chunks & synthesized findings.",
            "details": {"citations_count": len(state["citations"])}
        }
        execution_trace.append(trace_step1_done)
        await stream_manager.broadcast(project_id, "step_update", trace_step1_done)
        await asyncio.sleep(0.5)

        # ---------------- STEP 2 & 3: WRITER & REVIEWER ITERATIVE LOOP ----------------
        while not state["is_approved"] and state["iteration"] <= 2:
            current_iter = state["iteration"]
            
            # Writer Node
            trace_writer = {
                "step": "Writer",
                "agent": "Writer Agent",
                "status": "active",
                "message": f"Drafting structured markdown report (Iteration {current_iter})..."
            }
            execution_trace.append(trace_writer)
            await stream_manager.broadcast(project_id, "step_update", trace_writer)
            await asyncio.sleep(1.0)

            writer_res = await self.writer.run(
                query=query, 
                research_notes=state["research_notes"],
                feedback=state["feedback"],
                iteration=current_iter
            )
            state["draft_report"] = writer_res["draft_report"]

            trace_writer_done = {
                "step": "Writer",
                "agent": "Writer Agent",
                "status": "completed",
                "message": f"Draft report created ({len(state['draft_report'])} chars)."
            }
            execution_trace.append(trace_writer_done)
            await stream_manager.broadcast(project_id, "step_update", trace_writer_done)
            await asyncio.sleep(0.5)

            # Reviewer Node
            trace_reviewer = {
                "step": "Reviewer",
                "agent": "Reviewer Agent",
                "status": "active",
                "message": f"Auditing draft report for hallucinations, tone, and factual precision..."
            }
            execution_trace.append(trace_reviewer)
            await stream_manager.broadcast(project_id, "step_update", trace_reviewer)
            await asyncio.sleep(1.0)

            reviewer_res = await self.reviewer.run(
                draft_report=state["draft_report"],
                query=query,
                research_notes=state["research_notes"],
                iteration=current_iter
            )
            
            state["is_approved"] = reviewer_res["is_approved"]
            state["feedback"] = reviewer_res["feedback"]

            if state["is_approved"]:
                trace_reviewer_done = {
                    "step": "Reviewer",
                    "agent": "Reviewer Agent",
                    "status": "completed",
                    "message": f"Report APPROVED with quality score {reviewer_res['quality_score'] * 100:.0f}%!",
                    "details": {"approved": True}
                }
                execution_trace.append(trace_reviewer_done)
                await stream_manager.broadcast(project_id, "step_update", trace_reviewer_done)
            else:
                trace_reviewer_retry = {
                    "step": "Reviewer",
                    "agent": "Reviewer Agent",
                    "status": "revision_requested",
                    "message": f"Self-Correction Loop Triggered: {state['feedback']}",
                    "details": {"approved": False}
                }
                execution_trace.append(trace_reviewer_retry)
                await stream_manager.broadcast(project_id, "step_update", trace_reviewer_retry)
                state["iteration"] += 1
                await asyncio.sleep(0.5)

        # ---------------- STEP 4: RAGAS EVALUATION & FINISH ----------------
        state["final_report"] = state["draft_report"]
        
        trace_eval = {
            "step": "Evaluation",
            "agent": "Ragas Evaluator",
            "status": "active",
            "message": "Computing Ragas metrics (Faithfulness, Answer Relevance, Context Precision, Recall)..."
        }
        execution_trace.append(trace_eval)
        await stream_manager.broadcast(project_id, "step_update", trace_eval)
        await asyncio.sleep(0.6)

        ragas_scores = RagasEvaluator.evaluate(query, state["final_report"], state["retrieved_chunks"])
        state["ragas_score"] = ragas_scores

        trace_finish = {
            "step": "Finish",
            "agent": "Orchestrator",
            "status": "completed",
            "message": f"Workflow completed successfully! Overall Ragas Score: {ragas_scores['overall_ragas_score'] * 100:.0f}%",
            "details": ragas_scores
        }
        execution_trace.append(trace_finish)
        await stream_manager.broadcast(project_id, "workflow_complete", {
            "final_report": state["final_report"],
            "ragas_score": ragas_scores,
            "execution_trace": execution_trace
        })

        return state

workflow_runner = LangGraphWorkflow()
