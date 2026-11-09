// The Collection type-checks against ES2022 libraries. ODDS calls this ES2024
// string method (as supplied with TypeScript 7), so declare only that method here.
interface String {
  toWellFormed(): string;
}
