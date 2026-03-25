-- ============================================================
-- SET ADMIN ROLE — Jessica + Heiddy + María
-- Permite ver ambas vistas: /mentor/* y /dashboard (estudiante)
--
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
  v_jessica_id  uuid;
  v_heiddy_id   uuid;
  v_maria_id    uuid;
  v_cohort_id   uuid;
  v_pod_id      uuid;
BEGIN

  -- IDs de las usuarias
  SELECT id INTO v_jessica_id FROM auth.users WHERE email = 'jessicajanecolmenarespaz@gmail.com' LIMIT 1;
  SELECT id INTO v_heiddy_id  FROM auth.users WHERE email = 'soyheiddy@gmail.com'               LIMIT 1;
  SELECT id INTO v_maria_id   FROM auth.users WHERE email = 'maria.almeida@oksbdc.org'           LIMIT 1;

  -- Cohorte activa
  SELECT id INTO v_cohort_id FROM public.cohorts WHERE status = 'active' ORDER BY start_date DESC LIMIT 1;

  -- ── JESSICA ────────────────────────────────────────────────────────────────

  IF v_jessica_id IS NULL THEN
    RAISE NOTICE '⚠ Jessica no encontrada en auth.users';
  ELSE
    UPDATE public.users SET role = 'admin', updated_at = now() WHERE id = v_jessica_id;
    RAISE NOTICE '✅ Jessica → admin';

    -- Enrollment como estudiante si no tiene
    IF v_cohort_id IS NOT NULL THEN
      INSERT INTO public.enrollments (user_id, cohort_id, market, price_paid_usd, is_scholarship, status, enrolled_at)
      VALUES (v_jessica_id, v_cohort_id, 'LATAM', 0, true, 'active', now())
      ON CONFLICT (user_id, cohort_id) DO UPDATE SET status = 'active';
    END IF;
  END IF;

  -- ── HEIDDY ─────────────────────────────────────────────────────────────────

  IF v_heiddy_id IS NULL THEN
    RAISE NOTICE '⚠ Heiddy no encontrada en auth.users. Debe hacer login primero.';
  ELSE
    UPDATE public.users SET role = 'admin', updated_at = now() WHERE id = v_heiddy_id;
    RAISE NOTICE '✅ Heiddy → admin';

    -- Enrollment como estudiante si no tiene
    IF v_cohort_id IS NOT NULL THEN
      INSERT INTO public.enrollments (user_id, cohort_id, market, price_paid_usd, is_scholarship, status, enrolled_at)
      VALUES (v_heiddy_id, v_cohort_id, 'LATAM', 0, true, 'active', now())
      ON CONFLICT (user_id, cohort_id) DO UPDATE SET status = 'active';
    END IF;
  END IF;

  -- ── MARÍA ──────────────────────────────────────────────────────────────────

  IF v_maria_id IS NULL THEN
    RAISE NOTICE '⚠ María no encontrada en auth.users. Debe hacer login primero.';
  ELSE
    UPDATE public.users SET role = 'admin', updated_at = now() WHERE id = v_maria_id;
    RAISE NOTICE '✅ María → admin';

    -- Enrollment como estudiante si no tiene
    IF v_cohort_id IS NOT NULL THEN
      INSERT INTO public.enrollments (user_id, cohort_id, market, price_paid_usd, is_scholarship, status, enrolled_at)
      VALUES (v_maria_id, v_cohort_id, 'USA', 0, true, 'active', now())
      ON CONFLICT (user_id, cohort_id) DO UPDATE SET status = 'active';
    END IF;
  END IF;

  -- ── Pod para todas (si no tienen) ──────────────────────────────────────────

  IF v_cohort_id IS NOT NULL THEN
    -- Buscar pod existente o crear uno
    SELECT id INTO v_pod_id FROM public.pods WHERE cohort_id = v_cohort_id ORDER BY created_at LIMIT 1;

    IF v_pod_id IS NULL THEN
      INSERT INTO public.pods (cohort_id, name, timezone_region)
      VALUES (v_cohort_id, 'Pod Fundadoras', 'América Latina')
      RETURNING id INTO v_pod_id;
      RAISE NOTICE '✅ Pod "Fundadoras" creado';
    END IF;

    -- Agregar a cada una al pod si no están
    IF v_jessica_id IS NOT NULL THEN
      INSERT INTO public.pod_members (pod_id, user_id, cohort_id, is_pod_leader_this_week)
      VALUES (v_pod_id, v_jessica_id, v_cohort_id, false)
      ON CONFLICT (pod_id, user_id) DO NOTHING;
    END IF;

    IF v_heiddy_id IS NOT NULL THEN
      INSERT INTO public.pod_members (pod_id, user_id, cohort_id, is_pod_leader_this_week)
      VALUES (v_pod_id, v_heiddy_id, v_cohort_id, true)
      ON CONFLICT (pod_id, user_id) DO NOTHING;
    END IF;

    IF v_maria_id IS NOT NULL THEN
      INSERT INTO public.pod_members (pod_id, user_id, cohort_id, is_pod_leader_this_week)
      VALUES (v_pod_id, v_maria_id, v_cohort_id, false)
      ON CONFLICT (pod_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '── Resultado ──────────────────────────────────';
  RAISE NOTICE 'Las tres tienen role=admin y pueden acceder a:';
  RAISE NOTICE '  → /mentor/dashboard  (vista mentor)';
  RAISE NOTICE '  → /dashboard         (vista estudiante)';
  RAISE NOTICE '  → /deliverables, /pod, /diary, /project';

END $$;
