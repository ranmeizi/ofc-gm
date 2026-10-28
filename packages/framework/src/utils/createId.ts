/**
 * 生成唯一 id。
 * 优先用 crypto.randomUUID；不可用时退回时间戳 + 随机串。
 */
export function createId(prefix?: string): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

  return prefix ? `${prefix}_${id}` : id
}
