# API documentation (OpenAPI / Postman)

This folder contains **OpenAPI 3.0** JSON specs for the School Management API. You can use them in **Postman**, Swagger UI, or any tool that supports OpenAPI import.

---

## Generating the docs

From the **backend** directory:

```bash
npm run generate:openapi
```

This will:

1. Build the OpenAPI spec from your NestJS app (requires the app to bootstrap; ensure your DB is reachable if needed).
2. Write JSON files into this `docs/` folder.
3. Run Prettier on the generated files.

**Optional:** set the base URL used in the spec (for Postman’s base URL):

```bash
OPENAPI_SERVER_URL=http://localhost:5000 npm run generate:openapi
```

Default is `http://localhost:3000` if not set.

---

## Importing into Postman

### Option A: One collection (recommended)

Import **only** the combined spec:

- **File:** `docs/openapi.json`

Steps:

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop **`openapi.json`** or click **Upload Files** and select it.
4. Leave the default import options and click **Import**.

You get **one** collection named **“School Management OpenAPI 3.0”** with folders for each tag (e.g. super/system admin, school, Teacher, Student, file upload endpoints, Admissions, reminders).

---

### Option B: Multiple collections (one per module)

You can import **individual** JSON files (e.g. `teacher.json`, `student.json`, `school-admin.json`). Each file becomes its **own** Postman collection with a distinct name, for example:

- **School Management - Teacher**
- **School Management - Student**
- **School Management - school Admin**
- etc.

Steps:

1. Open **Postman**.
2. Click **Import**.
3. Select one or more JSON files from `docs/` (e.g. `teacher.json`, `student.json`).
4. Click **Import**.

Repeat or add more files later as needed. Each collection name is derived from the spec title (e.g. “School Management - Teacher”).

---

## After import

- **Base URL:** Requests use the server URL from the spec (e.g. `http://localhost:3000`). You can override it in Postman:
  - **Collection** → **Variables** → set `baseUrl` (or the variable your spec uses), e.g. `http://localhost:5000`.
- **Auth:** Endpoints that need a JWT use **Bearer Token**. In Postman:
  - **Collection** → **Authorization** → Type: **Bearer Token** → paste your token.
  - Or set an **Authorization** header per request.

---

## Files in this folder

| File | Description |
|------|-------------|
| `openapi.json` | **Combined** spec: all endpoints and tags in one file. Use this for a single Postman collection. |
| `teacher.json`, `student.json`, `school-admin.json`, etc. | **Per-tag** specs: one file per API group. Use these for separate Postman collections. |

Grouping follows the tags defined in the code (e.g. `@ApiTags('Teacher')`). Regenerate with `npm run generate:openapi` after adding or changing controllers or tags.
