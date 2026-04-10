/**
 * certificate.ts — WakiaYoung
 *
 * Generates a PDF certificate for students who meet all 4 completion conditions
 * defined in CONTEXT.md §9:
 *   1. 100% attendance at live sessions
 *   2. All 6 weekly deliverables submitted
 *   3. Average 3.0+ across the 4 competencies (scale 0–4)
 *   4. Presented at Demo Day
 *
 * Usage (client-side only — jsPDF uses browser APIs):
 *   const result = checkCertificateEligibility(conditions)
 *   if (result.eligible) generateCertificate(student, cohort, scores)
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CertificateStudent {
  fullName:   string
  country:    string | null
  nickname?:  string | null
}

export interface CertificateCohort {
  name:        string
  market:      'LATAM' | 'USA'
  startDate:   string   // ISO date, e.g. "2025-05-05"
  endDate:     string   // ISO date, e.g. "2025-06-15"
}

/** All 4 competency scores on a 0–4 scale (CONTEXT.md §9). */
export interface CompetencyScores {
  validation:    number   // Weeks 1–2: Is the problem REAL?
  creation:      number   // Weeks 3–5: Did you build something that works?
  communication: number   // Week 6: Can you tell your story well?
  growth:        number   // All weeks: Did you learn about yourself?
}

/** Inputs for the 4 eligibility conditions (CONTEXT.md §9). */
export interface CertificateConditions {
  attendancePercent:      number    // 0–100; must be 100
  deliverablesSubmitted:  number    // must be 6
  scores:                 CompetencyScores
  presentedAtDemoDay:     boolean
}

export interface EligibilityResult {
  eligible:          boolean
  failedConditions:  string[]
  averageScore:      number
}

// ── Colors (matches globals.css design system) ─────────────────────────────────

const C = {
  navy:   [14,  42,  71]  as [number, number, number],
  navy2:  [22,  56,  87]  as [number, number, number],
  teal:   [0,   140, 165] as [number, number, number],
  green:  [0,   200, 150] as [number, number, number],
  gold:   [224, 163, 38]  as [number, number, number],
  white:  [255, 255, 255] as [number, number, number],
  ink:    [17,  17,  16]  as [number, number, number],
  ink3:   [138, 136, 132] as [number, number, number],
  bg:     [245, 244, 240] as [number, number, number],
} as const

// ── Competency metadata ────────────────────────────────────────────────────────

const COMPETENCIES = [
  { key: 'validation',    label: 'VALIDACIÓN',     weeks: 'Semanas 1–2' },
  { key: 'creation',      label: 'CREACIÓN',        weeks: 'Semanas 3–5' },
  { key: 'communication', label: 'COMUNICACIÓN',    weeks: 'Semana 6'    },
  { key: 'growth',        label: 'CRECIMIENTO',     weeks: 'Todo el programa' },
] as const

// ── Helpers ────────────────────────────────────────────────────────────────────

