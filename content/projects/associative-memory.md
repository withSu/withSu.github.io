---
title: "Long-term Memory with Associative Recall"
summary: "A conversational AI prototype that organizes memories as a network of related concepts and retrieves them through associative recall."
tags: [AI memory, Associative recall, Python]
repository: "https://github.com/withSu/Long-term-Memory-Chatbot-with-Associative-Recall"
order: 1
draft: false
---

## Overview

This project explores a memory system for conversational AI inspired by associative recall. It stores concepts and their relationships, then follows those connections when retrieving relevant conversation history.

## Approach

- **Layered memory:** working, short-term, and long-term memory have different storage and retrieval roles.
- **Associative recall:** related concepts form a network that supports contextual retrieval.
- **Memory lifecycle:** reinforcement and decay mechanisms manage the strength of stored associations.
- **Inspection:** a visualization makes the resulting memory network easier to examine.

## Implementation

The repository describes a Python implementation using Redis for working memory, SQLite for short-term memory, and ChromaDB for long-term vector storage. Separate modules manage memory, associations, and lifecycle operations.

This is a public software project. The repository contains the implementation and setup instructions.

## Source

[Read the project documentation on GitHub](https://github.com/withSu/Long-term-Memory-Chatbot-with-Associative-Recall).
