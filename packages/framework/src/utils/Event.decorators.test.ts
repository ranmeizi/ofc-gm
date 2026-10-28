import { describe, expect, it, jest } from '@jest/globals'
import { EventTarget, Handler, type EventCapable } from './Event.decorators'

describe('EventTarget / Handler', () => {
  it('entry', () => {

    // 类型
    interface Test extends EventCapable {}

    @EventTarget
    class Test {
        @Handler('data')
        onData(data: any) {
            console.log('data', data)
        }
    }

    const test = new Test()
    const data = { name: 'test' }
    test.emit('data', data)
  })
})
