"use client";

import { useState, useEffect, useCallback } from "react";

type Status = "pass" | "fail" | "skip" | null;

interface TestCase {
  id: string;
  title: string;
  steps: string[];
  expected: string;
}

interface TestSection {
  title: string;
  role: string;
  cases: TestCase[];
}

const TEST_SECTIONS: TestSection[] = [
  // ─── AUTHENTICATION ───
  {
    title: "Authentication — Email/Password",
    role: "Anonymous",
    cases: [
      {
        id: "auth-1",
        title: "Sign up with email/password (verification flow)",
        steps: [
          "Go to /login",
          "Switch to 'Sign Up' tab",
          "Enter a new email and password",
          "Click 'Create Account'",
        ],
        expected:
          "Verification email sent. 'Check your email' screen shown with the email address. User is NOT logged in. 'Go to Log In' button shown.",
      },
      {
        id: "auth-1b",
        title: "Verify email and log in",
        steps: [
          "Open verification email in inbox",
          "Click the verification link",
          "Return to /login",
          "Enter the same email and password",
          "Click 'Log In'",
        ],
        expected:
          "Logged in successfully, redirected to home. Avatar appears in header.",
      },
      {
        id: "auth-1c",
        title: "Try to log in before email verification",
        steps: [
          "Sign up with email/password (do NOT click verification link)",
          "Go to /login and try to log in with same email/password",
        ],
        expected:
          "Error: 'Please verify your email first. We've sent a new verification link to [email].' User NOT logged in. New verification email sent.",
      },
      {
        id: "auth-2",
        title: "Sign in with existing verified email/password",
        steps: [
          "Go to /login",
          "Enter existing verified email and password",
          "Click 'Log In'",
        ],
        expected:
          "Logged in successfully, redirected to home. Avatar appears in header.",
      },
      {
        id: "auth-3",
        title: "Sign in with wrong password",
        steps: [
          "Go to /login",
          "Enter existing email with wrong password",
          "Click 'Log In'",
        ],
        expected: "Error: 'Incorrect email or password.' Not logged in.",
      },
      {
        id: "auth-4",
        title: "Sign in with Google",
        steps: [
          "Go to /login",
          "Click 'Sign in with Google'",
          "Select a Google account",
        ],
        expected:
          "Logged in successfully. If first time, welcome email sent. Redirected to home.",
      },
      {
        id: "auth-5",
        title: "Logout",
        steps: [
          "Click avatar in header",
          "Click 'Logout' from dropdown",
        ],
        expected: "Session cleared. Redirected to login page. Protected pages no longer accessible.",
      },
      {
        id: "auth-6",
        title: "Forgot password — valid email/password account",
        steps: [
          "Go to /login",
          "Enter an email that has an email/password account",
          "Click 'Forgot Password?'",
        ],
        expected: "Success message: 'Password reset link sent to [email]'. Reset email received in inbox.",
      },
      {
        id: "auth-7",
        title: "Forgot password — Google-only account",
        steps: [
          "Go to /login",
          "Enter an email that only has Google Sign-In",
          "Click 'Forgot Password?'",
        ],
        expected: "Error: 'This account uses Google Sign-In. Please use the Continue with Google button above.' No reset email sent.",
      },
      {
        id: "auth-8",
        title: "Forgot password — email not registered",
        steps: [
          "Go to /login",
          "Enter an email that is not registered",
          "Click 'Forgot Password?'",
        ],
        expected: "Error: 'No account found with this email address.' No reset email sent.",
      },
      {
        id: "auth-9",
        title: "Sign up with email already registered via Google",
        steps: [
          "Go to /login",
          "Switch to 'Sign Up' tab",
          "Enter an email that already has a Google account",
          "Click 'Create Account'",
        ],
        expected: "Error: 'This email is already registered via Google. Please use the Continue with Google button above.'",
      },
    ],
  },

  // ─── STUDENT — TRIAL ───
  {
    title: "Student — Trial Period",
    role: "Student (Trial)",
    cases: [
      {
        id: "trial-1",
        title: "Access content during trial",
        steps: [
          "Sign in as a new student (within trial period)",
          "Navigate to any class → subject → chapter",
        ],
        expected:
          "Full access to notes, discussion, worksheet, and quiz. No blur or paywall.",
      },
      {
        id: "trial-2",
        title: "Trial expiry blocks access (chapter 3+)",
        steps: [
          "Use a student account whose trial has expired",
          "Navigate to chapter 3 or higher of any subject",
        ],
        expected:
          "Content is blurred/restricted. Subscribe prompt shown with 'Request Extension' link below.",
      },
      {
        id: "trial-3",
        title: "Free chapters accessible after trial expiry",
        steps: [
          "Use a student account whose trial has expired",
          "Navigate to chapter 1 or chapter 2 of any subject",
        ],
        expected:
          "Full content visible. No blur. No paywall. Chapters 1 and 2 are always free.",
      },
      {
        id: "trial-4",
        title: "Request extension after trial expiry",
        steps: [
          "Use an expired account",
          "Navigate to chapter 3+",
          "Click 'Need more time? Request an extension'",
        ],
        expected:
          "Success message: 'Extension request sent! We'll review it shortly.' Admin receives notification (bell icon) and email. Only one request allowed.",
      },
    ],
  },

  // ─── STUDENT — SUBSCRIPTION ───
  {
    title: "Student — Subscription & Payment",
    role: "Student",
    cases: [
      {
        id: "sub-1",
        title: "Subscribe without referral code",
        steps: [
          "Go to /pricing",
          "Click Subscribe",
          "Complete Razorpay payment",
        ],
        expected:
          "Payment verified. Subscription active for 1 year. Confirmation email received. Full content access restored.",
      },
      {
        id: "sub-2",
        title: "Subscribe with valid referral code",
        steps: [
          "Go to /pricing",
          "Enter a valid advisor referral code (e.g. ADV-XXXXX)",
          "Verify discount is applied to price",
          "Complete Razorpay payment",
        ],
        expected:
          "Discount applied to total. Payment processed at reduced amount. Advisor gets commission email. Subscription active for 1 year.",
      },
      {
        id: "sub-3",
        title: "Subscribe with invalid referral code",
        steps: [
          "Go to /pricing",
          "Enter an invalid/expired referral code",
          "Click Validate",
        ],
        expected:
          "Error message: invalid code. No discount applied. Can still subscribe at full price.",
      },
      {
        id: "sub-4",
        title: "Razorpay payment cancelled/failed",
        steps: [
          "Go to /pricing",
          "Click Subscribe",
          "Close Razorpay modal without paying (or let payment fail)",
        ],
        expected:
          "No subscription created. Student remains on current plan. No email sent.",
      },
    ],
  },

  // ─── STUDENT — CONTENT ───
  {
    title: "Student — Content & Navigation",
    role: "Student (Active)",
    cases: [
      {
        id: "content-1",
        title: "Browse classes and subjects",
        steps: [
          "Go to /classes",
          "Click on a class (e.g. Class 6)",
          "Click on a subject (e.g. Science)",
        ],
        expected:
          "Class page shows all subjects. Subject page shows all chapters with progress indicators.",
      },
      {
        id: "content-2",
        title: "Read chapter notes",
        steps: [
          "Navigate to any chapter",
          "Check Notes tab is active by default",
        ],
        expected:
          "Notes rendered with proper formatting (headings, images, tables). Images load correctly. Table of contents shows ## headings.",
      },
      {
        id: "content-3",
        title: "View chapter discussion",
        steps: [
          "Navigate to a chapter that has discussion content",
          "Click 'Discussion' tab",
        ],
        expected: "Mother-child dialogue rendered properly. MDX formatting correct.",
      },
      {
        id: "content-4",
        title: "View worksheet",
        steps: [
          "Navigate to a chapter that has a worksheet",
          "Click 'Worksheet' tab",
        ],
        expected:
          "Topics listed in vertical sidebar. Easy/Medium/Hard difficulty tabs visible. Questions rendered by type (MCQ, Fill, Short).",
      },
      {
        id: "content-5",
        title: "Answer MCQ question in worksheet",
        steps: [
          "Go to Worksheet tab",
          "Click an option for an MCQ question",
        ],
        expected:
          "Selected option highlighted. Green for correct, red for wrong. Correct answer shown if wrong. 'Try Again' button appears.",
      },
      {
        id: "content-6",
        title: "Answer Fill-in-the-blank question",
        steps: [
          "Go to Worksheet tab",
          "Type answer in a fill-in-the-blank question",
          "Click Check or press Enter",
        ],
        expected:
          "Green check for correct, red X for wrong. Correct answer shown if wrong. 'Try Again' button appears.",
      },
      {
        id: "content-7",
        title: "Navigate between chapters (prev/next)",
        steps: [
          "Open any chapter that has a next/previous chapter",
          "Click Previous or Next navigation cards (top or bottom)",
        ],
        expected: "Navigated to the correct adjacent chapter. Content loads.",
      },
      {
        id: "content-8",
        title: "Global search",
        steps: [
          "Click the search icon in header",
          "Type a keyword (e.g. 'friction')",
        ],
        expected:
          "Matching chapters shown with title and description. Clicking result navigates to the chapter.",
      },
    ],
  },

  // ─── STUDENT — QUIZ ───
  {
    title: "Student — Quiz System",
    role: "Student (Active)",
    cases: [
      {
        id: "quiz-1",
        title: "Start a quiz",
        steps: [
          "Go to /quiz-start",
          "Select one or more chapters",
          "Select difficulty (Easy/Hard/Mixed)",
          "Click Start Quiz",
        ],
        expected: "Quiz page loads with questions from selected chapters and difficulty.",
      },
      {
        id: "quiz-2",
        title: "Complete quiz with score >= 80%",
        steps: [
          "Start a quiz",
          "Answer enough questions correctly to get >= 80%",
          "Submit quiz",
        ],
        expected:
          "Score shown. 'Quiz Passed!' message displayed. Chapters auto-marked as completed (completedBy: quiz). Progress updated in profile.",
      },
      {
        id: "quiz-3",
        title: "Complete quiz with score < 80%",
        steps: [
          "Start a quiz",
          "Answer questions to get < 80%",
          "Submit quiz",
        ],
        expected:
          "Score shown. 'Score 80%+ to mark this chapter as quiz passed' message. Chapters NOT auto-marked as completed.",
      },
      {
        id: "quiz-4",
        title: "Quiz attempt saved to profile",
        steps: [
          "Complete any quiz",
          "Go to /profile",
          "Check quiz history section",
        ],
        expected:
          "Quiz attempt visible with score, percentage, difficulty, and date. Average score updated.",
      },
    ],
  },

  // ─── STUDENT — PROGRESS & BOOKMARKS ───
  {
    title: "Student — Progress & Bookmarks",
    role: "Student (Active)",
    cases: [
      {
        id: "progress-1",
        title: "Mark chapter as complete (manual)",
        steps: [
          "Navigate to any chapter",
          "Click 'Mark Complete' button in the banner",
        ],
        expected:
          "Button changes to 'Marked Complete' (blue). Chapter shows as completed in subject listing. completedBy: manual.",
      },
      {
        id: "progress-2",
        title: "Unmark manual completion",
        steps: [
          "Navigate to a manually completed chapter",
          "Click 'Marked Complete' button",
        ],
        expected:
          "Button reverts to 'Mark Complete'. Chapter no longer shown as completed.",
      },
      {
        id: "progress-3",
        title: "Cannot unmark quiz-passed completion",
        steps: [
          "Navigate to a chapter completed via quiz (completedBy: quiz)",
          "Check the completion badge",
        ],
        expected:
          "'Quiz Passed' badge shown (green, non-clickable). No option to unmark.",
      },
      {
        id: "progress-4",
        title: "Bookmark a chapter",
        steps: [
          "Navigate to any chapter",
          "Click 'Bookmark' button in the banner",
        ],
        expected:
          "Button changes to 'Bookmarked' (yellow). Bookmark icon filled. Chapter appears in profile bookmarks.",
      },
      {
        id: "progress-5",
        title: "Remove bookmark",
        steps: [
          "Navigate to a bookmarked chapter",
          "Click 'Bookmarked' button",
        ],
        expected:
          "Button reverts to 'Bookmark'. Bookmark icon outline. Chapter removed from profile bookmarks.",
      },
      {
        id: "progress-6",
        title: "Profile shows progress stats",
        steps: [
          "Complete a few chapters and take quizzes",
          "Go to /profile",
        ],
        expected:
          "Profile shows: chapters read, chapters completed, quiz attempts, average score. By-subject breakdown visible. Bookmarks listed.",
      },
    ],
  },

  // ─── STUDENT — SUPPORT ───
  {
    title: "Student — Support Tickets",
    role: "Student",
    cases: [
      {
        id: "support-1",
        title: "Submit a new support request",
        steps: [
          "Go to /support",
          "Fill in category, subject, and message",
          "Click Submit",
        ],
        expected:
          "Ticket created with number (CL-XXXX). Confirmation shown. Admin receives email notification.",
      },
      {
        id: "support-2",
        title: "Reply to existing ticket",
        steps: [
          "Go to /support",
          "Find an existing open ticket",
          "Type a reply message and send",
        ],
        expected: "Reply added to ticket thread with timestamp. Visible to admin.",
      },
      {
        id: "support-3",
        title: "Receive admin reply notification",
        steps: [
          "Wait for admin to reply to your ticket",
          "Check notifications (bell icon in header)",
        ],
        expected:
          "Notification shows admin reply. Clicking it navigates to the support page.",
      },
    ],
  },

  // ─── ADVISOR ───
  {
    title: "Advisor — Application & Onboarding",
    role: "Advisor",
    cases: [
      {
        id: "advisor-1",
        title: "Submit advisor application",
        steps: [
          "Go to /advisor",
          "Fill in name, email, phone, city, reason",
          "Click Apply",
        ],
        expected:
          "Application submitted. Status: pending. Shown in admin's Advisors tab.",
      },
      {
        id: "advisor-2",
        title: "Login after admin approval",
        steps: [
          "Wait for admin to approve application",
          "Sign in with the same email used in application",
        ],
        expected:
          "Role auto-set to 'partner'. Advisor Dashboard link visible in avatar dropdown. Referral code generated.",
      },
      {
        id: "advisor-3",
        title: "View advisor dashboard",
        steps: [
          "Login as approved advisor",
          "Go to /advisor/dashboard",
        ],
        expected:
          "Dashboard shows: referral code (with copy button), stats (Total Referrals, Total Earnings, Pending Payout, Paid Out), verification status, bank details section, referral history table.",
      },
      {
        id: "advisor-4",
        title: "Copy referral code",
        steps: [
          "On advisor dashboard",
          "Click copy button next to referral code",
        ],
        expected: "Code copied to clipboard. Confirmation shown.",
      },
      {
        id: "advisor-5",
        title: "Add/edit bank details",
        steps: [
          "On advisor dashboard, find bank details section",
          "Enter: Account Holder, Bank Name, Account No., IFSC, PAN",
          "Save",
        ],
        expected: "Bank details saved. Shown in read-only mode. Admin can see them in Advisors tab.",
      },
      {
        id: "advisor-6",
        title: "Referral code used by student",
        steps: [
          "Share referral code with a student",
          "Student subscribes using the code",
          "Check advisor dashboard",
        ],
        expected:
          "New entry in referral history. Commission amount shown as 'Pending'. Stats updated. Commission email received.",
      },
      {
        id: "advisor-7",
        title: "Email verification (resend)",
        steps: [
          "On advisor dashboard (email not verified)",
          "Click 'Resend verification email'",
          "Check inbox and click verification link",
          "Login again",
        ],
        expected:
          "Verification email received. After clicking link and re-logging in, dashboard shows 'Email: Verified'.",
      },
    ],
  },

  // ─── ADMIN — USER MANAGEMENT ───
  {
    title: "Admin — User Management",
    role: "Admin",
    cases: [
      {
        id: "admin-user-1",
        title: "View all users",
        steps: [
          "Go to /admin",
          "Click 'Users' tab",
        ],
        expected:
          "User table shows all users with: name+email (merged column), role, subscription status, extend option, delete icon.",
      },
      {
        id: "admin-user-2",
        title: "Search users",
        steps: [
          "In Users tab, type a name or email in the search box",
        ],
        expected: "Table filters to matching users in real-time.",
      },
      {
        id: "admin-user-3",
        title: "Filter by role and subscription",
        steps: [
          "Use Role dropdown (Student/Teacher/Advisor/Admin)",
          "Use Subscription dropdown (Trial/Active/Expired/None)",
        ],
        expected: "Table filters correctly. Count updates. Filters can be combined.",
      },
      {
        id: "admin-user-4",
        title: "Change user role",
        steps: [
          "Find a non-admin user",
          "Use the role dropdown to change their role",
        ],
        expected:
          "Role updated. If changed to 'partner', referral code auto-generated. Admin log created.",
      },
      {
        id: "admin-user-5",
        title: "Extend user subscription",
        steps: [
          "Find a user without active subscription",
          "Select days from dropdown (7d/15d/30d/60d/90d)",
          "Click 'Extend'",
        ],
        expected:
          "Subscription extended. Confirmation message with new end date. User gets full access.",
      },
      {
        id: "admin-user-6",
        title: "Soft delete user",
        steps: [
          "Click trash icon on a non-admin user",
          "Confirm in the modal",
        ],
        expected:
          "User disappears from active list (no page refresh needed). 'Deleted (N)' badge appears. User data preserved.",
      },
      {
        id: "admin-user-7",
        title: "View deleted users",
        steps: [
          "Click 'Deleted (N)' badge in Users header",
        ],
        expected: "Switched to deleted users view. Shows restore and permanent delete icons.",
      },
      {
        id: "admin-user-8",
        title: "Restore deleted user",
        steps: [
          "In deleted users view, click restore icon (circular arrow)",
        ],
        expected: "User restored to active list. Appears in active view again.",
      },
      {
        id: "admin-user-9",
        title: "Permanently delete user",
        steps: [
          "In deleted users view, click trash icon on a user",
          "Confirm permanent deletion in modal",
        ],
        expected:
          "User removed completely (no page refresh needed). All data deleted: progress, quiz attempts, bookmarks, notifications, subscriptions, referral codes, partner applications. Support requests anonymized.",
      },
      {
        id: "admin-user-10",
        title: "View user detail page",
        steps: [
          "Click on a user's name (blue link) in the table",
        ],
        expected:
          "User detail page shows: profile info, UID, subscription dates, payment history, quiz attempts, progress count, admin action log.",
      },
      {
        id: "admin-user-11",
        title: "Refresh users table",
        steps: [
          "Click the refresh icon in the Users table header",
        ],
        expected: "Table refreshes with latest data from server.",
      },
      {
        id: "admin-user-12",
        title: "Export users to CSV",
        steps: [
          "Click 'Export CSV' in Users header",
        ],
        expected: "CSV file downloaded with filtered user data (name, email, role, subscription, created at).",
      },
    ],
  },

  // ─── ADMIN — ADVISORS ───
  {
    title: "Admin — Advisor Management",
    role: "Admin",
    cases: [
      {
        id: "admin-adv-1",
        title: "View pending applications",
        steps: [
          "Go to /admin → Advisors tab",
          "Check 'Pending Applications' section",
        ],
        expected: "All pending advisor applications listed with name, email, phone, city, reason, date.",
      },
      {
        id: "admin-adv-2",
        title: "Approve advisor application",
        steps: [
          "Find a pending application",
          "Click 'Approve'",
        ],
        expected:
          "Application status → approved. Referral code generated (ADV-XXXXX). If user account exists, role set to 'partner'.",
      },
      {
        id: "admin-adv-3",
        title: "Reject advisor application",
        steps: [
          "Find a pending application",
          "Click 'Reject'",
        ],
        expected: "Application status → rejected. Shown in Application History.",
      },
      {
        id: "admin-adv-4",
        title: "View advisor commissions",
        steps: [
          "In Advisors tab, scroll to 'Advisor Commissions'",
          "Click on an advisor row to expand",
        ],
        expected:
          "Expanded view shows: verification status (email + phone), bank details, referral history with amounts, total pending/paid.",
      },
      {
        id: "admin-adv-5",
        title: "Verify advisor phone",
        steps: [
          "Expand an advisor in Commissions section",
          "Click 'Mark Phone Verified' toggle",
        ],
        expected: "Phone status changes to 'Verified' (green badge).",
      },
      {
        id: "admin-adv-6",
        title: "Process payout",
        steps: [
          "Expand an advisor with pending commissions",
          "Verify bank details are correct",
          "Transfer money manually (outside system)",
          "Click 'Mark Paid'",
        ],
        expected:
          "All pending commissions marked as paid. Payout record created. Payout email sent to advisor. Dashboard stats updated.",
      },
    ],
  },

  // ─── ADMIN — SUPPORT ───
  {
    title: "Admin — Support Management",
    role: "Admin",
    cases: [
      {
        id: "admin-sup-1",
        title: "View open support requests",
        steps: [
          "Go to /admin → Support tab",
          "Check open tickets",
        ],
        expected: "All open tickets listed with ticket number, user name, category, date.",
      },
      {
        id: "admin-sup-2",
        title: "Reply to a support ticket",
        steps: [
          "Find an open ticket",
          "Type a reply message",
          "Click Send",
        ],
        expected:
          "Reply added to ticket thread. User receives in-app notification. Reply visible in user's /support page.",
      },
      {
        id: "admin-sup-3",
        title: "Close a support ticket",
        steps: [
          "Reply to a ticket and mark as closed",
        ],
        expected: "Ticket status changes to 'closed'. Moves to closed filter.",
      },
      {
        id: "admin-sup-4",
        title: "Send direct notification to user",
        steps: [
          "In support section, use direct message feature",
          "Select a user and type message",
          "Send",
        ],
        expected: "User receives notification in their bell icon. Visible in notifications list.",
      },
    ],
  },

  // ─── ADMIN — CONFIGURATION ───
  {
    title: "Admin — Platform Configuration",
    role: "Admin",
    cases: [
      {
        id: "admin-cfg-1",
        title: "Update trial days",
        steps: [
          "Go to /admin → Configuration tab",
          "Change trial days value",
          "Save",
        ],
        expected: "New trial duration applies to newly created accounts. Existing trials unchanged.",
      },
      {
        id: "admin-cfg-2",
        title: "Update yearly price",
        steps: [
          "Change yearly price in INR",
          "Save",
        ],
        expected: "New price shown on /pricing page. Existing subscriptions unchanged.",
      },
      {
        id: "admin-cfg-3",
        title: "Update commission/discount percentages",
        steps: [
          "Change commission % and/or referral discount %",
          "Save",
        ],
        expected: "New percentages apply to future referral subscriptions.",
      },
      {
        id: "admin-cfg-4",
        title: "Toggle Razorpay",
        steps: [
          "Toggle Razorpay enabled/disabled",
          "Save",
        ],
        expected: "If disabled, payment button hidden on pricing page. Manual extension still works.",
      },
      {
        id: "admin-cfg-5",
        title: "Update content author permissions",
        steps: [
          "Toggle individual permissions (viewUsers, manageUsers, viewSystemFlows, etc.)",
          "Save",
        ],
        expected: "Content author's admin dashboard tabs update accordingly on next page load.",
      },
    ],
  },

  // ─── CONTENT AUTHOR ───
  {
    title: "Content Author — CMS & Dashboard",
    role: "Content Author",
    cases: [
      {
        id: "ca-1",
        title: "Access Keystatic CMS",
        steps: [
          "Go to /keystatic",
          "Sign in with GitHub (must be a repo collaborator)",
        ],
        expected: "Keystatic editor loads. Collections visible (Class 6 Science Notes, etc.).",
      },
      {
        id: "ca-2",
        title: "Create a new chapter",
        steps: [
          "In Keystatic, select a collection",
          "Click 'Create'",
          "Enter slug, title, description, order",
          "Write notes in MDX editor",
          "Click Save",
        ],
        expected:
          "Content branch created on GitHub. Chapter saved. Can be previewed after merge.",
      },
      {
        id: "ca-3",
        title: "Create worksheet with questions",
        steps: [
          "In Worksheets collection, create with same chapter slug",
          "Add topics with questions by difficulty (Easy/Medium/Hard)",
          "Add MCQ, Fill, Short, Long answer types",
          "Save",
        ],
        expected:
          "Worksheet linked to chapter. Practice buttons appear next to matching headings after deploy.",
      },
      {
        id: "ca-4",
        title: "Access admin dashboard (limited)",
        steps: [
          "Login as content author",
          "Go to /admin",
        ],
        expected:
          "Only sees tabs allowed by permissions (e.g., Users read-only, System Flows). Cannot see Configuration or Advisors unless permitted.",
      },
    ],
  },

  // ─── ACCESS CONTROL ───
  {
    title: "Access Control — All Roles",
    role: "All",
    cases: [
      {
        id: "access-1",
        title: "Anonymous user — chapter 1 & 2 fully open",
        steps: [
          "Open site without logging in",
          "Navigate to chapter 1 or 2 of any class/subject",
        ],
        expected: "Full content visible. No blur. No login prompt. Notes, discussion visible.",
      },
      {
        id: "access-1b",
        title: "Anonymous user — chapter 3+ shows login prompt",
        steps: [
          "Open site without logging in",
          "Navigate to chapter 3 or higher",
        ],
        expected: "Content blurred. 'This chapter is available with a free account' prompt shown. Sign Up Free button.",
      },
      {
        id: "access-1c",
        title: "Chapter listing shows Free/Login badges",
        steps: [
          "Open site without logging in",
          "Go to any class → subject chapter list",
        ],
        expected: "Chapter 1 & 2 show green 'Free' badge. Chapter 3+ show lock icon with 'Login' badge. All chapters listed (not hidden).",
      },
      {
        id: "access-2",
        title: "Expired user — chapter 3+ shows subscribe + extension request",
        steps: [
          "Login as user with expired trial/subscription",
          "Navigate to chapter 3+",
        ],
        expected: "Content blurred. Subscribe prompt shown. 'Need more time? Request an extension' link visible below subscribe button.",
      },
      {
        id: "access-3",
        title: "Teacher gets full access without subscription",
        steps: [
          "Login as teacher role user",
          "Navigate to any chapter",
        ],
        expected: "Full access to all content. No subscription required.",
      },
      {
        id: "access-4",
        title: "Admin-extended user gets access",
        steps: [
          "Admin extends a user's access via Users table",
          "Login as that user",
          "Navigate to any chapter",
        ],
        expected: "Full access until the extended date, regardless of trial/subscription status.",
      },
      {
        id: "access-5",
        title: "Non-admin cannot access /admin",
        steps: [
          "Login as student/teacher",
          "Navigate to /admin directly",
        ],
        expected: "Redirected away. Admin dashboard not accessible.",
      },
      {
        id: "access-6",
        title: "Non-advisor cannot access /advisor/dashboard",
        steps: [
          "Login as student",
          "Navigate to /advisor/dashboard directly",
        ],
        expected: "Redirected or access denied. Dashboard not visible.",
      },
    ],
  },

  // ─── NOTIFICATIONS ───
  {
    title: "Notifications",
    role: "All Logged-in",
    cases: [
      {
        id: "notif-1",
        title: "Notification bell shows unread count",
        steps: [
          "Receive a notification (e.g. admin reply to support ticket)",
          "Check bell icon in header",
        ],
        expected: "Bell shows unread count badge. Dropdown shows notification list.",
      },
      {
        id: "notif-2",
        title: "Mark notification as read",
        steps: [
          "Click on a notification in the dropdown",
        ],
        expected: "Notification marked as read. Unread count decreases.",
      },
      {
        id: "notif-3",
        title: "Mark all notifications as read",
        steps: [
          "Click 'Mark all as read' in notifications dropdown",
        ],
        expected: "All notifications marked as read. Badge disappears.",
      },
    ],
  },

  // ─── EMAIL TRIGGERS ───
  {
    title: "Email Triggers",
    role: "System",
    cases: [
      {
        id: "email-1",
        title: "Welcome email on first login",
        steps: [
          "Create a new account (email/password or Google)",
          "Check inbox",
        ],
        expected: "Welcome email from noreply@cognilift.in with trial info and start learning link.",
      },
      {
        id: "email-2",
        title: "Subscription confirmation email",
        steps: [
          "Complete a subscription payment",
          "Check inbox",
        ],
        expected: "Confirmation email with amount paid and subscription end date.",
      },
      {
        id: "email-3",
        title: "Commission earned email to advisor",
        steps: [
          "Student subscribes using advisor's referral code",
          "Check advisor's inbox",
        ],
        expected: "Commission earned email with student name, subscription amount, and commission amount.",
      },
      {
        id: "email-4",
        title: "Payout processed email to advisor",
        steps: [
          "Admin clicks 'Mark Paid' for an advisor's commissions",
          "Check advisor's inbox",
        ],
        expected: "Payout email with amount and date.",
      },
      {
        id: "email-5",
        title: "Admin notified on new support request",
        steps: [
          "Student submits a new support request",
          "Check admin inbox",
        ],
        expected: "Email to admin with ticket number, category, and message summary.",
      },
    ],
  },

  // ─── MOBILE RESPONSIVENESS ───
  {
    title: "Mobile Responsiveness",
    role: "All",
    cases: [
      {
        id: "mobile-1",
        title: "Header — mobile hamburger menu",
        steps: [
          "Open site on mobile (or resize browser to < 640px)",
          "Tap hamburger icon",
        ],
        expected: "Mobile menu slides open with navigation links. Avatar and logout visible.",
      },
      {
        id: "mobile-2",
        title: "Chapter page on mobile",
        steps: [
          "Open any chapter on mobile",
        ],
        expected:
          "Banner readable. Buttons (Bookmark, Mark Complete) visible. Tabs (Notes/Discussion/Worksheet) work. Content scrollable.",
      },
      {
        id: "mobile-3",
        title: "Admin user table on mobile",
        steps: [
          "Open /admin on mobile",
          "Check Users tab",
        ],
        expected: "Card-based layout (not table). User info, role selector, extend, and delete all accessible.",
      },
      {
        id: "mobile-4",
        title: "Quiz on mobile",
        steps: [
          "Start and complete a quiz on mobile",
        ],
        expected: "Questions readable. Options tappable. Score displayed properly after submission.",
      },
    ],
  },

  // ─── EDGE CASES ───
  {
    title: "Edge Cases & Error Handling",
    role: "All",
    cases: [
      {
        id: "edge-1",
        title: "Session expiry",
        steps: [
          "Login and wait for session to expire (5 days) or clear cookies",
          "Try to access a protected page",
        ],
        expected: "Redirected to login page. No error page shown.",
      },
      {
        id: "edge-2",
        title: "Access non-existent chapter",
        steps: [
          "Navigate to /class/class-6/science/non-existent-chapter",
        ],
        expected: "404 or 'Chapter not found' message. No crash.",
      },
      {
        id: "edge-3",
        title: "Double-click prevention",
        steps: [
          "Click any action button (Mark Complete, Extend, Delete) rapidly twice",
        ],
        expected: "Action fires only once. Button disabled during loading. No duplicate operations.",
      },
      {
        id: "edge-4",
        title: "Admin cannot delete themselves",
        steps: [
          "As admin, try to delete your own account",
        ],
        expected: "Error message: 'Cannot delete yourself'. Account unchanged.",
      },
      {
        id: "edge-5",
        title: "Manual complete cannot overwrite quiz-passed",
        steps: [
          "Mark a chapter as quiz-passed (score >= 80%)",
          "Try to manually unmark it via Mark Complete button",
        ],
        expected: "'Quiz Passed' badge shown. No unmark option available. API rejects if attempted.",
      },
    ],
  },
];

