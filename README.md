# GoalFlow - Enterprise Goal Tracking Portal

## Overview
GoalFlow is a modern, responsive, and highly secure enterprise goal tracking and performance management portal. It is built to align organizational objectives, streamline managerial reviews, and accelerate employee performance. It enables employees to define their quarterly goals, managers to review and approve them, and HR/Admins to oversee the entire organization.

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
1.  **Employee:** Can create, view, and update their own goals and quarterly progress.
2.  **Manager (L1):** Can view their team's goals, provide feedback, and approve/return goal sheets and quarterly check-ins.
3.  **Admin/HR:** Has enterprise oversight, manages the organizational hierarchy, views analytics, and monitors compliance via audit logs.

---

## Comprehensive Feature List

### 1. Authentication & Security
*   **Role-based Access Control (RBAC):** Users are securely redirected to their specific dashboard (Employee, Manager, or Admin) upon login based on their assigned role in the `profiles` table.
*   **Row Level Security (RLS):** Data access is strictly controlled at the database level. Employees cannot see other employees' goals, ensuring absolute data privacy.
*   **Secure Auth Flow:** Powered by Supabase Auth with custom premium UI login screens adapting to desktop and mobile devices.

### 2. Employee Features (Goal Lifecycle Management)
*   **Goal Sheet Creation:** Employees can define multiple goals categorized by "Thrust Areas" (e.g., Growth, Innovation) and "Unit of Measure (UOM)" (Percentage, Numeric, Date).
*   **Dynamic Status Tracking:** Goal sheets progress through a rigid, automated lifecycle: `Draft` -> `Submitted` -> `Approved` -> `Locked`.
*   **Quarterly Check-ins:** Once a goal sheet is "Locked", the system dynamically enters the Quarterly review phase. Employees can submit progress explicitly for Q1, Q2, Q3, and Q4 during specified time windows.
*   **Automated Progress Scoring:** The system automatically computes "Progress Scores" for each goal using predefined mathematical formulas based on Actual Achievement vs. Planned Target, ensuring objective tracking.
*   **Real-time Feedback Notifications:** Manager feedback left during the quarterly review process is saved and immediately displayed on the employee's dashboard as distinct highlight cards.

### 3. Manager Features (Team Leadership)
*   **Team Overview Dashboard:** Managers have a dedicated hub to view all employees assigned to their specific reporting line.
*   **Approval Workflow:** Managers can review pending goal sheets and choose to explicitly `Approve` or `Return` them. Returning a sheet requires mandatory feedback.
*   **Cyclical Quarterly Approvals:** Instead of a permanent global lock, managers approve individual quarterly check-ins (e.g., transitioning "Q1 Submitted" to "Q1 Approved"). Once approved, the sheet resets and becomes editable for the *next* quarter.
*   **Dynamic Status Badges:** Color-coded visual indicators help managers quickly identify which team members have drafted, submitted, or locked goals, prioritizing immediate review needs.

### 4. Admin & HR Features (Enterprise Governance)
*   **Overview Dashboard:** A high-level metric view of total employees, pending approvals, approved sheets, and locked sheets across the organization.
*   **Interactive Drag-and-Drop Organogram:** A visual administrative workspace where Admins can drag unassigned employees and drop them directly into a specific manager's team bucket to assign reporting structures seamlessly.
*   **Enterprise Audit Trail:** A strict compliance log tracking all modifications made to goals *after* they have been Locked. It meticulously logs the exact timestamp, the user ID of who made the change, and a JSON diff of the old vs. new values.
*   **Achievement Report Export:** Admins can instantly export a comprehensive CSV file containing every employee's Planned Targets vs. Actual Achievements spanning all four quarters.
*   **Quarterly Completion Dashboard:** A real-time monitoring table tracking the exact check-in status (e.g., "Q1 Submitted", "Q1 Approved") for both Employees and Managers (since managers also have goals).
*   **Escalation Log (SLA Tracking):** An automated SLA monitoring engine that dynamically flags severe compliance issues, such as:
    *   *High Severity:* Employee has not submitted goals within 7 days of the cycle opening.
    *   *Critical Severity:* Manager has not approved submitted goals within 5 days.
*   **Analytics Module (Recharts Integration):** Interactive enterprise insights including:
    *   *QoQ Achievement Trends:* A bar chart tracking the percentage of completed goals quarter over quarter.
    *   *Manager Effectiveness:* A horizontal bar chart evaluating L1 Managers by their team's overall check-in approval rate.
    *   *Goal Distribution:* A dynamic pie/donut chart visualizing the breakdown of all enterprise goals by their Thrust Area.

### 5. UI/UX & Design Aesthetics
*   **Premium Glassmorphism Interface:** Designed with a stunning, modern aesthetic using heavily customized Tailwind CSS, frosted glass panels (`backdrop-blur`), deep mesh backgrounds, and curated typography.
*   **Collapsible Sidebar Navigation:** A smooth, responsive side navigation menu with fluid hover-expand animations designed to maximize screen real estate for deep-focus work.
*   **Custom Brand Integration:** Integrates custom SVG logos mapped accurately and responsively across both Desktop sidebars and Mobile viewports.
*   **Fully Responsive Layout:** The entire portal scales flawlessly across ultra-wide desktop monitors, standard laptops, tablets, and mobile devices.
