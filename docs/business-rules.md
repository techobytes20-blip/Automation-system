# Business Rules

## 1. Student Validation Rules
- **Email:** Must be present, properly formatted, and serves as the primary unique identifier.
- **Name:** Must be present. If missing, the row sync must skip and log an error.
- **Sanitization:** All string inputs from the Google Sheet must be trimmed and sanitized before processing.

## 2. Registration Rules
- A single student (identified by `studentId`) can only be registered **once** per `eventId`.
- Duplicate Google Sheet rows containing the same email for the same event must be gracefully ignored.
- A registration requires a cryptographically generated `token` that maps to the QR code.

## 3. QR Generation Rules
- **Format:** The QR code payload must ONLY be the unique, high-entropy `token` string (e.g., UUIDv4 or a secure hex string). It must NOT contain personally identifiable information (PII) like names or emails.
- **Complexity:** The token must be long and random enough to prevent brute-force enumeration.
- **Distribution:** QR codes should be pre-generated as URLs (e.g., pointing to an S3 bucket or dynamic generation endpoint) and stored in the `qrCodeUrl` field.

## 4. Attendance Rules
- **Authentication:** Only authenticated administrative accounts (`role: admin` or `role: scanner`) can hit the scanning endpoint.
- **Checkpoints:** The workflow is strictly divided into three distinct checkpoints: `day1`, `day2`, and `certificateCollected`.
- **Certificate Eligibility:** 
  - A student is flagged as `certificateEligible = true` **if and only if** both `day1.scannedAt` AND `day2.scannedAt` exist on their registration document.
  - The `certificateCollected` checkpoint can only be successfully scanned if `certificateEligible == true`.

## 5. Duplicate Scan Handling
- **Atomicity:** All scan checks and updates must occur via a single atomic database operation (e.g., `findOneAndUpdate` in Mongoose).
- **Prevention:** The database query must enforce that the specific checkpoint being scanned is currently `null` or missing (`$exists: false`).
- **Response:** If the database operation modifies 0 documents, the service will verify if the registration exists. If it exists but wasn't modified, the system will return a `409 Conflict` (Duplicate Scan Error) along with the timestamp of the original scan to alert the admin.

## 6. Error Handling Rules
- **Google Sheet Sync:** If the Google Sheet API fails or rate limits, the system must retry. Individual row validation failures must not crash the sync loop; instead, they are appended to the `sync_logs` errors array.
- **Scanning Failures:** Invalid tokens must return a clear `404 Not Found` or `400 Bad Request` to prevent scanner confusion.
- **Mail Automation:** If sending the Thank You email fails upon Day 2 completion, the error must be logged, and `thankYouMailSent` remains `false`. A background job can retry sending failed emails based on this flag.
