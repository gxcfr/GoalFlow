# GoalFlow - Enterprise Performance & Talent Alignment Ecosystem

## Overview
GoalFlow is a premium, high-performance enterprise portal designed for modern organizational goal alignment, continuous feedback, and automated HR governance. Built with a focus on visual excellence and strict security, it transforms the traditional performance review process into a dynamic, real-time ecosystem of achievement and recognition.

## Tech Stack
*   **Core:** React 19 + TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS (v4) with Custom Glassmorphism System
*   **Backend:** Supabase (Auth, PostgreSQL, RLS)
*   **Data Viz:** Recharts (Analytics & Calibration)
*   **Icons:** Lucide React
*   **Navigation:** React Router 7 (`react-router-dom`)

---

## Role-Based Experience
The portal adapts its entire interface and data access based on the user's organizational role:

1.  **Employee Dashboard:** Focused on personal growth. Features include the **Goal Builder**, **Quarterly Check-ins** with Pulse Sentiment, and a **Performance Hub** for tracking trends and Kudos.
2.  **Manager Dashboard:** Focused on team leadership. Features a **Team Overview** for cyclical approvals, **Performance Analytics** to identify high/low achievers, and **Escalations** to manage submission delays.
3.  **Admin/HR Dashboard:** Focused on enterprise oversight. Features an **Org Hierarchy Builder** with Drag & Drop management, **Audit Logs** for compliance, and **Calibration Engines** to normalize performance ratings across teams.

---

## Key Features

### 1. Security & Authentication
*   **3D Login Experience:** A premium entrance featuring 3D perspective transforms, floating background animations, and secure authentication.
*   **Custom Logout UI:** Replaces native browser dialogs with a high-fidelity modal confirmation to prevent accidental session termination.
*   **Row Level Security (RLS):** Absolute data privacy ensured by Supabase, preventing unauthorized cross-team data access.

### 2. Organizational Alignment (Admin)
*   **Drag & Drop Hierarchy:** A visual interface for HR to map reporting lines. Drag unassigned employees directly into manager "lanes" for instant re-assignment.
*   **Smart SLA Escalations:** Automated monitoring of goal sheet submissions. Flags "Manager Negligence" and "Employee Delays" based on configurable thresholds.
*   **Enterprise Audit Trail:** Comprehensive logging of all modifications to finalized sheets, including JSON diffs and timestamped actor IDs.

### 3. Managerial Excellence
*   **Performance Calibration:** Recharts-powered analytics comparing team achievement scores, helping HR identify grading drift.
*   **Feedback Lifecycle:** Seamless `Submit` -> `Review` -> `Approve/Return` workflow with mandatory feedback loops.
*   **Social Recognition:** A "Kudos" system allowing managers to award digital badges (Appreciation, Team Player, etc.) that appear on employee profiles.

### 4. Employee Engagement
*   **Goal Builder:** Categorize goals by Thrust Areas (Growth, Innovation) with dynamic weightage calculation (must sum to 100%).
*   **Pulse Sentiment:** A "vibe check" during check-ins to capture employee morale and support levels.
*   **Skill-Bridge AI:** Contextual recommendations triggered when goals fall behind, suggesting learning paths and 1-on-1 topics.

## UI/UX Design System
*   **Glassmorphism:** Heavily utilizes `backdrop-blur`, semi-transparent panels, and white-bordered cards for a modern "Apple-esque" feel.
*   **Mesh Backgrounds:** Custom-designed dark and light mesh gradients (`bg-mesh-dark`, `bg-mesh`) for depth and premium texture.
*   **Responsive Motion:** Powered by custom Tailwind animations (`animate-fade-in-up`, `animate-scale-up`, `animate-float`) for fluid state transitions.
*   **Unified Sidebar:** A sophisticated, collapsible navigation system that handles role-specific deep-linking via URL search parameters.

---
*Handcrafted with precision & styled for excellence.*
