/** Keep SQLite on this computer. Use Postgres only when the host address is a Postgres URL. */
export function schemaForDatabaseUrl(schema: string, databaseUrl: string): string {
  const postgres = databaseUrl.startsWith("postgres");
  const provider = postgres ? "postgresql" : "sqlite";
  let next = schema.replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);
  const direct = '\n  directUrl = env("DATABASE_URL_UNPOOLED")';
  if (postgres && !next.includes("directUrl")) {
    next = next.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = env("DATABASE_URL")' + direct);
  }
  if (!postgres) next = next.replace(direct, "");
  return next;
}
