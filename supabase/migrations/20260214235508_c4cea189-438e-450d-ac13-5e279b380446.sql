
-- Tighten notification insert: only the user themselves or managers/admins can insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Tighten escalation insert: only managers/admins can create escalations
DROP POLICY IF EXISTS "System creates escalations" ON public.manager_escalations;
CREATE POLICY "Managers create escalations"
  ON public.manager_escalations FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_admin')
  );
