// ============================================================================
// ERROR HANDLING DEMO: Why Try-Catch Sucks & How NeverThrow Fixes It
// ============================================================================
//
// Run with: pnpm exec ts-node error-handling-demo.ts
// Install deps: pnpm add neverthrow
//
// This demo uses a USER REGISTRATION VALIDATION workflow to show:
// 1. Problems with standard try-catch
// 2. Manual Result type pattern
// 3. NeverThrow library solution
// 4. ERRORS AS VALUES - the core insight behind Result types
// ============================================================================

import { ok, err, Result as NeverThrowResult } from "neverthrow";

// ============================================================================
// SECTION 1: CUSTOM ERROR TYPES (Domain-specific errors)
// ============================================================================

class EmailValidationError extends Error {
  constructor(message: string) {
    super(`Email validation failed: ${message}`);
    this.name = "EmailValidationError";
  }
}

class PasswordValidationError extends Error {
  constructor(message: string) {
    super(`Password validation failed: ${message}`);
    this.name = "PasswordValidationError";
  }
}

class AgeValidationError extends Error {
  constructor(message: string) {
    super(`Age validation failed: ${message}`);
    this.name = "AgeValidationError";
  }
}

class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "DuplicateEmailError";
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(`Database error: ${message}`);
    this.name = "DatabaseError";
  }
}

// ============================================================================
// SECTION 2: WHY TRY-CATCH SUCKS - Problem Demonstrations
// ============================================================================

// ----------------------------------------------------------------------------
// PROBLEM 1: "This Can Throw But We Don't Know Where"
// ----------------------------------------------------------------------------
// Each validation function CAN throw, but callers have NO idea:
// - WHICH validation failed
// - WHAT the error type is
// - HOW to handle it appropriately
// ----------------------------------------------------------------------------

function validateEmail_FP1(email: string): string {
  if (!email.includes("@")) throw new EmailValidationError("Missing @ symbol");
  if (!email.includes(".")) throw new EmailValidationError("Missing domain");
  return email.toLowerCase().trim();
}

function validatePassword_FP1(password: string): string {
  if (password.length < 8) throw new PasswordValidationError("Too short");
  if (!/[A-Z]/.test(password))
    throw new PasswordValidationError("Missing uppercase");
  if (!/[0-9]/.test(password))
    throw new PasswordValidationError("Missing number");
  return password;
}

function validateAge_FP1(age: number): number {
  if (age < 13) throw new AgeValidationError("Must be 13 or older");
  if (age > 120) throw new AgeValidationError("Invalid age");
  return age;
}

// SIMULATED DATABASE CALL (throws for demo)
function saveUserToDatabase_FP1(user: {
  email: string;
  password: string;
  age: number;
}): string {
  if (user.email.includes("admin")) throw new DatabaseError("Email reserved");
  return "user-123";
}

// THE PROBLEM: Blind try-catch - we catch everything, understand nothing
async function registerUser_TryCatch(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- PROBLEM 1: Blind Try-Catch ---");

  try {
    // All validations AND save inside try block
    // Each can throw, but we catch everything together
    const validEmail = validateEmail_FP1(email); // Might throw!
    const validPassword = validatePassword_FP1(password); // Might throw!
    const validAge = validateAge_FP1(age); // Might throw!

    const userId = saveUserToDatabase_FP1({
      email: validEmail,
      password: validPassword,
      age: validAge,
    });
    return { success: true, userId };
  } catch (error) {
    // ERROR IS `unknown` TYPE - no type safety!
    // We don't know WHICH operation failed
    // We don't know the error structure
    // We can't handle specific errors appropriately

    console.log("Caught error, but...");
    console.log("  - Type:", typeof error); // object (always)
    console.log("  - Name:", (error as any)?.name); // Type assertion - DANGEROUS
    console.log("  - Message:", (error as any)?.message); // Might not exist!

    // We "handled" it, but we didn't really
    return { success: false, error: "Something failed" };
  }
}

// ----------------------------------------------------------------------------
// PROBLEM 2: "We Handled It But What IS The Error?" - Type Assertion Trap
// ----------------------------------------------------------------------------

