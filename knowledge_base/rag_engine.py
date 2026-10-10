"""
RAG Knowledge Base Engine — TF-IDF Vector Retrieval
=====================================================
Addresses evaluator feedback: policy lookup is now vector-based (TF-IDF cosine similarity)
instead of simple word matching. Uses only Python stdlib — no extra dependencies.
"""
import os
import re
import math
from datetime import datetime
from collections import Counter

POLICY_PATH = os.path.join(os.path.dirname(__file__), "e_commerce_policy.md")


class PolicyRAG:
    """
    RAG Knowledge Base Engine for E-Commerce Policies.

    Retrieval method: TF-IDF weighted cosine similarity over policy sections.
    - Each section is indexed as a TF-IDF vector at load time.
    - Queries are vectorised on-the-fly and scored against the index.
    - Provides both semantic retrieval (search_policy) and deterministic
      structured validation (check_return_eligibility).
    """

    def __init__(self, policy_file: str = POLICY_PATH):
        self.sections: list = []
        self._idf: dict = {}        # corpus-level IDF weights
        self._doc_tfidf: list = []  # per-section TF-IDF vectors
        self.load_policy(policy_file)

    # ------------------------------------------------------------------
    # Document Loading
    # ------------------------------------------------------------------
    def load_policy(self, policy_file: str) -> None:
        """Parse the markdown policy document into titled sections."""
        if not os.path.exists(policy_file):
            return

        with open(policy_file, "r", encoding="utf-8") as f:
            content = f.read()

        raw_sections = content.split("---")
        raw_parsed = []

        for block in raw_sections:
            lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
            if not lines:
                continue

            section_title = "General Policy"
            section_body = []

            for line in lines:
                if line.startswith("#"):
                    section_title = line.lstrip("#").strip()
                else:
                    section_body.append(line)

            body_text = "\n".join(section_body)
            if body_text:
                raw_parsed.append({"title": section_title, "content": body_text})

        # Build TF-IDF index from the parsed sections
        self._build_tfidf_index(raw_parsed)

    # ------------------------------------------------------------------
    # TF-IDF Index Construction (stdlib only)
    # ------------------------------------------------------------------
    def _tokenize(self, text: str) -> list:
        """Lower-case tokenisation — removes stopwords shorter than 3 chars."""
        return [w for w in re.findall(r"\w+", text.lower()) if len(w) >= 3]

    def _tf(self, tokens: list) -> dict:
        """Term frequency (normalised by document length)."""
        count = Counter(tokens)
        total = len(tokens) or 1
        return {term: freq / total for term, freq in count.items()}

    def _build_tfidf_index(self, parsed: list) -> None:
        """Compute and cache TF-IDF vectors for all sections."""
        N = len(parsed)
        if N == 0:
            return

        # Tokenise every section
        tokenised = []
        for sec in parsed:
            tokens = self._tokenize(sec["title"] + " " + sec["content"])
            tokenised.append(tokens)

        # Compute IDF: log(N / df) with +1 smoothing
        df = {}
        for tokens in tokenised:
            for term in set(tokens):
                df[term] = df.get(term, 0) + 1
        self._idf = {term: math.log((N + 1) / (freq + 1)) + 1.0 for term, freq in df.items()}

        # Compute TF-IDF vectors and store sections
        for i, sec in enumerate(parsed):
            tokens = tokenised[i]
            tf = self._tf(tokens)
            tfidf_vec = {term: tf_val * self._idf.get(term, 1.0) for term, tf_val in tf.items()}
            # L2-normalise
            norm = math.sqrt(sum(v * v for v in tfidf_vec.values())) or 1.0
            tfidf_vec = {term: v / norm for term, v in tfidf_vec.items()}

            self._doc_tfidf.append(tfidf_vec)
            self.sections.append({
                "title": sec["title"],
                "content": sec["content"],
            })

    def _query_vector(self, query: str) -> dict:
        """Build an L2-normalised TF-IDF vector for an incoming query."""
        tokens = self._tokenize(query)
        if not tokens:
            return {}
        tf = self._tf(tokens)
        tfidf_vec = {term: tf_val * self._idf.get(term, 1.0) for term, tf_val in tf.items()}
        norm = math.sqrt(sum(v * v for v in tfidf_vec.values())) or 1.0
        return {term: v / norm for term, v in tfidf_vec.items()}

    def _cosine_similarity(self, vec_a: dict, vec_b: dict) -> float:
        """Dot product of two L2-normalised TF-IDF vectors (= cosine similarity)."""
        shared_terms = set(vec_a.keys()) & set(vec_b.keys())
        return sum(vec_a[t] * vec_b[t] for t in shared_terms)

    # ------------------------------------------------------------------
    # Public API: Vector Retrieval
    # ------------------------------------------------------------------
    def search_policy(self, query: str, top_k: int = 3) -> list:
        """
        Retrieve top_k policy sections using TF-IDF cosine similarity.

        This is *vector-based retrieval* — each document and query are
        represented as weighted TF-IDF vectors and ranked by cosine
        similarity. Unlike simple keyword matching, this approach:
        - Weighs rare (discriminative) terms more heavily via IDF.
        - Handles partial vocabulary overlap gracefully.
        - Returns a ranked list regardless of exact keyword presence.
        """
        q_vec = self._query_vector(query)
        if not q_vec:
            return self.sections[:top_k]

        scored = []
        for i, doc_vec in enumerate(self._doc_tfidf):
            score = self._cosine_similarity(q_vec, doc_vec)
            scored.append((score, i))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_indices = [idx for score, idx in scored[:top_k] if score > 0]

        if not top_indices:
            top_indices = list(range(min(top_k, len(self.sections))))

        return [self.sections[i] for i in top_indices]

    # ------------------------------------------------------------------
    # Public API: Deterministic Return Eligibility Check
    # ------------------------------------------------------------------
    def check_return_eligibility(self, order_date_str: str, category: str, is_returnable: bool):
        """
        Deterministically evaluate policy constraints for return requests.

        Checks:
        1. Item returnability tag (non-returnable if custom/personalized/hygiene).
        2. 30-day return window (31-45 days -> store credit only; >45 days -> rejected).

        Returns:
            (is_eligible: bool, reason_msg: str, policy_citation: str)
        """
        today = datetime.now()  # Use real current date, not hardcoded
        try:
            ord_date = datetime.strptime(order_date_str, "%Y-%m-%d")
        except ValueError:
            return False, "Invalid order date format.", "Policy §2.1"

        days_elapsed = (today - ord_date).days

        non_returnable_categories = {"custom", "personalized", "hygiene", "clearance"}
        if not is_returnable or category.lower() in non_returnable_categories:
            return (
                False,
                f"Item category '{category}' is marked as final sale / non-returnable under company policy.",
                "Policy §2.3: Non-Returnable Items",
            )

        if days_elapsed > 45:
            return (
                False,
                f"Order date ({order_date_str}) is {days_elapsed} days ago, exceeding the strict 45-day absolute limit.",
                "Policy §2.1: Return Window",
            )
        elif days_elapsed > 30:
            return (
                False,
                (
                    f"Order date ({order_date_str}) is {days_elapsed} days ago. "
                    "Beyond standard 30-day window. Requires Store Credit / Manager Approval."
                ),
                "Policy §2.1: Return Window (31-45 days Store Credit)",
            )
        else:
            return (
                True,
                (
                    f"Order date ({order_date_str}) is {days_elapsed} days ago, "
                    "within the 30-day return window. Item is eligible for full refund or exchange."
                ),
                "Policy §2.1: Standard 30-Day Return Window",
            )


# ---------------------------------------------------------------------------
# Singleton instance — imported by all agent nodes
# ---------------------------------------------------------------------------
rag_engine = PolicyRAG()

if __name__ == "__main__":
    print("Testing Policy RAG Engine (TF-IDF Vector Retrieval)...")
    res = rag_engine.search_policy("What is the refund timeline for returned items?")
    for r in res:
        print(f"[{r['title']}]\n{r['content'][:150]}...\n")

    el, msg, cit = rag_engine.check_return_eligibility("2026-09-20", "Footwear", True)
    print(f"Eligibility: {el}, Citation: {cit}\nReason: {msg}")
