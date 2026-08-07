# Pata – Location Intelligence for Last-Mile Delivery

Welcome to the Pata repository for AI Build 2026!

## Folder Structure

This repository follows a strict modular structure to ensure clear separation of concerns, scalability, and ease of deployment.

```text
PataAI/
│
├── frontend/         # React.js web application (User Interface, Maps, Dashboards)
│   ├── src/          # React components, contexts, and hooks
│   └── public/       # Static assets
│
├── backend/          # Node.js + Express.js API Gateway (The Main Orchestrator)
│   ├── routes/       # API endpoints (e.g., /api/locate)
│   ├── controllers/  # Business logic & proxy to AI service
│   └── config/       # Environment & Firebase config
│
├── ai-service/       # Python FastAPI application (Multi-Agent System)
│   ├── agents/       # The 5 specialized AI agents
│   ├── models/       # Pydantic schemas for data validation
│   └── main.py       # FastAPI entry point
│
├── firebase/         # Firebase configuration and security rules
│   ├── firestore.rules
│   └── indexes.json
│
├── datasets/         # Local storage for CSV files (e.g., All India Pincode Directory)
│   └── README.md     # Instructions on how to download and place datasets
│
├── docs/             # Project documentation (Architecture, Diagrams, API specs)
│   └── README.md
│
└── README.md         # This file
```

## Setup Instructions
(To be populated in subsequent steps)
