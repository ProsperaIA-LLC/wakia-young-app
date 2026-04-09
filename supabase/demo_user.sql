-- ============================================================
-- DEMO USER — WakiaYoung
-- ============================================================
-- Crea un usuario "visitante demo" con acceso a AMBOS roles:
--   • /mentor/*  (dashboard, students, pods, session, etc.)
--   • /dashboard (deliverables, pod, diary, project, Próspero)
--
-- Cómo usar:
--   1. Supabase Dashboard → SQL Editor
--   2. Ejecutá este script completo
--   3. Enviá el magic link a demo@prospera.ai desde
--      Supabase → Authentication → Users → Invite user
--      (o usá el email/password que prefieras)
--
-- Credenciales del demo:
--   Email:    demo@prospera.ai
--   Rol:      admin  (ve mentor + estudiante)
--   Nickname: Demo
-- ============================================================

DO $$
DECLARE
  v_demo_id   uuid;
  v_cohort_id uuid;
  v_pod_id    uuid;
  v_week1_id  uuid;
BEGIN

  -- ── 1. Buscar el usuario demo (debe existir en auth.users) ──────────────────
  SELECT id INTO v_demo_id
  FROM auth.users
  WHERE email = 'demo@prospera.ai'
  LIMIT 1;

  IF v_demo_id IS NULL THEN
    RAISE EXCEPTION 'El usuario demo@prospera.ai no existe en auth.users. '
      'Créalo primero desde Supabase → Authentication → Users → Add user.';
  END IF;

  -- ── 2. Upsert perfil en public.users con rol admin ─────────────────────────
  INSERT INTO public.users (
    id, email, full_name, nickname, country, role,
    parent_consent, market, created_at, updated_at
  ) VALUES (
    v_demo_id,
    'demo@prospera.ai',
    'Usuario Demo',
    'Demo',
    'Argentina',
    'admin',
    true,
    'LATAM',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role      = 'admin',
    nickname  = COALESCE(public.users.nickname, 'Demo'),
    updated_at = now();

  -- ── 3. Buscar la cohorte activa ─────────────────────────────────────────────
  SELECT id INTO v_cohort_id
  FROM public.cohorts
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_cohort_id IS NULL THEN
    RAISE NOTICE 'No hay cohorte activa. El demo no tendrá vista de estudiante.';
  ELSE

    -- ── 4. Enrollment como estudiante ─────────────────────────────────────────
    INSERT INTO public.enrollments (
      user_id, cohort_id, market, price_paid_usd,
      is_scholarship, status, enrolled_at
    ) VALUES (
      v_demo_id, v_cohort_id, 'LATAM', 0,
      true, 'active', now()
    )
    ON CONFLICT (user_id, cohort_id) DO UPDATE SET
      status = 'active';

    -- ── 5. Buscar o crear pod "Demo" ──────────────────────────────────────────
    SELECT id INTO v_pod_id
    FROM public.pods
    WHERE cohort_id = v_cohort_id
    LIMIT 1;

    IF v_pod_id IS NULL THEN
      INSERT INTO public.pods (cohort_id, name, timezone_region)
      VALUES (v_cohort_id, 'Pod Demo', 'América Latina')
      RETURNING id INTO v_pod_id;
    END IF;

    -- ── 6. Membership en el pod ───────────────────────────────────────────────
    INSERT INTO public.pod_members (
      pod_id, user_id, cohort_id, is_pod_leader_this_week
    ) VALUES (
      v_pod_id, v_demo_id, v_cohort_id, false
    )
    ON CONFLICT (pod_id, user_id) DO NOTHING;

    -- ── 7. Entregable de ejemplo (semana 1) ───────────────────────────────────
    SELECT id INTO v_week1_id
    FROM public.weeks
    WHERE cohort_id = v_cohort_id
    ORDER BY week_number
    LIMIT 1;

    IF v_week1_id IS NOT NULL THEN
      INSERT INTO public.deliverables (
        user_id, week_id, cohort_id, content, status, submitted_at
      ) VALUES (
        v_demo_id, v_week1_id, v_cohort_id,
        'Este es un entregable de ejemplo para la vista demo. Aquí el estudiante describe qué construyó, con quién lo validó y qué aprendió durante la semana.',
        'submitted',
        now() - interval '2 days'
      )
      ON CONFLICT (user_id, week_id) DO NOTHING;
    END IF;

    -- ── 8. Log de actividad ───────────────────────────────────────────────────
    INSERT INTO public.activity_log (user_id, cohort_id, action, metadata)
    VALUES (v_demo_id, v_cohort_id, 'login', '{"demo": true}')
    ON CONFLICT DO NOTHING;

  END IF;

  RAISE NOTICE '✅ Usuario demo configurado. ID: %', v_demo_id;
  RAISE NOTICE '   Role: admin | Ve: /mentor/* + /dashboard + /deliverables + /pod + /diary + /project';

END $$;
