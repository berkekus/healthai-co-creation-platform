/**
 * End-to-end smoke test: register → login → createPost → publishPost → requestMeeting
 *
 * Requires a running backend server.
 * Usage:
 *   BASE_URL=http://localhost:5000 npx ts-node-dev --transpile-only scripts/smoke-test.ts
 *   npm run smoke
 */

const BASE = (process.env.BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '')

let passed = 0
let failed = 0

function step(label: string) {
  process.stdout.write(`  ${label} ... `)
}

function ok() {
  console.log('\x1b[32m✓\x1b[0m')
  passed++
}

function fail(msg: string) {
  console.log(`\x1b[31m✗\x1b[0m  ${msg}`)
  failed++
}

async function req<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {}
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const body = (await res.json()) as T
  return { status: res.status, body }
}

function unique() {
  return `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

async function run() {
  console.log(`\nSmoke test → ${BASE}\n`)

  // ── 1. Health ──────────────────────────────────────────────────────────────
  step('GET /health')
  try {
    const { status, body } = await req<{ status: string }>('GET', '/health')
    if (status === 200 && (body as any).status === 'ok') ok()
    else fail(`status=${status}`)
  } catch (e) {
    fail(`unreachable — is the server running? (${(e as Error).message})`)
    console.log('\nCannot continue without a running server.\n')
    process.exit(1)
  }

  // ── 2. Register user A (engineer) ──────────────────────────────────────────
  const emailA = `${unique()}@smoke.edu`
  let tokenA = ''
  let userAId = ''
  let userAName = ''

  step('POST /api/auth/register (user A)')
  try {
    const { status, body } = await req<any>('POST', '/api/auth/register', {
      body: {
        name: 'Smoke Engineer',
        email: emailA,
        password: 'password123',
        role: 'engineer',
        institution: 'Smoke University',
        city: 'Istanbul',
        country: 'Turkey',
      },
    })
    // Register returns 201 with user but no token (email verification flow)
    if (status === 201 && body.data?.user?.id) {
      userAId = body.data.user.id
      userAName = body.data.user.name
      ok()
    } else {
      fail(`status=${status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 3. Login as user A (dev: email verification not enforced) ─────────────
  step('POST /api/auth/login (user A)')
  try {
    const { status, body } = await req<any>('POST', '/api/auth/login', {
      body: { email: emailA, password: 'password123' },
    })
    if (status === 200 && body.data?.token) {
      tokenA = body.data.token
      ok()
    } else {
      fail(`status=${status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 4. GET /api/auth/me ────────────────────────────────────────────────────
  step('GET /api/auth/me')
  try {
    const { status, body } = await req<any>('GET', '/api/auth/me', { token: tokenA })
    if (status === 200 && body.data?.email === emailA) ok()
    else fail(`status=${status}`)
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 5. Create draft post ───────────────────────────────────────────────────
  let postId = ''
  let postTitle = ''

  step('POST /api/posts (draft)')
  try {
    const { status, body } = await req<any>('POST', '/api/posts', {
      token: tokenA,
      body: {
        title: 'Smoke Test Post',
        domain: 'cardiology',
        expertiseRequired: 'Machine Learning',
        description: 'Automated smoke test post — safe to ignore.',
        projectStage: 'idea',
        collaborationType: 'research_partner',
        confidentiality: 'public_pitch',
        city: 'Istanbul',
        country: 'Turkey',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    if (status === 201 && body.data?.id) {
      postId = body.data.id
      postTitle = body.data.title
      ok()
    } else {
      fail(`status=${status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 6. Publish post ────────────────────────────────────────────────────────
  step(`POST /api/posts/:id/publish`)
  if (!postId) {
    fail('skipped — no postId')
  } else {
    try {
      const { status, body } = await req<any>('POST', `/api/posts/${postId}/publish`, { token: tokenA })
      // publishPost sets status to 'active'
      if (status === 200 && body.data?.status === 'active') ok()
      else fail(`status=${status} body=${JSON.stringify(body)}`)
    } catch (e) {
      fail((e as Error).message)
    }
  }

  // ── 7. Register + login user B (healthcare professional) ─────────────────
  const emailB = `${unique()}@smoke.edu`
  let tokenB = ''

  step('POST /api/auth/register (user B)')
  try {
    const { status, body } = await req<any>('POST', '/api/auth/register', {
      body: {
        name: 'Smoke Doctor',
        email: emailB,
        password: 'password123',
        role: 'healthcare_professional',
        institution: 'Smoke Hospital',
        city: 'Berlin',
        country: 'Germany',
      },
    })
    if (status === 201 && body.data?.user?.id) ok()
    else fail(`status=${status} body=${JSON.stringify(body)}`)
  } catch (e) {
    fail((e as Error).message)
  }

  step('POST /api/auth/login (user B)')
  try {
    const { status, body } = await req<any>('POST', '/api/auth/login', {
      body: { email: emailB, password: 'password123' },
    })
    if (status === 200 && body.data?.token) {
      tokenB = body.data.token
      ok()
    } else {
      fail(`status=${status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 8. Request meeting (user B → post owned by user A) ────────────────────
  step('POST /api/meetings (user B requests)')
  if (!postId || !tokenB) {
    fail('skipped — missing postId or tokenB')
  } else {
    try {
      const { status, body } = await req<any>('POST', '/api/meetings', {
        token: tokenB,
        body: {
          postId,
          postTitle,
          ownerId: userAId,
          ownerName: userAName,
          message: 'Smoke test meeting request — safe to ignore. This is a longer message to pass the 20-char minimum.',
          ndaAccepted: true,
          proposedSlots: [
            { date: '2025-06-01', time: '10:00' },
            { date: '2025-06-02', time: '14:00' },
            { date: '2025-06-03', time: '09:00' },
          ],
        },
      })
      if (status === 201 && body.data?.id) ok()
      else fail(`status=${status} body=${JSON.stringify(body)}`)
    } catch (e) {
      fail((e as Error).message)
    }
  }

  // ── 9. Wrong password → 401 ────────────────────────────────────────────────
  step('POST /api/auth/login wrong-password → 401')
  try {
    const { status } = await req<any>('POST', '/api/auth/login', {
      body: { email: emailA, password: 'wrongpassword' },
    })
    if (status === 401) ok()
    else fail(`expected 401, got ${status}`)
  } catch (e) {
    fail((e as Error).message)
  }

  // ── 10. No token → 401 ────────────────────────────────────────────────────
  step('GET /api/auth/me no-token → 401')
  try {
    const { status } = await req<any>('GET', '/api/auth/me')
    if (status === 401) ok()
    else fail(`expected 401, got ${status}`)
  } catch (e) {
    fail((e as Error).message)
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = passed + failed
  const colour = failed === 0 ? '\x1b[32m' : '\x1b[31m'
  console.log(`\n${colour}${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}\x1b[0m\n`)

  if (failed > 0) process.exit(1)
}

run().catch((e) => {
  console.error('\nUnexpected error:', e)
  process.exit(1)
})
