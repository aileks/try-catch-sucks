# try-catch sucks

Reference for NeverThrow vs. standard try-catch

## Project Structure

```
/src
  errors.ts           # Domain-specific error classes
  try-catch.ts        # Traditional try-catch problems
  neverthrow.ts       # NeverThrow Result patterns
  errors-as-values.ts # ERRORS AS VALUES demonstrations
  demo.ts             # Main entry point
  index.ts            # Barrel export

dist/                 # Compiled JavaScript output
tsconfig.json
package.json
```

## Build Commands

```bash
# Install dependencies
pnpm install

# Run demo
pnpm demo              # Compile then run
pnpm demo:fast         # Fast mode (ts-node, no compilation)

# Type checking and build
pnpm build             # Compile to dist/
pnpm typecheck         # Type check only
```

## Running

```bash
# Compile and run
pnpm demo

# Or run directly
npx tsc && node dist/demo.js
```