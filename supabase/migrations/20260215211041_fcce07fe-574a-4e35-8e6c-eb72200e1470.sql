
CREATE OR REPLACE FUNCTION increment_template_use_count(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.email_templates
  SET use_count = use_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
