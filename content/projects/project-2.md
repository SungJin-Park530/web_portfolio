---
title: "Lumen Intelligence Hub"
category: "AI"
role: "AI ENGINEER · LLM PLATFORM"
period: "2025.10 - 2026.02"
thumbnail: "../../assets/images/sample2.png"
videoUrl: "https://www.youtube.com/watch?v=VIDEO_PLACEHOLDER_2"
summary: "An LLM-powered knowledge workspace that classifies documents and generates grounded answers."
highlights:
  - "Cut retrieval latency by 58% with hybrid vector and keyword search."
  - "Added structured extraction pipelines for invoices, reports, and support tickets."
  - "Improved answer reliability with citations, evaluation sets, and guarded tool calls."
techStack:
  - "Python"
  - "FastAPI"
  - "LangChain"
  - "OpenAI API"
  - "Qdrant"
  - "PostgreSQL"
tags: ["featured", "ai", "llm", "rag"]
order: 2
---

# Lumen Intelligence Hub

## Background

Lumen Intelligence Hub is a fictional AI workspace for searching internal documents and turning unstructured knowledge into useful, reviewable answers. Users can upload files, inspect extracted fields, and ask questions with source references.

## AI Pipeline

Documents first pass through a parsing and normalization stage. The pipeline separates text, tables, and metadata before splitting content into retrieval-friendly chunks. Embeddings are stored in Qdrant, while PostgreSQL keeps document ownership, processing status, and evaluation metadata.

At query time, hybrid retrieval combines semantic similarity with keyword matches. A reranking step selects the most relevant passages, and the language model generates an answer constrained to the supplied context. Citations are attached to each answer so users can verify the source.

## Troubleshooting and Optimization

Early responses occasionally included plausible details that were absent from the source documents. The pipeline was updated with stricter context-only instructions, minimum retrieval thresholds, and a fallback response for insufficient evidence.

Long documents also caused uneven processing times. Batched embedding requests and a queue-based worker model reduced pressure on the API while allowing failed documents to be retried independently.

## Results

The fictional system provides a transparent document workflow where generated answers remain traceable, measurable, and easier for teams to review.
