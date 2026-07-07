"""FAISS dense vector retrieval."""

from __future__ import annotations

from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class FAISSRetriever:
    """FAISS-based dense vector retriever."""

    def __init__(self) -> None:
        self._index = None
        self.indices: list[int] = []

    def build_index(self, embeddings, indices: list[int] | None = None) -> None:
        import numpy as np
        import faiss
        embeddings_normalized = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-8)
        dimension = embeddings_normalized.shape[1]
        self._index = faiss.IndexFlatIP(dimension)
        self._index.add(embeddings_normalized.astype("float32"))
        self.indices = indices or list(range(len(embeddings)))
        LOGGER.info(f"Indexed {len(embeddings)} embeddings with FAISS")

    def search(self, query_embedding, top_k: int = 10) -> list[tuple[int, float]]:
        import numpy as np
        if self._index is None:
            return []
        query_normalized = query_embedding / (np.linalg.norm(query_embedding) + 1e-8)
        query_normalized = query_normalized.reshape(1, -1).astype("float32")
        scores, neighbors = self._index.search(query_normalized, min(top_k, len(self.indices)))
        return [
            (self.indices[int(n)], float(s))
            for n, s in zip(neighbors[0], scores[0]) if n >= 0
        ]
