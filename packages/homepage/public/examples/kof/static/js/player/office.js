import { Player } from './base.js'

/**
 * 自绘办公室角色（替换原 Kyo GIF / SNK 素材）。
 * 状态编号与原版一致：0 idle 1 前进 2 后退 3 跳 4 拳 5 挨打 6 倒地 7 冲 8 踢 9 跳拳 10 必杀
 */
export class OfficeFighter extends Player {
  constructor(root, info) {
    super(root, info)
    this.skin = info.skin || 'clerk'
    this.init_animations()
  }

  init_animations() {
    // 不加载 GIF；render 里用 canvas 自绘，并伪造 loaded 动画对象供帧逻辑复用
    const frameCounts = [8, 6, 6, 8, 6, 4, 6, 4, 6, 6, 10]
    for (let i = 0; i < 11; i++) {
      this.animations.set(i, {
        gif: { frames: [{ image: null }] },
        frame_cnt: frameCounts[i],
        frame_rate: i === 3 ? 4 : 5,
        offset_y: 0,
        offset_x: 0,
        loaded: true,
        scale: 1,
      })
    }
  }

  render() {
    let status = this.status
    if (this.status === 1 && this.direction * this.vx < 0) status = 2
    const obj = this.animations.get(status)
    if (!obj || !obj.loaded) {
      this.frame_current_cnt++
      return
    }

    const k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt
    this.drawOffice(status, k)

    if (status === 4 || status === 5 || status === 6 || status === 7 || status === 8 || status === 9 || status === 10) {
      if (this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) {
        if (status === 6) this.frame_current_cnt--
        else this.status = 0
      }
    }
    this.frame_current_cnt++
  }

  drawOffice(status, frame) {
    const ctx = this.ctx
    const bob = status === 1 || status === 2 ? Math.sin(frame) * 3 : 0
    const punch = status === 4 || status === 9 ? Math.min(frame, 3) * 14 : 0
    const kick = status === 8 ? Math.min(frame, 3) * 16 : 0
    const dash = status === 7 ? 8 : 0
    const special = status === 10

    ctx.save()
    const cx = this.x + this.width / 2
    const cy = this.y + this.height + bob
    ctx.translate(cx, cy)
    ctx.scale(this.direction, 1)

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(0, 0, 40, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    const body = this.skin === 'manager' ? '#204080' : this.skin === 'intern' ? '#208040' : '#c0c0c0'
    const accent = this.color || '#2060ff'

    // 腿
    ctx.fillStyle = '#303030'
    if (kick) {
      ctx.fillRect(8, -30, 18 + kick, 12)
      ctx.fillRect(-22, -30, 16, 28)
    } else {
      ctx.fillRect(-22, -30, 16, 28)
      ctx.fillRect(6, -30, 16, 28)
    }

    // 身
    ctx.fillStyle = body
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.fillRect(-28, -120, 56, 90)
    ctx.strokeRect(-28, -120, 56, 90)

    // 领带 / 工牌
    ctx.fillStyle = accent
    ctx.fillRect(-6, -110, 12, 40)
    ctx.fillStyle = '#ffffe0'
    ctx.fillRect(10, -100, 14, 10)

    // 头
    ctx.fillStyle = '#f0c8a0'
    ctx.fillRect(-18, -148, 36, 30)
    ctx.strokeRect(-18, -148, 36, 30)
    if (this.skin === 'manager') {
      ctx.fillStyle = '#202020'
      ctx.fillRect(-20, -152, 40, 8)
    }

    // 拳臂
    ctx.fillStyle = body
    if (punch) {
      ctx.fillRect(20, -100, 22 + punch, 14)
      ctx.strokeRect(20, -100, 22 + punch, 14)
    } else if (status === 5) {
      ctx.fillRect(-40, -95, 20, 14)
    } else {
      ctx.fillRect(-40, -95, 14, 36)
      ctx.fillRect(26, -95, 14, 36)
    }

    // 必杀光
    if (special) {
      ctx.strokeStyle = accent
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(0, -80, 50 + frame * 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.35
      ctx.fillRect(-60 - dash, -160, 140, 140)
      ctx.globalAlpha = 1
    }

    // 防御/冲刺残影
    if (status === 7) {
      ctx.globalAlpha = 0.4
      ctx.fillStyle = accent
      ctx.fillRect(-50, -120, 20, 90)
      ctx.globalAlpha = 1
    }

    ctx.restore()

    // 名牌
    ctx.fillStyle = '#ffffe0'
    ctx.font = 'bold 14px Tahoma, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.skin.toUpperCase(), cx, this.y - 8)
  }
}
