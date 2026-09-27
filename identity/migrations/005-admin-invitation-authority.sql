-- Enrolled Mirror Progress admins may issue Prospect invitations after the
-- same fresh passkey check required of the original owner. Project leads and
-- external client accounts do not receive invitation authority.
INSERT INTO mirror_managed_invitation_admin(principal_id)
SELECT m.principal_id FROM mirror_managed_invitation m
JOIN mirror_binding b ON b.principal_id=m.principal_id
JOIN mirror_principal p ON p.id=m.principal_id
WHERE m.account_type='admin' AND m.requested_role='admin'
  AND m.revoked_at IS NULL AND p.privileged AND NOT p.disabled
ON CONFLICT DO NOTHING;

CREATE FUNCTION mirror_grant_enrolled_admin_invitation_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.mirror_managed_invitation_admin(principal_id)
  SELECT m.principal_id FROM public.mirror_managed_invitation m
  JOIN public.mirror_principal p ON p.id=m.principal_id
  WHERE m.principal_id=NEW.principal_id AND m.account_type='admin'
    AND m.requested_role='admin' AND m.revoked_at IS NULL
    AND p.privileged AND NOT p.disabled
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER mirror_grant_enrolled_admin_invitation_authority
AFTER INSERT ON mirror_binding FOR EACH ROW
EXECUTE FUNCTION mirror_grant_enrolled_admin_invitation_authority();
REVOKE ALL ON FUNCTION mirror_grant_enrolled_admin_invitation_authority() FROM PUBLIC;
