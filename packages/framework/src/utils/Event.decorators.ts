/**
 * 事件装饰器：
 * - @Handler(name)  方法装饰器：把「方法 → 事件名」记到元数据
 * - @EventTarget()  类装饰器：挂上 on/off/emit，并在构造后自动绑定 Handler
 *
 * 类型：TS 不会从类装饰器推断 on/off/emit，请对使用方做 interface 合并
 * （见 App.ts），或改用 Mixin。
 */

export type EventListener = (...args: any[]) => void

export type EventCapable = {
  on(event: string, listener: EventListener): void
  off(event: string, listener: EventListener): void
  emit(event: string, ...args: any[]): void
}

type HandlerMeta = { event: string; method: string | symbol }

/** 构造函数 → 该方法类上声明的 @Handler 列表 */
const handlerMeta = new Map<Function, HandlerMeta[]>()

function getOrCreateMeta(ctor: Function): HandlerMeta[] {
  let list = handlerMeta.get(ctor)
  if (!list) {
    list = []
    handlerMeta.set(ctor, list)
  }
  return list
}

/**
 * 收集本类及父类上的 Handler（支持继承链上继续 @Handler）
 */
function collectHandlers(ctor: Function): HandlerMeta[] {
  const out: HandlerMeta[] = []
  let cur: Function | null = ctor
  while (cur && cur !== Function.prototype) {
    const list = handlerMeta.get(cur)
    if (list) out.push(...list)
    cur = Object.getPrototypeOf(cur.prototype)?.constructor ?? null
    if (cur === Object) break
  }
  return out
}

/**
 * 方法装饰器：注册「这个方法处理哪个事件」
 *
 * @example
 *   @Handler('connect')
 *   onConnect() { ... }
 */
export function Handler(event: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    // target 是原型；ctor 是类本身
    const ctor = (target as object).constructor
    getOrCreateMeta(ctor).push({ event, method: propertyKey })
  }
}

/** 实例 → 监听器表（避免导出匿名类上的 private 触发 TS4094） */
const eventsStore = new WeakMap<object, Record<string, EventListener[]>>()

function getEvents(instance: object): Record<string, EventListener[]> {
  let map = eventsStore.get(instance)
  if (!map) {
    map = {}
    eventsStore.set(instance, map)
  }
  return map
}

type Ctor = new (...args: any[]) => object

/**
 * 类装饰器：
 * 1. 混入 on / off / emit
 * 2. 构造完成后，把 @Handler 方法绑到对应事件上
 */
export function EventTarget<T extends Ctor>(Base: T) {
  return class EventTargetMixed extends Base implements EventCapable {
    constructor(...args: any[]) {
      super(...args)
      // 元数据在方法装饰器阶段已写完；这里只负责接线
      for (const { event, method } of collectHandlers(Base)) {
        const fn = (this as any)[method]
        if (typeof fn !== 'function') continue
        this.on(event, fn.bind(this))
      }
    }

    on(event: string, listener: EventListener) {
      const events = getEvents(this)
      ;(events[event] ??= []).push(listener)
    }

    off(event: string, listener: EventListener) {
      const list = getEvents(this)[event]
      if (!list) return
      getEvents(this)[event] = list.filter((l) => l !== listener)
    }

    emit(event: string, ...args: any[]) {
      getEvents(this)[event]?.forEach((l) => l(...args))
    }
  }
}
