import { literal } from '../../../pg-format'

export const getDatabaseExtensionDefaultSchemaSQL = ({ extension }: { extension: string }) => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: Fetch the default schema for a specific available extension version
select name, version, schema from pg_available_extension_versions where name = ${literal(extension)} limit 1;
`.trim()

  return sql
}
