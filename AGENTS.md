# Agent Instructions & Architectural Guidelines

This project follows a strict Clean Architecture paradigm. All AI agents and developers contributing to this codebase must adhere to the following rules:

## 1. Architectural Boundaries
- **Business logic belongs ONLY in services:** Do not put validation logic, complex branching, or email triggering in controllers or models. Services are the only place for business rules.
- **Database operations belong ONLY in repositories:** Do not import Mongoose models into controllers or services. Services must call repository methods (e.g., `RegistrationRepository.scanCheckpoint()`).
- **Controllers must remain thin:** Controllers should only parse HTTP requests, validate DTOs, call the appropriate service method, and format the HTTP response.

## 2. File and Module Structure
- **One responsibility per file:** A file should export a single class or a focused set of related utility functions.

- **Never modify unrelated files:** When adding a new feature, do not make arbitrary formatting changes or unrelated tweaks to existing files.

## 3. Code Reuse & Extension
- **Prefer extending existing modules:** If a similar functionality exists, extend it. Do not create parallel infrastructures.
- **Follow existing interfaces before creating new ones:** Ensure you are following established naming conventions (e.g., `ModelNameRepository`, `FeatureService`) and method signatures.
- **Never duplicate business logic:** If two services need the same logic, extract it into a shared utility or a dedicated domain service.
- **Use dependency injection where possible:** Pass dependencies (like repositories or mailers) into services rather than hardcoding them, allowing for easier unit testing and modularity.
