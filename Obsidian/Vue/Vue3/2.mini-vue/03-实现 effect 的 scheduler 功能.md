> [03-effect-scheduler](https://github.com/Atlanstis/mini-vue/tree/03-effect-scheduler)

现在需要实现这样一个功能：

1.  通过 **effect** 的第二个参数给定的一个 **options**，包含一个属性 **scheduler**。
2.  当 **effect** 第一次执行时还会执行第一个参数 **fn。**
3.  当响应式对象发生属性改变时，不会执行第一个参数 **fn**，而是执行第二个参数 **options** 中 **scheduler。**
4.  当执行 **runner** 时，会再次执行 **fn**。

测试用例如下：

```typescript
it('scheduler', () => {
  let dummy;
  let run;
  const scheduler = jest.fn(() => {
    run = runner;
  });
  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      scheduler,
    },
  );

  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);
  obj.foo++;
  expect(scheduler).toHaveBeenCalledTimes(1);
  expect(dummy).toBe(1);
  run();
  expect(dummy).toBe(2);
});
```

为实现这一功能，首先找到触发更新操作的 **trigger**，当其存在 **scheduler** 属性时，执行传递进去的 **scheduler**，否则执行原来的 **run**。

```typescript
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  deps.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
```

接着就是解决 **scheduler** 属性的传递问题，在初始化时，通过配置的方式传入：

```typescript
class ReactiveEffect {
  private _fn;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  return _effect.run.bind(_effect);
}
```
