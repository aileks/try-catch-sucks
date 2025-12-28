import {
  EmailValidationError,
  PasswordValidationError,
  AgeValidationError,
  DatabaseError,
} from "./errors.js";

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

function saveUserToDatabase_FP1(user: {
  email: string;
  password: string;
  age: number;
}): string {
  if (user.email.includes("admin")) throw new DatabaseError("Email reserved");
  return "user-123";
}

export async function registerUser_TryCatch(
  email: string,
  password: string,
  age: number
) {
  console.log("\n--- PROBLEM 1: Blind Try-Catch ---");

  try {
    const validEmail = validateEmail_FP1(email);
    const validPassword = validatePassword_FP1(password);
    const validAge = validateAge_FP1(age);

    const userId = saveUserToDatabase_FP1({
      email: validEmail,
      password: validPassword,
      age: validAge,
    });
    return { success: true, userId };
  } catch (error) {
    console.log("Caught error, but...");
    console.log("  - Type:", typeof error);
    console.log("  - Name:", (error as any)?.name);
    console.log("  - Message:", (error as any)?.message);
    return { success: false, error: "Something failed" };
  }
}

export function parseUserInput_FP2(input: string): { name: string; age: number } {
  try {
    return JSON.parse(input);
  } catch (error) {
    const e = error as Error;
    console.log("Error message:", e.message);
    return { name: "default", age: 0 };
  }
}

export function parseUserInput_Unknown(input: string): { name: string; age: number } {
  try {
    return JSON.parse(input);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Known error:", error.message);
    } else {
      console.log("Unknown error type:", error);
    }
    return { name: "default", age: 0 };
  }
}

export async function registerUser_Nested(
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
          throw error;
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

export async function approach1_TryCatch(email: string) {
  try {
    const valid = validateEmail_FP1(email);
    console.log("Valid:", valid);
  } catch (error: unknown) {
    console.log("Error (unknown type):", error);
  }
}

export function runTryCatch() {
  console.log("\n=== TRY-CATCH PROBLEMS ===");
  registerUser_TryCatch("test@example.com", "password123", 25);
  parseUserInput_FP2("invalid json");
  parseUserInput_Unknown("invalid json");
  registerUser_Nested("test@example.com", "password123", 25);
  approach1_TryCatch("test@example.com");
}
