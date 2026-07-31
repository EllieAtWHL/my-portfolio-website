export default function DemoBuildBreakPage() {
  throw new Error('Deliberate crash during static generation, to prove the build check fails on build-time errors that typecheck/lint/test would not catch.');
}
