export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertDemoSafe } = await import("./lib/demo");
  assertDemoSafe();
}
