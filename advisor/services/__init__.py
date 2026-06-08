"""
RAG service layer for the Sustainability Advisor.

Pipeline:
    ingestion.py  ──> chunks + embeddings ──> ChromaDB
    retrieval.py  ──> query vectors ──> top-k chunks
    llm.py        ──> prompt + Claude ──> grounded answer
    rag_chain.py  ──> orchestrates retrieval + LLM, returns sources
"""