function avg(scores: CompetencyScores): number {
  const vals = [scores.validation, scores.creation, scores.communication, scores.growth]
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-LA', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Check whether a student meets all 4 certificate conditions.
 * Always call this before `generateCertificate`.
 */
export function checkCertificateEligibility(
  conditions: CertificateConditions
): EligibilityResult {
  const failed: string[] = []
  const average = avg(conditions.scores)

  if (conditions.attendancePercent < 100) {
    failed.push(`Asistencia incompleta (${conditions.attendancePercent}% — se requiere 100%)`)
  }
  if (conditions.deliverablesSubmitted < 6) {
    failed.push(`Entregables incompletos (${conditions.deliverablesSubmitted}/6 entregados)`)
  }
  if (average < 3.0) {
    failed.push(`Promedio de competencias insuficiente (${average.toFixed(2)} — se requiere 3.0+)`)
  }
  if (!conditions.presentedAtDemoDay) {
    failed.push('No presentó en el Demo Day')
  }

  return {
    eligible:         failed.length === 0,
    failedConditions: failed,
    averageScore:     average,
  }
}

/**
 * Generate and download a PDF certificate for a student.
 * Client-side only — must not be called from server components or API routes.
 *
 * @param student   Student display info
 * @param cohort    Cohort info (name, dates, market)
 * @param scores    4 competency scores (0–4 each)
 */
export async function generateCertificate(
  student: CertificateStudent,
  cohort:  CertificateCohort,
  scores:  CompetencyScores
): Promise<void> {
  // Dynamic import — keeps jsPDF out of the server bundle
  const { jsPDF } = await import('jspdf')

  // A4 landscape: 297 × 210 mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210

  // ── 0. Outer decorative border ─────────────────────────────────────────────

  doc.setDrawColor(...C.gold)
  doc.setLineWidth(1.2)
  doc.rect(6, 6, W - 12, H - 12)

  doc.setDrawColor(...C.navy)
  doc.setLineWidth(0.4)
  doc.rect(8, 8, W - 16, H - 16)

  // ── 1. Navy header band (0–52mm) ───────────────────────────────────────────

  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 52, 'F')

  // Teal accent bar at the bottom of the header
  doc.setFillColor(...C.teal)
  doc.rect(0, 49, W, 3, 'F')

  // "WAKIA YOUNG" logo text — top-left
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.green)
  doc.text('WAKIA', 14, 18)
  doc.setTextColor(...C.white)
  doc.text('YOUNG', 14, 25)

  // Small decorative W box (mimics the nav logo)
  doc.setFillColor(...C.green)
  doc.roundedRect(14, 28, 8, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.navy)
  doc.text('W', 18, 34.5, { align: 'center' })

  // Main header title — centered
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.gold)
  doc.setCharSpace(3)
  doc.text('CERTIFICADO DE FINALIZACIÓN', W / 2, 21, { align: 'center' })
  doc.setCharSpace(0)

  doc.setFontSize(7)
  doc.setTextColor(200, 200, 200)
  doc.text('PROGRAMA DE INTELIGENCIA ARTIFICIAL · 6 SEMANAS', W / 2, 28, { align: 'center' })

  // Cohort name in header
  doc.setFontSize(8.5)
  doc.setTextColor(...C.teal)
  doc.text(cohort.name.toUpperCase(), W / 2, 36, { align: 'center' })

  // FGU badge — top-right
  doc.setFillColor(...C.gold)
  doc.roundedRect(W - 56, 12, 42, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...C.navy)
  doc.setCharSpace(1)
  doc.text('CERTIFICADO POR FGU', W - 35, 17.5, { align: 'center' })
  doc.setCharSpace(0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.text('Fundación Guía Universitaria', W - 35, 22.5, { align: 'center' })

  // ── 2. Main content area (57–148mm) ──────────────────────────────────────

  // "Este certificado acredita que" caption
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.ink3)
  doc.text('Este certificado acredita que', W / 2, 68, { align: 'center' })

  // Student name — large, navy
  const displayName = student.fullName.toUpperCase()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...C.navy)
  doc.text(displayName, W / 2, 84, { align: 'center' })

  // Gold underline beneath name
  const nameWidth = doc.getTextWidth(displayName)
  const nameX = (W - nameWidth) / 2
  doc.setDrawColor(...C.gold)
  doc.setLineWidth(0.8)
  doc.line(nameX, 87, nameX + nameWidth, 87)

  // Country flag-ish text
  if (student.country) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.ink3)
    doc.text(student.country, W / 2, 93, { align: 'center' })
  }

  // "completó exitosamente..." text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.ink)
  doc.text('completó exitosamente el programa', W / 2, 103, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C.teal)
  doc.text('WakiaYoung', W / 2, 112, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C.ink3)
  doc.text(
    `${formatDate(cohort.startDate)} — ${formatDate(cohort.endDate)}`,
    W / 2, 120, { align: 'center' }
  )

  // Avg score badge
  const avgScore = avg(scores)
  doc.setFillColor(...C.green)
  doc.roundedRect(W / 2 - 22, 124, 44, 12, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.navy)
  doc.setCharSpace(0.5)
  doc.text(`PROMEDIO  ${avgScore.toFixed(2)} / 4.0`, W / 2, 131.5, { align: 'center' })
  doc.setCharSpace(0)

  // ── 3. Competency scores row (148–178mm) ──────────────────────────────────

  doc.setFillColor(...C.bg)
  doc.rect(12, 142, W - 24, 40, 'F')

  doc.setDrawColor(...C.teal)
  doc.setLineWidth(0.3)
  doc.rect(12, 142, W - 24, 40)

  // Section label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.ink3)
  doc.setCharSpace(1.5)
  doc.text('COMPETENCIAS EVALUADAS', W / 2, 149, { align: 'center' })
  doc.setCharSpace(0)

  const colW    = (W - 24) / 4
  const barMaxW = colW - 20
  const BAR_H   = 3.5

  COMPETENCIES.forEach((comp, i) => {
    const score = scores[comp.key]
    const x     = 12 + i * colW
    const cx    = x + colW / 2

    // Score value — large
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    // Color: green ≥ 3.5, teal ≥ 3.0, gold ≥ 2.0, coral < 2.0
    const scoreColor: [number, number, number] =
      score >= 3.5 ? C.green :
      score >= 3.0 ? C.teal  :
      score >= 2.0 ? C.gold  :
      [255, 92, 53]
    doc.setTextColor(...scoreColor)
    doc.text(`${score.toFixed(1)}`, cx, 161, { align: 'center' })

    // "/4" subscript
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.ink3)
    doc.text('/ 4', cx + 7, 161, { align: 'left' })

    // Progress bar (background)
    const barX = cx - barMaxW / 2
    doc.setFillColor(220, 220, 215)
    doc.roundedRect(barX, 164, barMaxW, BAR_H, 1, 1, 'F')

    // Progress bar (fill)
    const fillW = Math.max(2, (score / 4) * barMaxW)
    doc.setFillColor(...scoreColor)
    doc.roundedRect(barX, 164, fillW, BAR_H, 1, 1, 'F')

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...C.ink)
    doc.setCharSpace(0.8)
    doc.text(comp.label, cx, 172, { align: 'center' })
    doc.setCharSpace(0)

    // Weeks sub-label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...C.ink3)
    doc.text(comp.weeks, cx, 177, { align: 'center' })

    // Vertical divider between columns (not after last)
    if (i < 3) {
      doc.setDrawColor(200, 200, 195)
      doc.setLineWidth(0.2)
      doc.line(x + colW, 147, x + colW, 181)
    }
  })

  // ── 4. Footer (183–210mm) ──────────────────────────────────────────────────

  doc.setFillColor(...C.navy)
  doc.rect(0, 188, W, 22, 'F')

  // Completion date — left
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 200, 220)
  doc.text('Fecha de finalización', 20, 196)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(formatDate(cohort.endDate), 20, 202)

  // Signature placeholder — center
  doc.setDrawColor(...C.teal)
  doc.setLineWidth(0.4)
  doc.line(W / 2 - 30, 200, W / 2 + 30, 200)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(180, 200, 220)
  doc.text('Firma del Mentor / Coordinadora del Programa', W / 2, 205, { align: 'center' })

  // FGU + market — right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.gold)
  doc.text('Certificado por FGU', W - 20, 196, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(180, 200, 220)
  doc.text(`Fundación Guía Universitaria · Mercado ${cohort.market}`, W - 20, 202, { align: 'right' })

  // ── 5. Save ────────────────────────────────────────────────────────────────

  const safeName = student.fullName.replace(/\s+/g, '_').toLowerCase()
  doc.save(`certificado_${safeName}_wakia_young.pdf`)
}
