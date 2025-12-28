import { ok, err, Result as NeverThrowResult } from "neverthrow";

export class EmailValidationError extends Error {
  constructor(message: string) {
    super(`Email validation failed: ${message}`);
    this.name = "EmailValidationError";
  }
}

export class PasswordValidationError extends Error {
  constructor(message: string) {
    super(`Password validation failed: ${message}`);
    this.name = "PasswordValidationError";
  }
}

export class AgeValidationError extends Error {
  constructor(message: string) {
    super(`Age validation failed: ${message}`);
    this.name = "AgeValidationError";
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "DuplicateEmailError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(`Database error: ${message}`);
    this.name = "DatabaseError";
  }
}

export function runErrors() {
  console.log("Error classes loaded:");
  console.log("  - EmailValidationError");
  console.log("  - PasswordValidationError");
  console.log("  - AgeValidationError");
  console.log("  - DuplicateEmailError");
  console.log("  - DatabaseError");
}
