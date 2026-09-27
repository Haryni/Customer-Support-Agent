import os
import re
import math
from datetime import datetime
from collections import Counter

POLICY_PATH = os.path.join(os.path.dirname(__file__), "e_commerce_policy.md")

class PolicyRAG:
    """
    RAG Knowledge Base Engine for E-Commerce Policies.
    Provides semantic/keyword retrieval and structured policy validation.
    """
    def __init__(self, policy_file=POLICY_PATH):
        self.sections = []
        self.load_policy(policy_file)

    def load_policy(self, policy_file):
        if not os.path.exists(policy_file):
            return

        with open(policy_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split content into major sections/subsections based on markdown headers
        raw_sections = content.split('---')
        for block in raw_sections:
            lines = [l.strip() for l in block.strip().split('\n') if l.strip()]
            if not lines:
                continue
            
            section_title = "General Policy"
            section_body = []
            
            for line in lines:
                if line.startswith('#'):
                    section_title = line.lstrip('#').strip()
                else:
                    section_body.append(line)
                    
            body_text = "\n".join(section_body)
            if body_text:
                self.sections.append({
                    "title": section_title,
                    "content": body_text,
                    "tokens": self._tokenize(section_title + " " + body_text)
                })

    def _tokenize(self, text):
        words = re.findall(r'\w+', text.lower())
        return set(w for w in words if len(w) > 2)

    def search_policy(self, query: str, top_k: int = 3):
        """
        Retrieves top_k policy sections matching query keywords and semantic concepts.
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.sections[:top_k]

        scored_sections = []
        for sec in self.sections:
            intersection = query_tokens.intersection(sec["tokens"])
            score = len(intersection) / math.sqrt(len(query_tokens) + len(sec["tokens"]) + 1)
            
            # Boost score if query mentions section headers directly
            for token in query_tokens:
                if token in sec["title"].lower():
                    score += 0.5

            if score > 0:
                scored_sections.append((score, sec))

        scored_sections.sort(key=lambda x: x[0], reverse=True)
        results = [sec for score, sec in scored_sections[:top_k]]
        
        # Fallback if no specific match
        if not results:
            results = self.sections[:top_k]
            
        return results

    def check_return_eligibility(self, order_date_str: str, category: str, is_returnable: bool):
        """
        Deterministically evaluates policy constraints for return requests:
        1. Item returnability tag (e.g. non-returnable if custom/personalized).
        2. 30-day return window calculation.
        Returns (is_eligible, reason_msg, policy_citation).
        """
        today = datetime(2026, 9, 27)
        try:
            ord_date = datetime.strptime(order_date_str, "%Y-%m-%d")
        except ValueError:
            return False, "Invalid order date format.", "Policy §2.1"

        days_elapsed = (today - ord_date).days

        if not is_returnable or category.lower() in ["custom", "personalized", "hygiene", "clearance"]:
            return (
                False,
                f"Item category '{category}' is marked as final sale / non-returnable under company policy.",
                "Policy §2.3: Non-Returnable Items"
            )

        if days_elapsed > 45:
            return (
                False,
                f"Order date ({order_date_str}) is {days_elapsed} days ago, exceeding the strict 45-day absolute limit.",
                "Policy §2.1: Return Window"
            )
        elif days_elapsed > 30:
            return (
                False,
                f"Order date ({order_date_str}) is {days_elapsed} days ago. Beyond standard 30-day window. Requires Store Credit / Manager Approval.",
                "Policy §2.1: Return Window (31-45 days Store Credit)"
            )
        else:
            return (
                True,
                f"Order date ({order_date_str}) is {days_elapsed} days ago, within the 30-day return window. Item is eligible for full refund or exchange.",
                "Policy §2.1: Standard 30-Day Return Window"
            )

# Singleton instance
rag_engine = PolicyRAG()

if __name__ == "__main__":
    print("Testing Policy RAG Engine...")
    res = rag_engine.search_policy("What is the refund timeline for returned items?")
    for r in res:
        print(f"[{r['title']}]\n{r['content'][:150]}...\n")
    
    el, msg, cit = rag_engine.check_return_eligibility("2026-09-20", "Footwear", True)
    print(f"Eligibility: {el}, Citation: {cit}\nReason: {msg}")
