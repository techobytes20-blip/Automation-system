# System Workflow & Data Flow

## 1. Complete System Workflow

This diagram illustrates the chronological execution flow from the Cron Trigger to the registration logic for a 2-Day Workshop.

```mermaid
graph TD
    A[Cron Job / Manual Sync] -->|Starts| B(Fetch Google Sheet)
    B -->|Returns Rows| C{Loop over Rows}
    C -->|Row N| D(Validate Row Data)
    D -->|Invalid| E[Skip & Log Error]
    D -->|Valid| F{Student Exists?}
    F -->|No| G[Create Student ID]
    F -->|Yes| H[Reuse Student ID]
    G --> I(Registration Process)
    H --> I
    I -->|Check if already registered| J{Already Registered?}
    J -->|Yes| K[Skip & Reuse Existing Token]
    J -->|No| L[Generate Cryptographic Token]
    L --> M[Generate QR Code URL]
    M --> N[Save Registration Atomically]
    N --> O[Log Sync Success]
    K --> O
```

## 2. Checkpoint Scanning & Mail Automation Workflow

The attendance flow is split across specific checkpoints: Day 1, Day 2, and Certificate Collection.

```mermaid
graph TD
    S[Scanner / Admin App] -->|Scans QR Code| T(POST /api/v1/attendance/scan)
    T --> U{Which Checkpoint?}
    U -->|Day 1| V[Atomic Update: day1.scannedAt]
    U -->|Day 2| W[Atomic Update: day2.scannedAt]
    U -->|Certificate| X[Atomic Update: certificateCollected.scannedAt]

    W -->|Success| Y{Is Day 1 Present?}
    Y -->|Yes| Z[Set certificateEligible = true]
    Z --> AA(Trigger Mail Service)
    AA --> AB[Send Thank You Mail]
    AB --> AC[Set thankYouMailSent = true]
    Y -->|No| AD[Mark Day 2 Only, Not Eligible Yet]
```

## 3. Data Flow Between Modules

- **Cron Module (`cron/sheet-sync.cron.js`)**: Triggers the `SheetSyncService` on a defined schedule. Passes zero business logic.
- **Service Layer (`services/sheet-sync.service.js`)**: Orchestrates the sync. Uses the `GoogleSheetsProvider` to pull data. Iterates rows.
- **Service Layer (`services/registration.service.js`)**: Receives validated rows. Calls `StudentRepository.upsert()` to handle identity. Calls `TokenUtil` for tokens. Calls `RegistrationRepository.create()`.
- **Controller Layer (`controllers/attendance.controller.js`)**: Receives the scan token from the admin app. Validates scanner's JWT. Calls `AttendanceService.scan(token, checkpoint)`.
- **Service Layer (`services/attendance.service.js`)**: Passes the token to `RegistrationRepository.scanCheckpoint()`. If Day 2 completes eligibility, enqueues `MailService.sendThankYouMail()`.
- **Repository Layer (`repositories/registration.repository.js`)**: Executes atomic Mongoose `findOneAndUpdate` operations to prevent duplicate scans. Returns the updated document or null.
