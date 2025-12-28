import { ok, err, Result as NeverThrowResult } from "neverthrow";
import { EmailValidationError, PasswordValidationError, AgeValidationError } from "./errors.js";
import {
  validateEmail_NeverThrow,
  validateAge_NeverThrow,
  validatePassword_NeverThrow,
  type UserPayload,
} from "./neverthrow.js";

export type ValidationIssue = {
  field: string;
  message: string;
};

export function processUserInput(
  email: string,
  password: string,
  age: number
): NeverThrowResult<
  UserPayload,
  EmailValidationError | PasswordValidationError | AgeValidationError
> {
  console.log("\n--- 5.1: Errors Flow Through the Pipeline ---");

  const emailResult = validateEmail_NeverThrow(email);
  const passwordResult = validatePassword_NeverThrow(password);
  const ageResult = validateAge_NeverThrow(age);

  return emailResult
    .andThen((validEmail) =>
      validatePassword_NeverThrow(password).map((validPassword) => ({
        email: validEmail,
        password: validPassword,
        age,
      }))
    )
    .andThen((partial) =>
      ageResult.map((validAge) => ({
        ...partial,
        age: validAge,
      }))
    );
}

export type ApiError = {
  code: string;
  timestamp: Date;
};

function validateEmail_ForApi(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  if (!email.includes("@")) {
    return err(new EmailValidationError("Missing @ symbol"));
  }
  return ok(email.toLowerCase().trim());
}

function convertToApiError(error: EmailValidationError): ApiError {
  return {
    code: "VALIDATION_ERROR",
    timestamp: new Date(),
  };
}

export function validateAndFormatError(
  email: string
): NeverThrowResult<string, ApiError> {
  console.log("\n--- 5.2: Transform Errors with mapErr ---");

  return validateEmail_ForApi(email).mapErr(convertToApiError);
}

function validateEmail_Collect(
  email: string
): NeverThrowResult<string, ValidationIssue> {
  if (!email.includes("@")) {
    return err({ field: "email", message: "Missing @ symbol" });
  }
  if (!email.includes(".")) {
    return err({ field: "email", message: "Missing domain" });
  }
  return ok(email.toLowerCase().trim());
}

function validatePassword_Collect(
  password: string
): NeverThrowResult<string, ValidationIssue> {
  if (password.length < 8) {
    return err({ field: "password", message: "Too short" });
  }
  return ok(password);
}

export function validateAll_Collect(
  email: string,
  password: string
): NeverThrowResult<{ email: string; password: string }, ValidationIssue[]> {
  console.log("\n--- 5.3: Collect Multiple Errors ---");

  const emailResult = validateEmail_Collect(email);
  const passwordResult = validatePassword_Collect(password);

  if (emailResult.isErr()) {
    const issues: ValidationIssue[] = [emailResult.error];
    if (passwordResult.isErr()) {
      issues.push(passwordResult.error);
    }
    return err(issues);
  }

  if (passwordResult.isErr()) {
    return err([passwordResult.error]);
  }

  return ok({
    email: emailResult.value,
    password: passwordResult.value,
  });
}

function logError<E extends Error>(error: E): void {
  console.error(`[ERROR ${error.name}] ${error.message}`);
}

export function validateAndLog(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.4: Pass Errors to Functions ---");

  const result = validateEmail_NeverThrow(email);

  if (result.isErr()) {
    logError(result.error);
    return result;
  }

  return result;
}

type ErrorLogEntry = {
  timestamp: Date;
  error: Error;
};

const errorLog: ErrorLogEntry[] = [];

export function validateAndRecord(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.5: Store Errors in Data Structures ---");

  const result = validateEmail_NeverThrow(email);

  if (result.isErr()) {
    errorLog.push({
      timestamp: new Date(),
      error: result.error,
    });
    return result;
  }

  return result;
}

export function validateWithFallback(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.6: Error Recovery without Try-Catch ---");

  const result = validateEmail_NeverThrow(email);

  if (result.isErr()) {
    console.log("  -> Received error as value:", result.error.message);

    if (result.error.message.includes("Missing @")) {
      console.log("  -> Attempting recovery with default...");
      const recovered = ok("user@default.com");
      console.log("  -> Recovered to:", recovered.value);
      return recovered;
    }

    return result;
  }

  console.log("  -> No error, returning valid email:", result.value);
  return result;
}

export function validateWithConditionalHandling(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.7: Conditional Handling Based on Error Type ---");

  const emailResult = validateEmail_NeverThrow(email);

  if (emailResult.isErr()) {
    const error = emailResult.error;

    if (error.message.includes("domain")) {
      console.log("  -> Suggesting common domains...");
      return ok("user@gmail.com");
    }

    console.log("  -> Returning original error");
    return emailResult;
  }

  console.log("  -> Email valid, no error to handle");
  return emailResult;
}

export function runErrorsAsValues() {
  console.log("\n=== ERRORS AS VALUES ===");
  errorLog.length = 0;

  const pipelineResult = processUserInput(
    "test@example.com",
    "SecurePass123",
    25
  );
  if (pipelineResult.isOk()) {
    console.log("Pipeline success:", pipelineResult.value);
  } else {
    console.log("Pipeline error:", pipelineResult.error.message);
  }

  const mappedError = validateAndFormatError("invalid");
  if (mappedError.isOk()) {
    console.log("Mapped success:", mappedError.value);
  } else {
    console.log("Mapped error:", mappedError.error);
  }

  const collectedErrors = validateAll_Collect("invalid", "short");
  if (collectedErrors.isOk()) {
    console.log("Collected success:", collectedErrors.value);
  } else {
    console.log("Collected errors:", collectedErrors.error);
  }

  validateAndLog("invalid");

  validateAndRecord("invalid");
  validateAndRecord("another-invalid");
  console.log("Error log size:", errorLog.length, "entries");

  validateWithFallback("invalid");

  validateWithConditionalHandling("user@example.com");
}
