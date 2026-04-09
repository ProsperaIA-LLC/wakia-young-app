-- ============================================================
-- SEED — WakiaYoung · Cohorte de prueba
-- ============================================================
-- Cómo usar:
--   1. Abrí Supabase Dashboard → SQL Editor
--   2. Reemplazá 'TU_EMAIL_AQUI' con tu email de Supabase Auth
--   3. Pegá y ejecutá
--
-- Qué crea:
--   • Cohorte 1 LATAM activa (semana 1, arrancó hoy)
--   • 6 semanas con contenido real del programa
--   • Tu enrollment (status = active)
--   • Pod "Cóndor" con vos como Pod Leader esta semana
--   • 1 entry en activity_log (login)
-- ============================================================

DO $$
DECLARE
  v_user_email    text    := 'jessicajanecolmenarespaz@gmail.com';
  v_user_id       uuid;
  v_cohort_id     uuid;
  v_pod_id        uuid;
  v_week1_id      uuid;
  v_week2_id      uuid;
  v_week3_id      uuid;
  v_week4_id      uuid;
  v_week5_id      uuid;
  v_week6_id      uuid;
  v_start         date    := current_date;
BEGIN

  -- ── 1. Buscar usuario ────────────────────────────────────
  select id into v_user_id
  from public.users
  where email = v_user_email;

  if v_user_id is null then
    raise exception
      'Usuario no encontrado para el email: %. '
      'Asegurate de haber hecho login al menos una vez para que se cree el perfil.',
      v_user_email;
  end if;

  -- ── 2. Cohorte ───────────────────────────────────────────
  insert into public.cohorts (
    id, name, market, start_date, end_date,
    status, current_week, price_full_usd, price_early_usd, max_students
  )
  values (
    gen_random_uuid(),
    'Cohorte 1 — WakiaYoung 2026',
    'LATAM',
    v_start,
    v_start + 41,   -- 42 días = 6 semanas
    'active',
    1,
    297.00,
    197.00,
    30
  )
  returning id into v_cohort_id;

  -- ── 3. Semanas ───────────────────────────────────────────

  -- Semana 1 — Despertar
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 1, 'Despertar',
    'El problema que te duele',
    '¿Qué problema en tu entorno nadie está resolviendo bien?',
    'Presenta 3 evidencias externas de que el problema es real: conversaciones, fotos, datos o registros de observación directa.',
    'Al menos 1 persona que no te conoce confirmó el problema sin que vos lo sugirieras.',
    '¿Qué aprendí esta semana sobre el problema que estoy investigando?',
    '¿Qué voy a hacer diferente la semana que viene para validar mejor?',
    ARRAY['Claude', 'Notion'],
    v_start,
    v_start + 6
  ) returning id into v_week1_id;

  -- Semana 2 — Despertar
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 2, 'Despertar',
    'IA como forma de pensar',
    '¿Qué pasaría si intentaras resolver tu problema con IA ahora mismo, sin saber cómo?',
    'Tu biblioteca personal de 5 prompts validados por el pod: cada prompt tiene nombre, caso de uso y fue probado por al menos un compañero.',
    'Cada prompt tiene nombre, caso de uso, y al menos un peer lo probó y dio feedback.',
    '¿Qué me enseñó el fracaso rápido de esta semana sobre cómo pienso?',
    '¿Cómo voy a usar el prompting diferente la próxima semana?',
    ARRAY['Claude', 'ChatGPT'],
    v_start + 7,
    v_start + 13
  ) returning id into v_week2_id;

  -- Semana 3 — Construir
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 3, 'Construir',
    'Algo real en 5 días',
    '¿Qué es lo mínimo que podés construir esta semana para que alguien ajeno pueda usarlo?',
    'Prototipo funcional: un extraño completa el flujo principal solo, sin instrucciones tuyas.',
    'Tu buddy completó el flujo principal sin que vos le explicaras nada.',
    '¿Qué descubrí sobre mi producto al verlo en manos de otra persona?',
    '¿Qué voy a iterar primero la semana que viene?',
    ARRAY['Claude Code', 'Glide'],
    v_start + 14,
    v_start + 20
  ) returning id into v_week3_id;

  -- Semana 4 — Construir
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 4, 'Construir',
    'Las 3 preguntas del negocio',
    '¿Quién paga, cuánto paga, y por qué te paga a vos y no sigue sin resolver el problema?',
    'Una página de modelo de negocio + 2 precios reales confirmados por personas externas.',
    '2 personas que no te conocen dijeron un número concreto cuando les preguntaste cuánto pagarían.',
    '¿Qué aprendí sobre el valor real de mi solución esta semana?',
    '¿Qué tengo que cambiar en mi modelo basándome en lo que escuché?',
    ARRAY['Claude', 'WhatsApp'],
    v_start + 21,
    v_start + 27
  ) returning id into v_week4_id;

  -- Semana 5 — Construir
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 5, 'Construir',
    'Agentes que trabajan mientras dormís',
    '¿Cuáles son las tareas repetitivas de tu proyecto que podrías automatizar con un agente de IA?',
    'Agente funcional que ahorra 30+ minutos semanales en tu proyecto.',
    'El agente corrió sin intervención manual al menos 3 veces.',
    '¿Qué me sorprendió de automatizar una parte de mi trabajo?',
    '¿Qué otras tareas podría delegar a un agente la semana que viene?',
    ARRAY['n8n', 'Make', 'Claude'],
    v_start + 28,
    v_start + 34
  ) returning id into v_week5_id;

  -- Semana 6 — Lanzar
  insert into public.weeks (
    id, cohort_id, week_number, phase, title,
    opening_question, deliverable_description, success_signal,
    reflection_q1, reflection_q2,
    tools, unlock_date, due_date
  ) values (
    gen_random_uuid(), v_cohort_id, 6, 'Lanzar',
    'Demo Day: tu primer hito público',
    '¿Cómo le contarías en 5 minutos a alguien que no te conoce lo que construiste y por qué importa?',
    'Pitch grabado de 5 minutos + link al producto publicado + compromiso público de 30 días.',
    'El link del producto funciona y un extraño puede usarlo ahora mismo sin instrucciones.',
    '¿Qué cambió en mí como constructor/a a lo largo de estas 6 semanas?',
    '¿Cuál es mi próximo hito en los próximos 30 días?',
    ARRAY['Claude', 'Loom'],
    v_start + 35,
    v_start + 41
  ) returning id into v_week6_id;

  -- ── 4. Enrollment ────────────────────────────────────────
  insert into public.enrollments (
    user_id, cohort_id, market,
    price_paid_usd, is_scholarship, status
  ) values (
    v_user_id, v_cohort_id, 'LATAM',
    0, true, 'active'    -- is_scholarship=true para pruebas (precio $0)
  );

  -- ── 5. Pod ───────────────────────────────────────────────
  insert into public.pods (
    id, cohort_id, name, timezone_region
  ) values (
    gen_random_uuid(), v_cohort_id,
    'Pod Cóndor', 'GMT-5 a GMT-3'
  ) returning id into v_pod_id;

  -- ── 6. Pod member (vos, Pod Leader semana 1) ─────────────
  insert into public.pod_members (
    pod_id, user_id, cohort_id,
    is_pod_leader_this_week, pod_leader_week_number
  ) values (
    v_pod_id, v_user_id, v_cohort_id,
    true, 1
  );

  -- ── 7. Activity log ──────────────────────────────────────
  insert into public.activity_log (user_id, cohort_id, action)
  values (v_user_id, v_cohort_id, 'login');

  raise notice '✓ Seed completado exitosamente.';
  raise notice '  cohort_id : %', v_cohort_id;
  raise notice '  pod_id    : %', v_pod_id;
  raise notice '  semana 1  : %', v_week1_id;

