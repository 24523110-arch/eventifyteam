# Project

**Eventify — Concert Management Information System (MIS)**

A web-based MIS for large-scale concert operations. Data that today is scattered across spreadsheets, WhatsApp groups, and manual reports (ticket sales, attendance, finance, crowd density, security incidents) is centralized into one real-time platform so management can monitor and evaluate a concert as it happens, instead of days later.

**Core Value:** At any moment during a live concert, management can see ticket/finance performance, crowd/security status, and vendor readiness in one dashboard — and can generate a detailed AI-assisted evaluation report combining the Event Organizer's ticket & finance report with the Security Team's incident record, without manually collecting data from each team after the fact.

### Roles

Revised down from the original 5-actor PRD scope (Executive Management, Operation Manager, Finance Manager, Security Team, generic Operations) to 3 roles that map to real, distinct responsibilities:

| Role | Responsibility |
|---|---|
| **Manager** | Business evaluation — Finance dashboard, User Management, and the AI-generated concert evaluation report |
| **Admin / Event Organizer** | Concert Schedule (plan/run multiple concerts, one Live at a time), Vendor Management, and the manual ticket + finance report (Reports & Ticket Sales) |
| **Security Team** | Live/Crowd Monitoring, manual audience-attendance entry, and the Incident Center (track/assign/resolve) |

### Constraints

- **Scope**: Web-based only — no native mobile apps
- **Payments**: No payment processing — ticket revenue and expenses are reported manually by the Event Organizer, not processed by the system
- **Reporting model**: Every figure in the system is **manually entered or a static snapshot** — ticket counts, finance totals, and attendance are manual MIS entries (reported by the role that owns that data in real life), and crowd-zone occupancy is a fixed realistic snapshot, not a simulated sensor feed. Nothing changes unless a person changes it. (A random-walk crowd simulator exists as an opt-in demo tool, `SIMULATOR_ENABLED=true`, off by default.)
- **Single active concert**: Many concerts can be scheduled/tracked as history, but only one is ever "Live" at a time — that's the one every operational screen (dashboards, vendors, incidents, notifications) reflects.

### Success Metrics (from the original PRD)

| Metric | Target |
|---|---|
| Dashboard data latency | ≤ 5 minutes from data entry to visible on screen |
| Concert evaluation report turnaround | < 1 day (down from 7 days manual) |
| Crowd/capacity monitoring accuracy | ≥ 95% match with actual venue conditions |
| Security incident response time | < 8 minutes |