function parseUserInput_FP2(input: string): { name: string; age: number } {
  // JSON.parse can throw for MANY reasons
  // But we "handle" it with a dangerous type assertion
  try {
    return JSON.parse(input);
  } catch (error) {
    // DANGEROUS TYPE ASSERTION TRAP!
    // We assert error is an Error, but what if it's not?
    const e = error as Error;

    // This might crash if error wasn't actually an Error object
    console.log("Error message:", e.message); // Could fail!

    // We're lying to TypeScript - the error is NOT guaranteed to be Error
    // TypeScript can't help us catch this mistake
    return { name: "default", age: 0 };
  }
}

// BETTER but still problematic - using unknown
function parseUserInput_Unknown(input: string): { name: string; age: number } {
  try {
    return JSON.parse(input);
  } catch (error: unknown) {
    // We use `unknown` (correct!) but then...
    // Still have no idea what properties it has!
    if (error instanceof Error) {
      console.log("Known error:", error.message);
    } else {
      // What now? The error could be anything
      console.log("Unknown error type:", error);
    }
    return { name: "default", age: 0 };
  }
}

// ----------------------------------------------------------------------------
// PROBLEM 3: "The Nested Horror" - Multiple Validations = Pain
// ----------------------------------------------------------------------------

// To handle errors SPECIFICALLY, we need nested try-catch blocks
// This is what people do to "handle" different error types
async function registerUser_Nested(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- PROBLEM 3: Nested Try-Catch Hell ---");

  try {
    try {
      try {
        const validEmail = validateEmail_FP1(email);
        console.log("Email OK:", validEmail);
      } catch (error) {
        if (error instanceof EmailValidationError) {
          console.log("Handle email error:", error.message);
          throw error; // Re-throw to outer handler
        }
      }
    } catch (error) {
      try {
        const validPassword = validatePassword_FP1(password);
        console.log("Password OK:", validPassword);
      } catch (error) {
        if (error instanceof PasswordValidationError) {
          console.log("Handle password error:", error.message);
          throw error;
        }
      }
    }
  } catch (error) {
    console.log("Final error handler - still unclear what went wrong");
  }
}

// ============================================================================
// SECTION 3: CUSTOM RESULT TYPE (Manual Implementation)
// ============================================================================

// This shows the Result pattern conceptually
// Real-world: just use neverthrow instead!
// NOTE: Simplified implementation to avoid complex type issues

type CustomResult<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function makeOk<T, E>(value: T): CustomResult<T, E> {
  return { ok: true, value };
}

function makeErr<T, E>(error: E): CustomResult<T, E> {
  return { ok: false, error };
}

function isOk<T, E>(
  result: CustomResult<T, E>
): result is { ok: true; value: T } {
  return result.ok;
}

