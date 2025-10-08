---
description: Navigate to the next incomplete task in MASTER_PLAN.md or strategy documents
---

Read MASTER_PLAN.md and identify the next incomplete task based on the following rules:

1. **Priority Order:**
   - First, check for any task marked `[~]` IN PROGRESS - continue with that task
   - If no in-progress tasks, find the first `[ ]` TODO task in sequential order
   - Skip any `[x]` COMPLETED, `[-]` SKIPPED, or `[!]` BLOCKED tasks

2. **Sequential Navigation:**
   - Start from the current phase (check "Current Phase" section)
   - Within a phase, follow sub-sections in order (1.1 → 1.2 → 1.3, etc.)
   - Within a sub-section, follow tasks top to bottom
   - When a sub-section is complete, move to the next sub-section
   - When a phase is complete, move to the next phase

3. **Context Awareness:**
   - If a task has "Dependencies:" listed, check those are completed first
   - If dependencies are not met, mark as `[!]` BLOCKED and explain why
   - If a task references another document (e.g., "Reference: TESTING_STRATEGY.md §3.1"), read that section for additional context

4. **Output Format:**
   Present the next task with:
   - **Phase:** [Phase number and name]
   - **Section:** [Sub-section number and name]
   - **Task:** [Exact task description]
   - **Complexity:** [Simple/Moderate/Complex]
   - **Dependencies:** [List any dependencies]
   - **Reference:** [Link to detailed documentation if applicable]
   - **Action:** [What needs to be done]
   - **Checklist:** [Show the specific sub-tasks for this item]

5. **Special Cases:**
   - If all tasks in current phase are complete, congratulate and show phase completion checklist
   - If MASTER_PLAN.md references TESTING_STRATEGY.md or IMPROVEMENT_STRATEGY.md, follow links to those documents for details
   - If you encounter a `[!]` BLOCKED task, explain the blocker and suggest how to resolve it

6. **After Presenting:**
   - Ask: "Would you like me to start working on this task?"
   - Do NOT start work automatically - wait for confirmation

Example output:

```
📍 Next Task

**Phase:** Phase 1: Testing Infrastructure
**Section:** 1.1 Setup Testing Infrastructure
**Task:** Install testing dependencies
**Complexity:** Moderate
**Dependencies:** None

**Action:**
Install the required testing packages for Vitest, React Testing Library, and Playwright.

**Checklist:**
- [ ] Install testing dependencies
- [ ] Create vitest.config.ts
- [ ] Create vitest.setup.ts
- [ ] Create playwright.config.ts
- [ ] Create folder structure
- [ ] Add test scripts to package.json
- [ ] Create test utilities
- [ ] Create mock data
- [ ] Create MSW handlers
- [ ] Verify basic test runs successfully

**Reference:** TESTING_STRATEGY.md §2.1

Would you like me to start working on this task?
```
