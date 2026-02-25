# User-scoped data (implemented)

This doc described how to make Templates, Reports, and Risk Detection results visible only to the account that created them. **This is now implemented** as below.

---

## 1. Know who is calling the API

Right now the backend doesn’t know “who” is making a request. Login returns `{ email, name }` and the frontend stores that in localStorage, but API calls don’t send anything the server can trust.

You need the server to know the current user on **every** request. Two common options:

- **Sessions (cookie-based)**  
  - After login, server creates a session (e.g. store `sessionId → email` in memory or DB), sets a cookie (e.g. `sessionId=...`).  
  - Every request sends the cookie; server looks up the session and gets `email`.  
  - No change to how the frontend calls APIs (cookies are sent automatically for same-origin).

- **JWT (token-based)**  
  - After login, server returns a signed JWT whose payload includes the user (e.g. `{ sub: email }`).  
  - Frontend stores the token (e.g. in memory or localStorage) and sends it on each request in a header: `Authorization: Bearer <token>`.  
  - Server has a middleware that verifies the JWT and attaches `req.user` (e.g. `req.user.email`).

Either way, the result is: **every protected API request has a “current user” (e.g. email or user id) on the server.**

---

## 2. Attach the user to each document

For any collection that should be “per user,” add a field that identifies the owner:

- **Templates** – e.g. `createdBy: "user@example.com"` (or a user id if you add one).
- **Reports** – `createdBy: "user@example.com"`.
- **ai_analysis** (NLP / risk detection results) – `createdBy: "user@example.com"`.

When **creating** a template, report, or analysis, set that field from the current user (from the session or `req.user`).  
Keep your existing `admin`/test login behaviour if you want (e.g. admin can see everything, or you treat admin like a normal user—your choice).

---

## 3. Filter reads by current user

For every **read** that should be “only my stuff”:

- **GET /api/templates** – Instead of `find({})`, use e.g. `find({ createdBy: currentUserEmail })`.
- **GET /api/reports** – Same: `find({ createdBy: currentUserEmail })`.
- **GET /api/nlp/latest** – Return the latest analysis **where** `createdBy: currentUserEmail` (and sort by `processed_at` as you do now).

Also:

- **GET /api/templates/:id** and **GET /api/reports/:id** – Load the doc, then check `createdBy === currentUserEmail` (or allow admin). If not the owner, return 404 (so users can’t see or guess others’ ids).
- **PUT/DELETE** on templates and reports – Same check: only allow if the document’s `createdBy` is the current user (or admin).

So: **all list and single-resource reads (and updates/deletes) use the current user from auth and the `createdBy` field.**

---

## 4. Optional: user id instead of email

Using email is fine. If you later add a proper **user id** (e.g. from a Users collection or an auth provider):

- Store `createdBy: userId` in Templates, Reports, ai_analysis.
- In the session or JWT, store `userId` (and optionally email for display).
- Filter and checks use `userId` instead of email. Same idea.

---

## 5. Summary

| Step | What to do |
|------|------------|
| 1 | Add auth that the server trusts on every request (sessions + cookie, or JWT + `Authorization` header). |
| 2 | Add `createdBy` (email or user id) to Templates, Reports, and ai_analysis when creating them. |
| 3 | On all GET (and PUT/DELETE) for those resources, filter or check by `createdBy === currentUser`. |
| 4 | (Optional) Use a user id instead of email for `createdBy`. |

---

## Implemented (current app)

- **Auth:** Login returns a JWT. Frontend stores it and sends `Authorization: Bearer <token>` on every API request. Server middleware verifies the JWT and sets `req.user.email`.
- **createdBy:** Every new template, report, and ai_analysis document is stored with `createdBy: req.user.email`. All list and single-resource reads filter by `createdBy: req.user.email` (or check ownership for get/update/delete by id).
- **MongoDB:** No new collections. The existing **Templates**, **Reports**, and **ai_analysis** collections now have a `createdBy` field on new documents. **Existing documents that don’t have `createdBy` will not show up for any user** (they’re effectively hidden). To show old data to a specific user, you can run a one-time update in MongoDB to set e.g. `createdBy: "admin"` (or the desired email) on those documents.
