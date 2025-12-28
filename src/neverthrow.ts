import { ok, err, Result as NeverThrowResult, ResultAsync } from "neverthrow";
import {
  EmailValidationError,
  PasswordValidationError,
  AgeValidationError,
  DuplicateEmailError,
} from "./errors.js";

export function validateEmail_NeverThrow(
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

export function validatePassword_NeverThrow(
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

export function validateAge_NeverThrow(
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

export function handleRegistration_NeverThrow(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- 4.2: Pattern Matching with match() ---");

  const emailResult = validateEmail_NeverThrow(email);
  const passwordResult = validatePassword_NeverThrow(password);
  const ageResult = validateAge_NeverThrow(age);

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

export type UserPayload = {
  email: string;
  password: string;
  age: number;
};

export function createUserPayload(
  email: string,
  password: string,
  age: number
): NeverThrowResult<
  UserPayload,
  EmailValidationError | PasswordValidationError | AgeValidationError
> {
  console.log("\n--- 4.3: Chaining with andThen() ---");

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

export async function registerUser_NeverThrow(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- 4.4: Async with ResultAsync ---");

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

export function validateWithDefaults(
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

export async function approach3_NeverThrow(email: string) {
  const result = validateEmail_NeverThrow(email);

  if (result.isOk()) {
    console.log("Valid:", result.value);
  } else {
    console.log("Error:", result.error.message);
  }
}

export function runNeverThrow() {
  console.log("\n=== NEVERTHROW SOLUTION ===");
  handleRegistration_NeverThrow("test@example.com", "password123", 25);

  const chainedResult = createUserPayload(
    "test@example.com",
    "password123",
    25
  );
  console.log("Chained result type:", chainedResult.isOk() ? "Ok" : "Err");

  registerUser_NeverThrow("new@example.com", "SecurePass123", 30);

  const recoveryResult = validateWithDefaults("bad-email", 25);
  if (recoveryResult.isOk()) {
    console.log("Recovery result:", recoveryResult.value);
  } else {
    console.log("Recovery error:", recoveryResult.error);
  }

  approach3_NeverThrow("test@example.com");
}
