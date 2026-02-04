import { isBlockedPersonalEmail } from "../src/lib/validation/email-domain.ts";

const cases = [
  { email: "user@nsuk.edu.kg", blocked: true },
  { email: "User@NSUK.EDU.KG", blocked: true },
  { email: " user@nsuk.edu.kg ", blocked: true },
  { email: "user@gmail.com", blocked: false }
];

let failed = false;

for (const testCase of cases) {
  const result = isBlockedPersonalEmail(testCase.email);
  if (result !== testCase.blocked) {
    failed = true;
    console.error(`Expected ${testCase.email} blocked=${testCase.blocked}, got ${result}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("personal email block tests passed");