function isErr<T, E>(
  result: CustomResult<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

// Refactored validation with custom Result type
function validateEmail_Result(
  email: string
): CustomResult<string, EmailValidationError> {
  if (!email.includes("@")) {
    return makeErr(new EmailValidationError("Missing @ symbol"));
  }
  if (!email.includes(".")) {
    return makeErr(new EmailValidationError("Missing domain"));
  }
  return makeOk(email.toLowerCase().trim());
}

function validatePassword_Result(
  password: string
): CustomResult<string, PasswordValidationError> {
  if (password.length < 8) {
    return makeErr(new PasswordValidationError("Too short"));
  }
  return makeOk(password);
}

// ============================================================================
// SECTION 4: NEVERTHROW SOLUTION - The Right Way
// ============================================================================

// ----------------------------------------------------------------------------
// 4.1: Basic Result Creation
// ----------------------------------------------------------------------------

function validateEmail_NeverThrow(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  if (!email.includes("@")) {
    return err(new EmailValidationError("Missing @ symbol"));
  }
  if (!email.includes(".")) {
    return err(new EmailValidationError("Missing domain"));
  }
  return ok(email.toLowerCase().trim());
}

function validatePassword_NeverThrow(
  password: string
): NeverThrowResult<string, PasswordValidationError> {
  if (password.length < 8) {
    return err(new PasswordValidationError("Too short"));
  }
  if (!/[A-Z]/.test(password)) {
    return err(new PasswordValidationError("Missing uppercase"));
  }
  if (!/[0-9]/.test(password)) {
    return err(new PasswordValidationError("Missing number"));
  }
  return ok(password);
}

function validateAge_NeverThrow(
  age: number
): NeverThrowResult<number, AgeValidationError> {
  if (age < 13) {
    return err(new AgeValidationError("Must be 13 or older"));
  }
  if (age > 120) {
    return err(new AgeValidationError("Invalid age"));
  }
  return ok(age);
}

// ----------------------------------------------------------------------------
// 4.2: Pattern Matching with match()
// ----------------------------------------------------------------------------

function handleRegistration_NeverThrow(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- 4.2: Pattern Matching with match() ---");

  const emailResult = validateEmail_NeverThrow(email);
  const passwordResult = validatePassword_NeverThrow(password);
  const ageResult = validateAge_NeverThrow(age);

  // match() forces us to handle BOTH cases
  // TypeScript ensures exhaustiveness!
  emailResult.match(
    (validEmail) => {
      console.log("✓ Email valid:", validEmail);
    },
    (error) => {
      console.log("✗ Email error:", error.message);
    }
  );

  passwordResult.match(
    (validPassword) => console.log("✓ Password valid"),
    (error) => console.log("✗ Password error:", error.message)
  );

  ageResult.match(
    (validAge) => console.log("✓ Age valid:", validAge),
    (error) => console.log("✗ Age error:", error.message)
  );
}

// ----------------------------------------------------------------------------
// 4.3: Chaining with andThen() - No Nesting!
// ----------------------------------------------------------------------------

type UserPayload = {
  email: string;
  password: string;
  age: number;
};

function createUserPayload(
  email: string,
  password: string,
  age: number
): NeverThrowResult<
  UserPayload,
  EmailValidationError | PasswordValidationError | AgeValidationError
> {
  console.log("\n--- 4.3: Chaining with andThen() ---");

  // Chain validations - clean, flat, readable!
  return validateEmail_NeverThrow(email)
    .andThen((validEmail) =>
      validatePassword_NeverThrow(password).map((validPassword) => ({
        email: validEmail,
        password: validPassword,
        age,
      }))
    )
    .andThen((partial) =>
      validateAge_NeverThrow(partial.age).map((validAge) => ({
        ...partial,
        age: validAge,
      }))
    );
}

// ----------------------------------------------------------------------------
// 4.4: Async with ResultAsync
// ----------------------------------------------------------------------------

// Simulated async database check
async function checkEmailExists(email: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return email.includes("existing");
}

async function findUserByEmail(
  email: string
): Promise<NeverThrowResult<string, DuplicateEmailError>> {
  const exists = await checkEmailExists(email);
  if (exists) {
    return err(new DuplicateEmailError(email));
  }
  return ok(email);
}

async function registerUser_NeverThrow(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- 4.4: Async with ResultAsync ---");

  // Combine sync validation with async database check
  const payloadResult = createUserPayload(email, password, age);
  if (payloadResult.isErr()) {
    console.log("✗ Registration failed:", payloadResult.error.message);
    return;
  }

  const dbCheck = await findUserByEmail(payloadResult.value.email);
  if (dbCheck.isErr()) {
    console.log("✗ Registration failed:", dbCheck.error.message);
    return;
  }

  const payload = payloadResult.value;
  console.log("✓ All validations passed");
  console.log("  User payload:", payload);
  console.log("✓ Registration successful:", payload.email);
}

// ----------------------------------------------------------------------------
// 4.5: Error Recovery with orElse()
// ----------------------------------------------------------------------------

function validateWithDefaults(
  email: string,
  age: number
): NeverThrowResult<
  { email: string; age: number },
  EmailValidationError | AgeValidationError
> {
  console.log("\n--- 4.5: Error Recovery with orElse() ---");

  const emailResult = validateEmail_NeverThrow(email);
  if (emailResult.isErr()) {
    console.log("Recovering from email error:", emailResult.error.message);
  }

  const validEmail = emailResult.isOk()
    ? emailResult.value
    : "default@example.com";

  const ageResult = validateAge_NeverThrow(age);
  const validAge = ageResult.isOk() ? ageResult.value : 25;

  return ok({ email: validEmail, age: validAge });
}

// ============================================================================
// SECTION 5: ERRORS AS VALUES - The Key Insight
// ============================================================================
//
// ERRORS AS VALUES is the core idea behind Result types.
//
// Instead of throwing exceptions (which jump control flow),
// we return errors as regular values that flow through the program.
//
// This means:
// - Errors can be mapped, transformed, filtered
// - Errors can be passed to functions
// - Errors can be stored in data structures
// - Errors can be composed with success values
// ----------------------------------------------------------------------------

// 5.1: Errors are just values - they flow through the pipeline

function processUserInput(
  email: string,
  password: string,
  age: number
): NeverThrowResult<
  UserPayload,
  EmailValidationError | PasswordValidationError | AgeValidationError
> {
  console.log("\n--- 5.1: Errors Flow Through the Pipeline ---");

  // Notice: NO try-catch, NO exceptions
  // Errors are just values returned from functions
  const emailResult = validateEmail_NeverThrow(email);
  const passwordResult = validatePassword_NeverThrow(password);
  const ageResult = validateAge_NeverThrow(age);

  // If ANY validation fails, we get an Err value
  // If ALL pass, we get an Ok value
  // The error flows through as a regular value
  return emailResult
    .andThen((validEmail) =>
      passwordResult.map((validPassword) => ({
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

// 5.2: Transform errors just like success values (mapErr)

type ApiError = {
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
  // ERRORS ARE VALUES - we can transform them!
  // This is NOT exception handling, it's just value transformation
  return {
    code: "VALIDATION_ERROR",
    timestamp: new Date(),
  };
}

function validateAndFormatError(
  email: string
): NeverThrowResult<string, ApiError> {
  console.log("\n--- 5.2: Transform Errors with mapErr ---");

  // mapErr transforms the error value, success passes through
  return validateEmail_ForApi(email).mapErr(convertToApiError);
}

// 5.3: Multiple errors - collect them all (demonstration concept)

type ValidationIssue = {
  field: string;
  message: string;
};

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

// In a real app, you'd use Result.combine() with error accumulation
// Here we show the conceptual flow: errors can be collected as values
function validateAll_Collect(
  email: string,
  password: string
): NeverThrowResult<{ email: string; password: string }, ValidationIssue[]> {
  console.log("\n--- 5.3: Collect Multiple Errors ---");

  const emailResult = validateEmail_Collect(email);
  const passwordResult = validatePassword_Collect(password);

  // Conceptual: errors flow through, can be accumulated
  // This pattern lets us report ALL issues, not just the first one
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

// 5.4: Pass errors to functions - they're just values

function logError<E extends Error>(error: E): void {
  // ERRORS ARE VALUES - we can pass them to functions!
  // No try-catch needed, just regular function call
  console.error(`[ERROR ${error.name}] ${error.message}`);
}

function validateAndLog(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.4: Pass Errors to Functions ---");

  const result = validateEmail_NeverThrow(email);

  if (result.isErr()) {
    // Error is a value - pass it to a logging function
    logError(result.error);
    return result;
  }

  return result;
}

// 5.5: Store errors in data structures (impossible with exceptions!)

type ErrorLogEntry = {
  timestamp: Date;
  error: Error;
};

const errorLog: ErrorLogEntry[] = [];

function validateAndRecord(
  email: string
): NeverThrowResult<string, EmailValidationError> {
  console.log("\n--- 5.5: Store Errors in Data Structures ---");

  const result = validateEmail_NeverThrow(email);

  if (result.isErr()) {
    // ERRORS ARE VALUES - we can store them in arrays!
    // Try doing this with thrown exceptions :)
    errorLog.push({
      timestamp: new Date(),
      error: result.error,
    });
    return result;
  }

  return result;
}

// 5.6: Error recovery without try-catch

function validateWithFallback(
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

// 5.7: Conditional error handling based on error type

function validateWithConditionalHandling(
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

// ============================================================================
// SECTION 6: SIDE-BY-SIDE COMPARISON
// ============================================================================

// SAME functionality, THREE different approaches

// ----------------------------------------------------------------------------
// APPROACH 1: Traditional Try-Catch (PROBLEMATIC)
// ----------------------------------------------------------------------------
async function approach1_TryCatch(email: string) {
  try {
    const valid = validateEmail_FP1(email); // Can throw
    console.log("Valid:", valid);
  } catch (error: unknown) {
    // We "handled" it, but:
    // - error is unknown
    // - We don't know the error type
    // - We can't handle specific errors
    console.log("Error (unknown type):", error);
  }
}

// ----------------------------------------------------------------------------
// APPROACH 2: Custom Result Type (WORKS, BUT VERBOSE)
// ----------------------------------------------------------------------------
async function approach2_Custom(email: string) {
  const result = validateEmail_Result(email);
  if (isOk(result)) {
    console.log("Valid:", result.value);
  } else {
    // Type is narrowed to { ok: false; error: EmailValidationError }
    const errResult = result as { ok: false; error: EmailValidationError };
    console.log("Error:", errResult.error.message);
  }
}

// ----------------------------------------------------------------------------
// APPROACH 3: NeverThrow (CLEAN, TYPE-SAFE)
// ----------------------------------------------------------------------------
async function approach3_NeverThrow(email: string) {
  const result = validateEmail_NeverThrow(email);

  if (result.isOk()) {
    console.log("Valid:", result.value);
  } else {
    console.log("Error:", result.error.message);
  }
}

// ============================================================================
// SECTION 7: RUN DEMO
// ============================================================================

async function runDemo() {
  console.log("=".repeat(70));
  console.log("ERROR HANDLING DEMO: Why Try-Catch Sucks & NeverThrow Fixes It");
  console.log("=".repeat(70));

  // Problem demonstrations
  await registerUser_TryCatch("test@example.com", "password123", 25);
  parseUserInput_FP2("invalid json");
  await registerUser_Nested("test@example.com", "password123", 25);

  // NeverThrow solution
  handleRegistration_NeverThrow("test@example.com", "password123", 25);

  const chainedResult = createUserPayload(
    "test@example.com",
    "password123",
    25
  );
  console.log("Chained result type:", chainedResult.isOk() ? "Ok" : "Err");

  await registerUser_NeverThrow("new@example.com", "SecurePass123", 30);

  const recoveryResult = validateWithDefaults("bad-email", 25);
  if (recoveryResult.isOk()) {
    console.log("Recovery result:", recoveryResult.value);
  } else {
    console.log("Recovery error:", recoveryResult.error);
  }

  // ERRORS AS VALUES demonstrations
  console.log("\n" + "=".repeat(70));
  console.log("SECTION 5: ERRORS AS VALUES");
  console.log("=".repeat(70));

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

  // Comparison
  console.log("\n" + "=".repeat(70));
  console.log("SIDE-BY-SIDE COMPARISON");
  console.log("=".repeat(70));
  await approach1_TryCatch("test@example.com");
  await approach2_Custom("test@example.com");
  await approach3_NeverThrow("test@example.com");

  console.log("\n" + "=".repeat(70));
  console.log("KEY TAKEAWAYS:");
  console.log("1. Try-catch errors are `unknown` - no type safety");
  console.log("2. Type assertions lie to TypeScript - dangerous!");
  console.log("3. Result pattern makes errors explicit and composable");
  console.log("4. neverthrow provides battle-tested Result<T,E>");
  console.log("5. match() forces exhaustive error handling");
  console.log("6. ERRORS ARE VALUES - they flow through the program!");
  console.log("   - Transform with mapErr");
  console.log("   - Pass to functions");
  console.log("   - Store in arrays");
  console.log("   - Recover with orElse");
  console.log("=".repeat(70));
}

runDemo().catch(console.error);