const STORAGE_KEY = "ada-test-results";

function loadResults(): Record<string, Status> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResults(results: Record<string, Status>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // storage full or unavailable
  }
}

export default function TestCases() {
  const [results, setResults] = useState<Record<string, Status>>({});
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [filterStatus, setFilterStatus] = useState<"all" | "untested" | "pass" | "fail" | "skip">("all");

  // Load from localStorage on mount
  useEffect(() => {
    setResults(loadResults());
  }, []);

  const totalCases = TEST_SECTIONS.reduce((sum, s) => sum + s.cases.length, 0);
  const passCount = Object.values(results).filter((r) => r === "pass").length;
  const failCount = Object.values(results).filter((r) => r === "fail").length;
  const skipCount = Object.values(results).filter((r) => r === "skip").length;
  const untestedCount = totalCases - passCount - failCount - skipCount;

  const setStatus = useCallback((id: string, status: Status) => {
    setResults((prev) => {
      const next = { ...prev };
      if (status === null) {
        delete next[id];
      } else {
        next[id] = status;
      }
      saveResults(next);
      return next;
    });
  }, []);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(TEST_SECTIONS.map((_, i) => i)));
  const collapseAll = () => setExpandedSections(new Set());
  const resetAll = () => { setResults({}); saveResults({}); };

  const filterCase = (tc: TestCase) => {
    if (filterStatus === "all") return true;
    const s = results[tc.id] ?? null;
    if (filterStatus === "untested") return s === null;
    return s === filterStatus;
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Test Progress
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-xs text-blue-500 hover:text-blue-700">
              Expand All
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={collapseAll} className="text-xs text-blue-500 hover:text-blue-700">
              Collapse All
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={resetAll} className="text-xs text-red-400 hover:text-red-600">
              Reset All
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {passCount > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(passCount / totalCases) * 100}%` }}
            />
          )}
          {failCount > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(failCount / totalCases) * 100}%` }}
            />
          )}
          {skipCount > 0 && (
            <div
              className="bg-yellow-400 transition-all"
              style={{ width: `${(skipCount / totalCases) * 100}%` }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs">
          <button
            onClick={() => setFilterStatus("all")}
            className={`font-medium ${filterStatus === "all" ? "text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
          >
            All ({totalCases})
          </button>
          <button
            onClick={() => setFilterStatus("untested")}
            className={`font-medium ${filterStatus === "untested" ? "text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
          >
            Untested ({untestedCount})
          </button>
          <button
            onClick={() => setFilterStatus("pass")}
            className={`font-medium ${filterStatus === "pass" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Pass ({passCount})
          </button>
          <button
            onClick={() => setFilterStatus("fail")}
            className={`font-medium ${filterStatus === "fail" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
          >
            Fail ({failCount})
          </button>
          <button
            onClick={() => setFilterStatus("skip")}
            className={`font-medium ${filterStatus === "skip" ? "text-yellow-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Skip ({skipCount})
          </button>
        </div>
      </div>

      {/* Test Sections */}
      {TEST_SECTIONS.map((section, sIdx) => {
        const visibleCases = section.cases.filter(filterCase);
        if (visibleCases.length === 0 && filterStatus !== "all") return null;

        const sectionPass = section.cases.filter((c) => results[c.id] === "pass").length;
        const sectionFail = section.cases.filter((c) => results[c.id] === "fail").length;
        const sectionTotal = section.cases.length;
        const isExpanded = expandedSections.has(sIdx);

        return (
          <div key={sIdx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(sIdx)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-700">{section.title}</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  {section.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {sectionFail > 0 && (
                  <span className="text-red-500 font-medium">{sectionFail} fail</span>
                )}
                <span className="text-gray-400">
                  {sectionPass}/{sectionTotal} passed
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {visibleCases.map((tc) => (
                  <TestCaseRow
                    key={tc.id}
                    testCase={tc}
                    status={results[tc.id] ?? null}
                    onStatusChange={(s) => setStatus(tc.id, s)}
                  />
                ))}
                {visibleCases.length === 0 && (
                  <div className="px-6 py-4 text-sm text-gray-400 text-center">
                    No test cases match the current filter.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TestCaseRow({
  testCase,
  status,
  onStatusChange,
}: {
  testCase: TestCase;
  status: Status;
  onStatusChange: (s: Status) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    status === "pass"
      ? "border-l-green-500"
      : status === "fail"
      ? "border-l-red-500"
      : status === "skip"
      ? "border-l-yellow-400"
      : "border-l-transparent";

  return (
    <div className={`border-l-4 ${borderColor}`}>
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left flex items-center gap-2 min-w-0"
        >
          <span className="text-xs font-mono text-gray-300 shrink-0">{testCase.id}</span>
          <span className="text-sm text-gray-700 truncate">{testCase.title}</span>
          {expanded ? (
            <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStatusChange(status === "pass" ? null : "pass")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              status === "pass" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
            }`}
            title="Pass"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={() => onStatusChange(status === "fail" ? null : "fail")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              status === "fail" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"
            }`}
            title="Fail"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => onStatusChange(status === "skip" ? null : "skip")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              status === "skip" ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600"
            }`}
            title="Skip"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-4 ml-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Steps</p>
              <ol className="space-y-1">
                {testCase.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expected Result</p>
              <p className="text-sm text-gray-600">{testCase.expected}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
