Build a full-stack AI-powered web application called “Smart Lecture Notes” that helps students convert messy lecture notes into structured, revision-friendly notes.

---

# 🎯 CORE PROBLEM
Students write unorganized notes during lectures (often in Hinglish or mixed language). Later, they struggle to revise. This system should allow users to write raw notes quickly and then convert them into clean, structured notes using AI.

---

# 🧩 CORE FEATURES

## 1. Authentication
- Implement Google OAuth login
- Use Firebase Auth or Passport.js (Google Strategy)
- Store user in database with:
  - name
  - email
  - profile picture
  - userId

---

## 2. Data Model (MongoDB)

Design the database with the following schema:

User:
- _id
- name
- email
- avatar

Subject:
- _id
- name
- userId (reference to User)
- createdAt

Lecture:
- _id
- subjectId (reference to Subject)
- lectureNumber (integer)
- rawNotes (text)
- processedNotes (text or JSON structured)
- createdAt
- updatedAt

---

## 3. Subject Management
- User can:
  - Create subject
  - View all subjects
  - Delete subject
- UI should display subjects as cards

---

## 4. Lecture Creation
- When creating a subject, ask:
  “How many lectures do you want to create?”
- Automatically generate N lecture entries in DB
- Each lecture should be editable individually

---

## 5. Raw Notes Editor
- Each lecture has a rich text editor (or textarea initially)
- User writes:
  - messy notes
  - Hinglish content
  - shorthand
- Allow inline AI instructions using:
  // command format

Example:
binary tree traversal // convert into table
recursion concept // simplify

---

## 6. AI Processing Feature (MOST IMPORTANT)

When user clicks “Process Notes”:

Send rawNotes to AI API (OpenAI / Gemini)

AI must:
1. Understand context 
2. Organize notes into structured format without changing notes just structure it


---

## 8. Special AI Command Parsing

Before sending to AI:
- Parse lines containing "//"

Examples:
- "// make table" → convert previous content into table
- "// simplify" → simplify explanation
- "// exam points" → highlight key points

Pass these instructions explicitly in prompt.

---

## 9. Processed Notes View
- Display structured notes cleanly:
  - headings
  - bullet points
  - sections
- Allow toggling between:
  - Raw Notes
  - Processed Notes

---

## 10. Revision Mode (IMPORTANT FEATURE)
- Show only:
  - key points
  - important notes
- Hide explanations

---

## 11. Search Functionality
- Search across:
  - subjects
  - lectures
  - processed notes

---

## 12. Save & Update
- After AI processing:
  - Store processedNotes in DB
- Allow user to reprocess notes

---

# ⚙️ TECH STACK

Frontend:
- React.js (Vite)
- Tailwind CSS
- React Router

Backend:
- Node.js
- Express.js

Database:
- MongoDB (Mongoose)

Authentication:
- Google OAuth (Firebase or Passport.js)

AI Integration:
- OpenAI API OR Google Gemini API

---

# 🔌 API DESIGN

Auth:
- POST /auth/google

Subjects:
- POST /subjects
- GET /subjects
- DELETE /subjects/:id

Lectures:
- POST /lectures/bulk-create
- GET /lectures/:subjectId
- PUT /lectures/:id (save raw notes)
- POST /lectures/:id/process (AI processing)

---

# 🎨 UI REQUIREMENTS

Pages:
1. Dashboard (Subjects)
2. Lectures List
3. Notes Editor Page

Design:
- Clean, minimal
- Focus on readability
- Dark mode optional

---

# 🧠 AI PROMPT (IMPORTANT)

When sending to AI, use:

Convert the following messy student notes into clean, structured study notes.

Rules:
- Convert Hinglish into proper English
- Keep the meaning intact
- Return properly formatted notes using headings, subheadings, and bullet points
- Format like class notes (easy to read, clean structure)
- Use:
  - # for main headings
  - ## for subheadings
  - bullet points for key concepts
  - code blocks where needed
- Preserve technical terms correctly

Special Instructions:
- If user writes "// make table" → convert relevant content into a table
- If user writes "// simplify" → simplify explanation
- If user writes "// exam points" → highlight important points

Output should look like well-written notes (not data format, not JSON).

---

# 🚀 ADVANCED (OPTIONAL)

- Generate flashcards from notes
- Export notes as PDF
- Add tags per lecture
- Add autosave

---

# 📌 GOAL

The final product should:
- Help students revise faster
- Reduce cognitive load
- Provide structured learning material instantly
- Demonstrate strong full-stack + AI integration skills# smart_notes
