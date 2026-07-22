import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { SyncReadingProgressSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

// Reading Plans Progress — authenticated sync API.
//
// Implements the approved Option C architecture exactly: localStorage
// remains the anonymous default; this endpoint exists only to let an
// authenticated user's progress follow them across devices. It is never
// called by an anonymous user — the client only reaches this route after a
// real 401/200 check (see /reading-plans/page.tsx), not a hardcoded
// authentication value, unlike the Study module's dormant sync pattern this
// task explicitly warned against copying.
//
// Minimum required surface only: GET (read all of the caller's progress)
// and PUT (push local entries, merge, and — via the `reset` flag —
// propagate destructive resets). No separate DELETE route, per approved scope.

// Rank used purely for the merge comparison below — completed always beats
// any in-progress day count. Not stored; computed on read.
function rank(row: { completed: boolean; current_day: number }): number {
  return row.completed ? Number.MAX_SAFE_INTEGER : row.current_day
}

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma as any).readingProgress.findMany({
      where: { user_id: user.id },
      select: {
        reading_plan_id: true, current_day: true, completed: true,
        paused: true, started_at: true, completed_at: true,
      },
    })
    return successResponse(rows, 'Reading progress retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body      = await req.json()
    const validated = SyncReadingProgressSchema.parse(body)

    // Small, compatible addition: validate every referenced plan actually
    // exists before touching the database, so a stale/malformed planId
    // returns a clean error rather than surfacing as a generic 500 from an
    // FK constraint failure deep inside the loop below.
    const planIds = Array.from(new Set(validated.entries.map(e => e.planId)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const knownPlans = await (prisma as any).readingPlan.findMany({
      where: { id: { in: planIds } }, select: { id: true },
    })
    const knownIds = new Set(knownPlans.map((p: { id: string }) => p.id))
    const unknown  = planIds.filter(id => !knownIds.has(id))
    if (unknown.length > 0) {
      return validationErrorResponse(new z.ZodError([{
        code: z.ZodIssueCode.custom, path: ['entries'],
        message: `Unknown reading plan id(s): ${unknown.join(', ')}`,
      }]))
    }

    const results = []

    // Sequential, not Promise.all — deliberately, so each entry's
    // read-then-compare-then-write is atomic relative to the others in this
    // same request and easy to reason about; this endpoint is not a
    // high-frequency hot path (called on mutation + on mount), so the small
    // latency cost is the right trade-off against a race between two of a
    // user's own entries in one payload.
    for (const entry of validated.entries) {
      if (entry.reset) {
        // Destructive reset (product decision #5) — propagate the deletion
        // server-side so a stale row can never be pulled back down on a
        // future sync and silently resurrect "deleted" progress.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).readingProgress.deleteMany({
          where: { user_id: user.id, reading_plan_id: entry.planId },
        })
        results.push({ readingPlanId: entry.planId, reset: true })
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (prisma as any).readingProgress.findUnique({
        where: { user_id_reading_plan_id: { user_id: user.id, reading_plan_id: entry.planId } },
      })

      const incomingRank = rank({ completed: entry.completed, current_day: entry.currentDay })

      // Corrected merge rule (audit finding: rank was previously the sole
      // gate for the entire entry, which meant a pause-only mutation —
      // same day/completed, only `paused` flipped — always tied and was
      // therefore always silently discarded). Rank now governs ONLY
      // whether day/completion advancement may move backwards; `paused`
      // is handled independently of it.
      if (existing) {
        const existingRank = rank(existing)

        if (existingRank > incomingRank) {
          // Existing is genuinely more advanced — incoming cannot regress
          // it. This is the one case where the incoming entry, including
          // its paused value, is correctly discarded in full.
          results.push({
            readingPlanId: entry.planId, currentDay: existing.current_day,
            completed: existing.completed, paused: existing.paused,
            startedAt: existing.started_at, completedAt: existing.completed_at,
          })
          continue
        }

        if (existingRank === incomingRank) {
          // Tie — day/completion genuinely unchanged, so there is nothing
          // to "advance," but a changed `paused` value must still be able
          // to persist (this is the exact defect the audit found).
          if (existing.paused !== entry.paused) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = await (prisma as any).readingProgress.update({
              where: { user_id_reading_plan_id: { user_id: user.id, reading_plan_id: entry.planId } },
              data:  { paused: entry.paused },
            })
            results.push({
              readingPlanId: entry.planId, currentDay: updated.current_day,
              completed: updated.completed, paused: updated.paused,
              startedAt: updated.started_at, completedAt: updated.completed_at,
            })
          } else {
            results.push({
              readingPlanId: entry.planId, currentDay: existing.current_day,
              completed: existing.completed, paused: existing.paused,
              startedAt: existing.started_at, completedAt: existing.completed_at,
            })
          }
          continue
        }
        // existingRank < incomingRank falls through to the full upsert below.
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved = await (prisma as any).readingProgress.upsert({
        where:  { user_id_reading_plan_id: { user_id: user.id, reading_plan_id: entry.planId } },
        create: {
          user_id: user.id, reading_plan_id: entry.planId,
          current_day: entry.currentDay, completed: entry.completed, paused: entry.paused,
          started_at: new Date(entry.startedAt),
          completed_at: entry.completed ? new Date() : null,
        },
        update: {
          current_day: entry.currentDay, completed: entry.completed, paused: entry.paused,
          completed_at: entry.completed ? new Date() : null,
        },
      })

      results.push({
        readingPlanId: entry.planId, currentDay: saved.current_day,
        completed: saved.completed, paused: saved.paused,
        startedAt: saved.started_at, completedAt: saved.completed_at,
      })
    }

    return successResponse(results, 'Reading progress synchronised successfully.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
