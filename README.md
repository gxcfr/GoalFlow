# GlowFlow - Enterprise Goal Tracking & Talent Management Portal

## Overview
GlowFlow (formerly GoalFlow) is a modern, responsive, and highly secure enterprise goal tracking and performance management portal. It is built to align organizational objectives, streamline managerial reviews, and accelerate employee performance through continuous engagement. It enables employees to define their quarterly goals and track progress, managers to review and recognize achievements, and HR/Admins to oversee the entire organization with advanced analytics and governance.

## Tech Stack
*   **Frontend Framework:** React 19
*   **Build Tool & Dev Server:** Vite
*   **Language:** TypeScript
*   **Styling & CSS Framework:** Tailwind CSS (v4)
*   **Backend as a Service (BaaS):** Supabase (PostgreSQL, Authentication, Row Level Security)
*   **Routing:** React Router (`react-router-dom`)
*   **Icons:** Lucide React
*   **Data Visualization:** Recharts
*   **Utility Libraries:** `clsx` and `tailwind-merge`

---

## Key Roles & Access Levels
The system features strict Row Level Security (RLS) managed by Supabase, tailored for three distinct roles:
1.  **Employee:** Can create, view, update their own goals, track quarterly progress, and receive social feedback (Kudos).
2.  **Manager (L1):** Can view their team's goals, provide feedback, approve/return goal sheets, and send corporate Kudos.
3.  **Admin/HR:** Has enterprise oversight, manages the organizational hierarchy, views calibration analytics, monitors compliance via audit logs, and sets smart escalation thresholds.

---

## Comprehensive Feature List

### 1. Authentication & Security
*   **Role-based Access Control (RBAC):** Users are securely redirected to their specific dashboard (Employee, Manager, or Admin) upon login based on their assigned role in the `profiles` table.
*   **Row Level Security (RLS):** Data access is strictly controlled at the database level. Employees cannot see other employees' goals, ensuring absolute data privacy.
*   **Secure Auth Flow:** Powered by Supabase Auth with custom premium UI login screens adapting to desktop and mobile devices.

### 2. Employee Features (Goal Lifecycle & Engagement)
*   **Goal Sheet Creation:** Employees can define multiple goals categorized by "Thrust Areas" (e.g., Growth, Innovation) and "Unit of Measure (UOM)" (Percentage, Numeric, Date).
*   **Dynamic Status Tracking:** Goal sheets progress through a rigid, automated lifecycle: `Draft` -> `Submitted` -> `Approved` -> `Locked`.
*   **Quarterly Check-ins & Pulse Sentiment:** Employees submit progress for Q1, Q2, Q3, and Q4 during specified time windows. During submission, a **Pulse Sentiment** "vibe check" captures how supported the employee feels (1-5 rating).
*   **Automated Progress Scoring:** The system automatically computes "Progress Scores" for each goal based on Actual Achievement vs. Planned Target, ensuring objective tracking.
*   **Skill-Bridge Recommendations:** If a goal falls "Behind", the system displays contextual suggestions advising employees to explore internal learning resources or discuss blockers during 1-on-1s.
*   **Performance Hub:** A dedicated tab featuring:
    *   **Visual Trends (Recharts):** Quarter-over-Quarter achievement trend bars and Thrust Area weightage donut charts.
    *   **Kudos & Recognition Cabinet:** A display of all digital badges and messages received from managers and leadership.
    *   **Feedback Timeline:** A chronological log of all Check-in comments left by managers.

### 3. Manager Features (Team Leadership & Recognition)
*   **Team Overview Dashboard:** Managers have a dedicated hub to view all employees assigned to their specific reporting line.
*   **Approval Workflow & Cyclical Reviews:** Managers review pending goal sheets and quarterly check-ins, explicitly choosing to `Approve` or `Return` them with mandatory feedback.
*   **Micro-Kudos & Social Validation:** Managers can instantly send "Kudos" (digital badges like *Early Achiever* or *Team Player* with custom messages) directly to their direct reports to foster a positive feedback culture.
*   **Dynamic Status Badges:** Color-coded visual indicators help managers quickly identify which team members need immediate review or intervention.

### 4. Admin & HR Features (Enterprise Governance)
*   **Overview Dashboard:** A high-level metric view of total employees, pending approvals, approved sheets, and locked sheets across the organization.
*   **Interactive Drag-and-Drop Organogram:** A visual administrative workspace where Admins drag unassigned employees and drop them into a manager's team bucket.
*   **Automated Calibration Engine:** Replaces basic approval rates with an advanced Recharts dashboard that calculates the **Average Team Score (%)** for every manager, helping HR easily identify "easy graders" vs. "tough graders".
*   **Enterprise Audit Trail:** A strict compliance log tracking all modifications made to goals *after* they have been Locked (logging timestamp, user ID, and JSON diffs).
*   **Smart Thresholds & Escalations (SLA Tracking):** An automated SLA monitoring engine with a configurable UI. Admins can set rules (e.g., *Draft Non-Submission > 80%*) to dynamically flag and escalate compliance issues before they breach.
*   **Corporate Kudos:** Admins and HR can award high-level corporate badges (e.g., *Company Value Champion*) across the entire organization.
*   **Achievement Report Export:** Instant CSV exports of all employee Planned Targets vs. Actual Achievements spanning all four quarters.

### 5. UI/UX & Design Aesthetics
*   **Premium Glassmorphism Interface:** Designed with a stunning, modern aesthetic using heavily customized Tailwind CSS, frosted glass panels (`backdrop-blur`), deep mesh backgrounds (`bg-mesh-dark`), and curated typography.
*   **Branded Identity:** Fully integrated "GlowFlow" branding with animated Logo and LogoMark transitions in the sidebar, persistent footer accreditations, and unified global layout panels.
*   **Collapsible Sidebar Navigation:** A smooth, responsive side navigation menu with fluid hover-expand animations designed to maximize screen real estate for deep-focus work.
*   **Fully Responsive Layout:** The entire portal scales flawlessly across ultra-wide desktop monitors, standard laptops, tablets, and mobile devices.