END $$;

-- ============================================================
-- MENTOR — Heiddy (fundadora)
-- ============================================================
-- IMPORTANTE: Heiddy debe haber hecho login al menos una vez
-- antes de ejecutar este bloque, para que exista en public.users.
-- ============================================================

DO $$
DECLARE
  v_cohort_id  uuid;
  v_heiddy_id  uuid;
BEGIN

  -- Buscar su usuario
  select id into v_heiddy_id
  from public.users
  where email = 'soyheiddy@gmail.com';

  if v_heiddy_id is null then
    raise exception
      'Usuario soyheiddy@gmail.com no encontrado. '
      'Heiddy debe iniciar sesión en la app primero para crear su perfil.';
  end if;

  -- Asignar rol mentor (accede a rutas /mentor y /dashboard)
  update public.users
  set role = 'mentor'
  where id = v_heiddy_id;

  -- Buscar la cohorte activa
  select id into v_cohort_id
  from public.cohorts
  where status = 'active'
  order by created_at desc
  limit 1;

  -- Enrollment en la cohorte activa (para que también vea el dashboard de estudiante)
  if v_cohort_id is not null then
    insert into public.enrollments (user_id, cohort_id, market, price_paid_usd, is_scholarship, status)
    values (v_heiddy_id, v_cohort_id, 'LATAM', 0, true, 'active')
    on conflict (user_id, cohort_id) do nothing;
  end if;

  raise notice '✓ Heiddy configurada como mentor. user_id: %', v_heiddy_id;

END $$;
