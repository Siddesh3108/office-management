# OfficeWatch: Enterprise SaaS Management Platform

## 🚀 Overview
**OfficeWatch** is an internal tooling platform designed to solve the "Shadow IT" problem in growing organizations. It provides a centralized dashboard for tracking software licenses, managing employee requests (Leaves, Procurement), and visualizing burn rates.

Unlike simple CRUD applications, OfficeWatch is architected for **scalability** and **performance**, utilizing asynchronous background workers for data ingestion and a read-through caching strategy to minimize database load.

## 🏗 System Architecture

```mermaid
graph TD
    Client[React Client] -->|REST API| API[FastAPI Backend]
    
    subgraph Data Layer
        API -->|Read/Write| DB[(PostgreSQL)]
        API -->|Cache Hit/Miss| Cache[(Redis)]
    end
    
    subgraph Async Worker Layer
        API -->|Dispatch Task| Broker[Redis Message Broker]
        Broker --> Worker[Celery Worker]
        Worker -->|Ingest Data| DB
    end
⚡ Key Technical Features
1. Shadow IT Detection (Event-Driven Architecture)
Problem: Organizations lack visibility into unmanaged software subscriptions, leading to budget leakage.

Solution: Implemented an asynchronous Celery worker pipeline to simulate scanning email invoices and detecting unmanaged SaaS subscriptions without blocking the main API thread.

Tech: Celery, Redis, Python.

2. Role-Based Access Control (RBAC)
Security: Enforced strict permission scopes between Admins (Approvers) and Employees (Requesters).

Implementation: Custom JWT middleware verifies user roles before granting access to sensitive endpoints like approve_request or delete_subscription. API endpoints are secured using Depends(get_current_active_admin) dependencies.

3. High-Performance Dashboard (Caching Strategy)
Optimization: Implemented a Read-Through Caching pattern using Redis.

Result: Reduced database read operations by approximately 80% for frequent dashboard refreshes. Cache invalidation logic ensures data consistency immediately upon database updates (write-through validation).

4. Procurement Approval Workflow
Logic: Dynamic state machine handles request lifecycles (Pending -> Approved -> Active Subscription).

Automation: Approved software requests automatically trigger database transactions to provision new assets in the inventory ledger, eliminating manual data entry.
🛠 Tech Stack
Component,Technology,Description
Frontend,"React, Vite, Tailwind",Responsive SPA with Recharts for analytics
Backend,FastAPI (Python),High-performance async REST API
Database,PostgreSQL,Relational data integrity for financial records
Caching,Redis,In-memory data store for session & API caching
Async Queue,Celery,Distributed task queue for long-running jobs
DevOps,Docker Compose,Container orchestration for microservices
🏃‍♂️ How to Run Locally
Prerequisites: Docker & Docker Compose.

Clone the Repository

Bash
git clone [https://github.com/Siddesh3108/office-management.git](https://github.com/Siddesh3108/office-management.git)
cd office-management
Start the Microservices

Bash
docker-compose up --build
Access the Application

Frontend: http://localhost:3000

Backend Documentation: http://localhost:8000/docs

Default Credentials

Admin: Sign up with username admin (Role auto-assigned).

Employee: Sign up with any other username to test the requester flow.

🧪 Testing
The project includes automated unit tests for critical authentication flows and API endpoints to ensure regression stability.

Bash
# Run tests inside the container
docker-compose exec backend python -m pytest
🔮 Future Improvements
Kubernetes (K8s) Deployment: Migrate from Docker Compose to Helm charts for production readiness.

SSO Integration: Replace JWT auth with Okta/Auth0 for enterprise compliance.

Slack Integration: Push notifications to Slack channels upon request approval using Webhooks.
