import { runErrors } from "./errors.js";
import { runTryCatch } from "./try-catch.js";
import { runNeverThrow } from "./neverthrow.js";
import { runErrorsAsValues } from "./errors-as-values.js";

export async function runDemo() {
  console.log("=".repeat(70));
  console.log("ERROR HANDLING DEMO: Why Try-Catch Sucks & NeverThrow Fixes It");
  console.log("=".repeat(70));

  runErrors();
  await runTryCatch();
  runNeverThrow();
  runErrorsAsValues();

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
