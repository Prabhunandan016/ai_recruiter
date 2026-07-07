"""BM25 sparse retrieval."""

from __future__ import annotations

from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class BM25Retriever:
    """BM25-based sparse retriever."""

    def __init__(self) -> None:
        self.retriever = None
        self.documents: list[str] = []
        self.indices: list[int] = []

    def index(self, documents: list[str], indices: list[int] | None = None) -> None:
        from rank_bm25 import BM25Okapi
        self.documents = documents
        self.indices = indices or list(range(len(documents)))
        tokenized_docs = [doc.lower().split() for doc in documents]
        self.retriever = BM25Okapi(tokenized_docs)
        LOGGER.info(f"Indexed {len(documents)} documents with BM25")

    def retrieve(self, query: str, top_k: int = 10) -> list[tuple[int, float]]:
        if self.retriever is None:
            return []
        scores = self.retriever.get_scores(query.lower().split())
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [(self.indices[idx], scores[idx]) for idx in top_indices if scores[idx] > 0]
