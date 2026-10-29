/**
 * Fork: Magicherry/King-of-Fighters Controller
 * + OFC 远程按键注入（remote_pressed）
 */
export class Controller {
  constructor($canvas) {
    this.$canvas = $canvas
    this.pressed_keys = new Set()
    /** @type {Set<string>} 对端抽象键：w a d j k Shift ' ' */
    this.remote_abstract = new Set()
    /** 本机控制的玩家 id：0=Guest 左，1=Host 右 */
    this.local_id = 0
    this._onKeyDown = null
    this._onKeyUp = null
    this.start()
  }

  start() {
    const outer = this
    this.$canvas.keydown(function (e) {
      outer.pressed_keys.add(e.key)
      if (typeof window.__ofcOnLocalKeys === 'function') {
        window.__ofcOnLocalKeys([...outer.pressed_keys])
      }
    })
    this.$canvas.keyup(function (e) {
      outer.pressed_keys.delete(e.key)
      if (typeof window.__ofcOnLocalKeys === 'function') {
        window.__ofcOnLocalKeys([...outer.pressed_keys])
      }
    })
  }

  setRemoteAbstract(keys) {
    this.remote_abstract = new Set(keys || [])
  }

  /** 把抽象键映射成该玩家原来的物理键名 */
  abstractToPhysical(id, abstract) {
    const out = new Set()
    if (id === 0) {
      if (abstract.has('w')) out.add('w')
      if (abstract.has('a')) out.add('a')
      if (abstract.has('d')) out.add('d')
      if (abstract.has('j')) out.add('j')
      if (abstract.has('k')) out.add('k')
      if (abstract.has('Shift')) out.add('Shift')
      if (abstract.has(' ')) out.add(' ')
    } else {
      if (abstract.has('w')) out.add('ArrowUp')
      if (abstract.has('a')) out.add('ArrowLeft')
      if (abstract.has('d')) out.add('ArrowRight')
      if (abstract.has('j')) out.add('1')
      if (abstract.has('k')) out.add('2')
      if (abstract.has('Shift')) out.add('.')
      if (abstract.has(' ')) out.add('Enter')
    }
    return out
  }

  /** 本机 WASD 等 → 抽象键（两边统一用左键位操作） */
  physicalToAbstract(keys) {
    const a = new Set()
    if (keys.has('w') || keys.has('ArrowUp')) a.add('w')
    if (keys.has('a') || keys.has('ArrowLeft')) a.add('a')
    if (keys.has('d') || keys.has('ArrowRight')) a.add('d')
    if (keys.has('j') || keys.has('1') || keys.has('z') || keys.has('Z')) a.add('j')
    if (keys.has('k') || keys.has('2') || keys.has('x') || keys.has('X')) a.add('k')
    if (keys.has('Shift') || keys.has('.')) a.add('Shift')
    if (keys.has(' ') || keys.has('Enter')) a.add(' ')
    return a
  }

  /** 给 Player 用：合并本机/远端后映射到该 id 的物理键 */
  keysForPlayer(id) {
    const localAbs = this.physicalToAbstract(this.pressed_keys)
    if (id === this.local_id) {
      // 本机：始终用 WASD 操作，映射到自己的 id
      return this.abstractToPhysical(id, localAbs)
    }
    return this.abstractToPhysical(id, this.remote_abstract)
  }
}
