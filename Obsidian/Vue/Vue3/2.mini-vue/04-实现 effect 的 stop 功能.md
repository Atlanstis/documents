现在需要实现这样一个功能：

- 实现一个 **stop** 函数，该函数的参数为 **effect** 函数的返回值 **runner**。
- **stop** 函数执行后，将清除 **effect** 第一个参数 **fn** 的响应式效果。
- 仅能通过执行 **runner** 函数，执行 **fn**；

测试用例如下：

```typescript
it('stop', () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });
  obj.prop = 2;
  expect(dummy).toBe(2);
  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);
  runner();
  expect(dummy).toBe(3);
});
```

首先新建一个函数 **stop**，其主要目的是清除 **fn** 函数中相关响应式对象的依赖。

```typescript
export function stop(runner) {
  runner.effect.stop();
}
```

当前情况下，**fn** 的包装实例 **\_effect** 与 **runner** 还没有任何联系，因此通过在 **effect** 函数中，将 **\_effect** 挂载到 **runner** 上。

```typescript
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}
```

之前在收集依赖时，在 **track** 函数中，仅收集响应式对象属性的依赖，这里可以进行反向操作，将 **\_effect** 中添加 **deps** 属性，收集相关响应式属性的依赖。

```typescript
export function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}
```

在 **fn** 的包装类中，增加 **stop** 方法与 **deps** 属性。

```typescript
class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}
```

在 **stop** 方法中，再通过 **cleanupEffect** 函数，遍历清除即可。

```typescript
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
}
```

为增加性能，通过增加 **active** 属性，在多次调用 **stop** 函数时，减少循环。

再实现如下功能：

- 调用 **effect** 函数时，第二个参数中可通过传入一个属性 **onStop** 函数，当上述 **stop** 函数执行后，**onStop** 函数会被调用。

测试用例如下：

```typescript
it('onStop', () => {
  const obj = reactive({ foo: 1 });
  const onStop = jest.fn();
  let dummy;
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      onStop,
    },
  );
  stop(runner);
  expect(onStop).toBeCalledTimes(1);
  expect(dummy).toBe(1);
});
```

首先在 **effect** 函数中，处理第二个参数 **options** 的 **onStop** 函数，通过 **extend** 函数将之挂载到 **\_effect** 实例上。

```typescript
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  extend(_effect, options);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}
```

**extend** 函数实现如下：

```typescript
export const extend = Object.assign;
```

**ReactiveEffect** 类中，增加 **onStop** 属性，在 **stop** 函数被执行后，调用 **onStop**。

```typescript
class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  onStop?: () => void;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
      if (this.onStop) {
        this.onStop();
      }
    }
  }
}
```
