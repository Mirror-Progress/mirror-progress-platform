import type { Pool } from "pg";
import { STAGING } from "../core/staging-config.js";
export async function assertStagingRuntime(db: Pool): Promise<void> {
  const { rows } = await db.query(`SELECT current_user::text AS role,session_user::text AS login,
    r.rolsuper,r.rolcreatedb,r.rolcreaterole,r.rolbypassrls,
    EXISTS (SELECT 1 FROM pg_auth_members WHERE member=r.oid) AS memberships,
    has_schema_privilege(current_user,'public','CREATE') AS ddl,
    EXISTS (SELECT 1 FROM unnest(ARRAY['mirror_principal','mirror_schema_migration','mirror_staging_operator',
      'mirror_staging_reconciliation','mirror_staging_approval','mirror_staging_audit']) AS targets(name)
      WHERE has_table_privilege(current_user,name,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER')) AS policy_write,
    has_table_privilege(current_user,'mirror_staging_invitation','INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER') AS invite_write,
    EXISTS (SELECT 1 FROM unnest(ARRAY['digest','principal_id','epoch','email','issuer','created_at','expires_at']) AS cols(name)
      WHERE has_column_privilege(current_user,'mirror_staging_invitation',name,'UPDATE')) AS invite_columns,
    has_function_privilege(current_user,'mirror_staging_approve(text,bigint,text)','EXECUTE') AS approval
    FROM pg_roles r WHERE r.rolname=current_user`);
  const r = rows[0];
  if (!r || r.role !== STAGING.runtimeRole || r.login !== STAGING.runtimeRole ||
      ['rolsuper','rolcreatedb','rolcreaterole','rolbypassrls','memberships','ddl','policy_write','invite_write','invite_columns','approval'].some(k => r[k])) {
    throw new Error("Staging runtime must not have operator, owner, or approval privileges");
  }
}
