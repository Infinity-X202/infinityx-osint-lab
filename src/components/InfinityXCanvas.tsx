import { useEffect, useRef } from 'react'

type Kind = 'ambient' | 'energy' | 'ember' | 'spark' | 'smoke' | 'trail'

type Particle = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  r: number
  g: number
  b: number
  a: number
  t: number
  arm: number
}

type Arm = { ax: number; ay: number; bx: number; by: number }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function along(arm: Arm, t: number) {
  return {
    x: lerp(arm.ax, arm.bx, t),
    y: lerp(arm.ay, arm.by, t),
  }
}

function isLowPower() {
  const cores = navigator.hardwareConcurrency || 8
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  return cores <= 4 || (mem !== undefined && mem <= 4) || Boolean(saveData)
}

export function InfinityXCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!rawCtx) return
    const surface: HTMLCanvasElement = canvas
    const ctx: CanvasRenderingContext2D = rawCtx

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let mobile = window.matchMedia('(max-width: 767px)').matches
    let tablet = window.matchMedia('(max-width: 1024px)').matches && !mobile
    const low = isLowPower()

    let dprCap = mobile ? 1.15 : low ? 1.25 : 1.5
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    let w = 0
    let h = 0
    let raf = 0
    let running = true
    let t0 = performance.now()
    let last = t0
    let pulse = 0
    let sparkTimer = 0

    const mouse = { x: 0.5, y: 0.42, tx: 0.5, ty: 0.42, vx: 0, vy: 0, speed: 0 }
    const tilt = { x: 0, y: 0 }

    const counts = {
      ambient: 72,
      energy: 52,
      fire: 40,
      pool: 200,
    }

    const particles: Particle[] = []
    const pool: Particle[] = []

    function alloc(partial: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y'>): Particle {
      const p = pool.pop() ?? {
        kind: 'ambient',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 1,
        size: 1,
        r: 0,
        g: 229,
        b: 255,
        a: 1,
        t: 0,
        arm: 0,
      }
      Object.assign(p, {
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 1,
        size: 1.4,
        r: 0,
        g: 229,
        b: 255,
        a: 0.7,
        t: 0,
        arm: 0,
        ...partial,
      })
      particles.push(p)
      return p
    }

    function recycle(i: number) {
      const p = particles[i]
      particles[i] = particles[particles.length - 1]
      particles.pop()
      if (p && pool.length < counts.pool) pool.push(p)
    }

    function geometry() {
      const size = Math.min(w, h) * (mobile ? 0.92 : tablet ? 1.08 : 1.22)
      const cx = w * 0.5 + tilt.x * 28
      const cy = h * 0.38 + tilt.y * 22
      const s = size * (1 + Math.sin((performance.now() - t0) / 1000) * 0.012)
      const arms: Arm[] = [
        { ax: cx - s * 0.46, ay: cy - s * 0.5, bx: cx + s * 0.46, by: cy + s * 0.5 },
        { ax: cx + s * 0.46, ay: cy - s * 0.5, bx: cx - s * 0.46, by: cy + s * 0.5 },
      ]
      const tips = [
        { x: arms[0].ax, y: arms[0].ay, dx: arms[0].ax - arms[0].bx, dy: arms[0].ay - arms[0].by },
        { x: arms[0].bx, y: arms[0].by, dx: arms[0].bx - arms[0].ax, dy: arms[0].by - arms[0].ay },
        { x: arms[1].ax, y: arms[1].ay, dx: arms[1].ax - arms[1].bx, dy: arms[1].ay - arms[1].by },
        { x: arms[1].bx, y: arms[1].by, dx: arms[1].bx - arms[1].ax, dy: arms[1].by - arms[1].ay },
      ]
      return { cx, cy, s, arms, tips }
    }

    function seed() {
      particles.length = 0
      for (let i = 0; i < counts.ambient; i++) {
        alloc({
          kind: 'ambient',
          x: Math.random() * Math.max(w, 1),
          y: Math.random() * Math.max(h, 1),
          vx: (Math.random() - 0.5) * 0.12,
          vy: -0.05 - Math.random() * 0.12,
          life: 0.4 + Math.random() * 0.6,
          maxLife: 6 + Math.random() * 10,
          size: 0.6 + Math.random() * 1.4,
          r: Math.random() > 0.2 ? 0 : 108,
          g: 229 + Math.random() * 26,
          b: 255,
          a: 0.18 + Math.random() * 0.35,
        })
      }
      for (let i = 0; i < counts.energy; i++) {
        alloc({
          kind: 'energy',
          x: 0,
          y: 0,
          t: Math.random(),
          arm: i % 2,
          life: 1,
          maxLife: 4 + Math.random() * 6,
          size: 1.1 + Math.random() * 1.8,
          r: 34,
          g: 240,
          b: 208,
          a: 0.55,
        })
      }
      for (let i = 0; i < counts.fire; i++) {
        alloc({
          kind: 'ember',
          x: 0,
          y: 0,
          t: Math.random(),
          arm: i % 4,
          life: 0.3 + Math.random() * 0.7,
          maxLife: 0.7 + Math.random() * 1.1,
          size: 1.2 + Math.random() * 2.4,
          r: 255,
          g: 90 + Math.random() * 90,
          b: 0,
          a: 0.7,
        })
      }
    }

    function resize() {
      mobile = window.matchMedia('(max-width: 767px)').matches
      tablet = window.matchMedia('(max-width: 1024px)').matches && !mobile
      dprCap = mobile ? 1.15 : low ? 1.25 : 1.5
      counts.ambient = reduced ? 0 : mobile || low ? 28 : tablet ? 48 : 72
      counts.energy = reduced ? 0 : mobile || low ? 22 : tablet ? 36 : 52
      counts.fire = reduced ? 0 : mobile || low ? 18 : tablet ? 28 : 40
      counts.pool = reduced ? 0 : mobile || low ? 90 : tablet ? 140 : 200
      const parent = surface.parentElement
      w = parent?.clientWidth || window.innerWidth
      h = parent?.clientHeight || window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      surface.width = Math.max(1, Math.floor(w * dpr))
      surface.height = Math.max(1, Math.floor(h * dpr))
      surface.style.width = `${w}px`
      surface.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    function drawArmLayers(arm: Arm, breath: number, near: number, heat: number) {
      const layers = [
        { width: mobile ? 48 : 88, color: `rgba(0, 229, 255, ${0.07 + breath * 0.04 + near * 0.03})`, blur: 48 },
        { width: mobile ? 26 : 44, color: `rgba(34, 240, 208, ${0.16 + breath * 0.07 + near * 0.05})`, blur: 24 },
        { width: mobile ? 13 : 18, color: `rgba(108, 255, 255, ${0.48 + breath * 0.12})`, blur: 12 },
        { width: mobile ? 4 : 6, color: `rgba(255, 255, 255, ${0.82 + breath * 0.1})`, blur: 5 },
      ]
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = 'lighter'
      for (const layer of layers) {
        ctx.strokeStyle = layer.color
        ctx.lineWidth = layer.width
        ctx.shadowColor = 'rgba(0, 229, 255, 0.55)'
        ctx.shadowBlur = layer.blur * (0.85 + breath * 0.4 + near * 0.35)
        ctx.beginPath()
        ctx.moveTo(arm.ax, arm.ay)
        ctx.lineTo(arm.bx, arm.by)
        ctx.stroke()
      }
      if (heat > 0.15) {
        const tipLen = 0.16
        for (const end of [0, 1] as const) {
          const a = end === 0 ? { x: arm.ax, y: arm.ay } : { x: arm.bx, y: arm.by }
          const b = end === 0 ? along(arm, tipLen) : along(arm, 1 - tipLen)
          const wave = Math.sin(performance.now() / 90 + end * 2) * 2.2
          ctx.strokeStyle = `rgba(255, 106, 0, ${0.18 + heat * 0.22})`
          ctx.lineWidth = (mobile ? 10 : 18) + heat * 6
          ctx.shadowColor = 'rgba(255, 176, 0, 0.9)'
          ctx.shadowBlur = 28
          ctx.beginPath()
          ctx.moveTo(a.x + wave, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 + heat * 0.2})`
          ctx.lineWidth = mobile ? 3 : 4.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    function drawTips(tips: ReturnType<typeof geometry>['tips'], heat: number, time: number) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const tip of tips) {
        const flicker = 0.75 + Math.sin(time * 9 + tip.x * 0.01) * 0.25
        const r = (mobile ? 22 : 42) * (0.9 + heat * 0.55) * flicker
        const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, r * 2.6)
        g.addColorStop(0, `rgba(255, 255, 255, ${0.28 + heat * 0.2})`)
        g.addColorStop(0.16, `rgba(255, 176, 0, ${0.38 + heat * 0.22})`)
        g.addColorStop(0.38, `rgba(255, 106, 0, ${0.16 + heat * 0.14})`)
        g.addColorStop(1, 'rgba(0, 229, 255, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(tip.x, tip.y, r * 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawPulse(cx: number, cy: number, s: number) {
      if (pulse <= 0.01) return
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const r = s * (0.12 + (1 - pulse) * 0.55)
      ctx.strokeStyle = `rgba(0, 229, 255, ${pulse * 0.45})`
      ctx.lineWidth = 2.5 * pulse
      ctx.shadowColor = '#00E5FF'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = `rgba(255, 176, 0, ${pulse * 0.18})`
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    function canSpawn(n = 1) {
      return particles.length + n < counts.pool
    }

    function spawnSparks(x: number, y: number, n: number, towardX?: number, towardY?: number) {
      if (!canSpawn(n)) return
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2
        const sp = 0.6 + Math.random() * 2.8
        const fire = Math.random() > 0.45
        alloc({
          kind: 'spark',
          x,
          y,
          vx: Math.cos(ang) * sp + (towardX ?? 0) * 0.15,
          vy: Math.sin(ang) * sp + (towardY ?? 0) * 0.15,
          life: 1,
          maxLife: 0.28 + Math.random() * 0.4,
          size: 0.8 + Math.random() * 1.8,
          r: fire ? 255 : 108,
          g: fire ? 140 : 255,
          b: fire ? 20 : 255,
          a: 0.9,
        })
      }
    }

    function spawnTrail(x: number, y: number, vx: number, vy: number) {
      if (!canSpawn()) return
      alloc({
        kind: 'trail',
        x,
        y,
        vx: vx * 0.04,
        vy: vy * 0.04,
        life: 1,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 1.6,
        r: 0,
        g: 229,
        b: 255,
        a: 0.55,
      })
    }

    function updateParticles(geo: ReturnType<typeof geometry>, dt: number, mx: number, my: number, near: number) {
      const { arms, tips } = geo
      const mag = reduced ? 0 : 42 + near * 28

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt / p.maxLife

        if (p.kind === 'energy') {
          p.t = (p.t + dt * (0.08 + near * 0.06)) % 1
          const pt = along(arms[p.arm], p.t)
          const pullx = (mx - pt.x) * 0.04
          const pully = (my - pt.y) * 0.04
          p.x = pt.x + pullx
          p.y = pt.y + pully
          p.a = 0.35 + (1 - Math.abs(p.t - 0.5) * 1.2) * 0.4
        } else if (p.kind === 'ember') {
          const tip = tips[p.arm % 4]
          const len = Math.hypot(tip.dx, tip.dy) || 1
          const nx = tip.dx / len
          const ny = tip.dy / len
          if (p.life <= 0) {
            p.life = 1
            p.x = tip.x + (Math.random() - 0.5) * 10
            p.y = tip.y + (Math.random() - 0.5) * 10
            p.vx = nx * (0.4 + Math.random() * 1.1) + (Math.random() - 0.5) * 0.5
            p.vy = ny * (0.4 + Math.random() * 1.1) - 0.35 - Math.random() * 0.7
            p.size = 1 + Math.random() * 2.2
          }
          p.vx += (mx - p.x) / mag * 0.35
          p.vy += (my - p.y) / mag * 0.35 - dt * 8
          p.x += p.vx
          p.y += p.vy
          if (Math.random() < dt * 0.8 && canSpawn()) {
            alloc({
              kind: 'smoke',
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.2,
              vy: -0.35,
              life: 1,
              maxLife: 0.8 + Math.random() * 0.7,
              size: 6 + Math.random() * 10,
              r: 180,
              g: 220,
              b: 230,
              a: 0.12,
            })
          }
        } else {
          const dx = mx - p.x
          const dy = my - p.y
          const dist = Math.hypot(dx, dy) + 1
          const force = (p.kind === 'ambient' ? 18 : 8) / dist
          p.vx += (dx / dist) * force * dt * (p.kind === 'trail' ? 0.2 : 1)
          p.vy += (dy / dist) * force * dt * (p.kind === 'trail' ? 0.2 : 1)
          if (p.kind === 'ambient') {
            p.vx *= 0.98
            p.vy *= 0.98
            p.x += p.vx + Math.sin((p.y + performance.now() * 0.001) * 0.02) * 0.15
            p.y += p.vy
            if (p.y < -8) p.y = h + 8
            if (p.x < -8) p.x = w + 8
            if (p.x > w + 8) p.x = -8
            if (p.life <= 0) p.life = 1
          } else {
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.96
            p.vy *= 0.96
          }
        }

        if (p.kind !== 'ambient' && p.kind !== 'energy' && p.kind !== 'ember' && p.life <= 0) {
          recycle(i)
        }
      }
    }

    function drawParticles() {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const fade = p.kind === 'ambient' || p.kind === 'energy' ? 1 : clamp(p.life, 0, 1)
        const alpha = p.a * fade
        if (alpha < 0.02) continue
        if (p.kind === 'smoke') {
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.35})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (1.2 - fade * 0.2), 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawNoise() {
      if (mobile || low) return
      ctx.save()
      ctx.globalAlpha = 0.035
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 3 === 0 ? '#6CFFFF' : '#ffffff'
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }
      ctx.restore()
    }

    function drawStatic() {
      const geo = geometry()
      ctx.clearRect(0, 0, w, h)
      drawArmLayers(geo.arms[0], 0.5, 0, 0.35)
      drawArmLayers(geo.arms[1], 0.5, 0, 0.35)
      drawTips(geo.tips, 0.35, 0)
    }

    function frame(now: number) {
      if (!running) return
      const dt = clamp((now - last) / 1000, 0.001, 0.033)
      last = now
      const time = (now - t0) / 1000

      mouse.x = lerp(mouse.x, mouse.tx, 0.08)
      mouse.y = lerp(mouse.y, mouse.ty, 0.08)
      tilt.x = lerp(tilt.x, reduced ? 0 : (mouse.x - 0.5) * 1.15, 0.06)
      tilt.y = lerp(tilt.y, reduced ? 0 : (mouse.y - 0.42) * 0.9, 0.06)
      pulse = Math.max(0, pulse - dt * 1.6)

      const geo = geometry()
      const mx = mouse.x * w
      const my = mouse.y * h
      const dist = Math.hypot(mx - geo.cx, my - geo.cy) / (geo.s * 0.55)
      const near = reduced ? 0 : clamp(1.15 - dist, 0, 1)
      const breath = 0.45 + Math.sin(time * 1.05) * 0.28
      const heat = 0.42 + near * 0.38 + Math.sin(time * 3.2) * 0.08 + pulse * 0.25

      ctx.clearRect(0, 0, w, h)

      ctx.save()
      ctx.translate(geo.cx, geo.cy)
      ctx.rotate(tilt.x * 0.045)
      ctx.scale(1 + tilt.y * 0.012, 1 - tilt.x * 0.008)
      ctx.translate(-geo.cx, -geo.cy)

      drawArmLayers(geo.arms[0], breath + pulse * 0.35, near, heat)
      drawArmLayers(geo.arms[1], breath + pulse * 0.35, near, heat)
      drawTips(geo.tips, heat, time)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const core = ctx.createRadialGradient(geo.cx, geo.cy, 0, geo.cx, geo.cy, geo.s * 0.18)
      core.addColorStop(0, `rgba(255,255,255,${0.16 + breath * 0.08 + pulse * 0.12})`)
      core.addColorStop(0.35, `rgba(0,229,255,${0.12 + near * 0.08})`)
      core.addColorStop(1, 'rgba(0,229,255,0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(geo.cx, geo.cy, geo.s * 0.18, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.restore()

      if (!reduced) {
        updateParticles(geo, dt, mx, my, near)
        drawParticles()
        sparkTimer += dt
        if (sparkTimer > 1.8 + Math.random()) {
          sparkTimer = 0
          const tip = geo.tips[Math.floor(Math.random() * 4)]
          spawnSparks(tip.x, tip.y, mobile ? 2 : 5)
        }
      }

      drawPulse(geo.cx, geo.cy, geo.s)
      drawNoise()
      raf = requestAnimationFrame(frame)
    }

    function onMove(e: PointerEvent) {
      const rect = surface.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1)
      const ny = (e.clientY - rect.top) / Math.max(rect.height, 1)
      const prevX = mouse.tx
      const prevY = mouse.ty
      mouse.tx = clamp(nx, 0, 1)
      mouse.ty = clamp(ny, 0, 1)
      mouse.vx = (mouse.tx - prevX) * rect.width
      mouse.vy = (mouse.ty - prevY) * rect.height
      mouse.speed = Math.hypot(mouse.vx, mouse.vy)
      if (!reduced && mouse.speed > 26) {
        spawnTrail(e.clientX - rect.left, e.clientY - rect.top, mouse.vx, mouse.vy)
        if (mouse.speed > 48) spawnSparks(e.clientX - rect.left, e.clientY - rect.top, 2, mouse.vx, mouse.vy)
      }
    }

    function onDown() {
      if (reduced) return
      pulse = 1
      const geo = geometry()
      spawnSparks(geo.cx, geo.cy, mobile ? 7 : 14)
      for (const tip of geo.tips) spawnSparks(tip.x, tip.y, mobile ? 2 : 3)
    }

    function onVis() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('visibilitychange', onVis)

    if (reduced) {
      drawStatic()
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
