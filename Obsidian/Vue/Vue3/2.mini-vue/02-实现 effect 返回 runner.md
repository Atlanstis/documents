> [02-effect-runner](https://github.com/Atlanstis/mini-vue/tree/02-effect-runner)

现在需要实现这样一个功能：

1. 当调用 **effect** 之后，需返回一个 **function**，该 **function** 称之为 **runner**。
2. 该 **runner** 调用后，将再次执行传给 **effect** 内部的副作用函数 **fn**。并且该 **runner** 的调用可以获取到内部 **fn** 的返回值。

测试用例如下：

```typescript
it('should return runner when call effect', () => {
  let foo = 10;
  const runner = effect(() => {
    foo++;
    return 'foo';
  });
  expect(foo).toBe(11);
  const r = runner();
  expect(foo).toBe(12);
  expect(r).toBe('foo');
});
```

为实现该功能，首先修改 **effect** 函数，将最终执行的 **run** 函数返回，并修改其 **this** 指向。

```typescript
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();

  return _effect.run.bind(_effect);
}
```

再将 **fn** 执行后的结果返回。

```typescript
let activeEffect;

class ReactiveEffect {
  private _fn;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}
```
