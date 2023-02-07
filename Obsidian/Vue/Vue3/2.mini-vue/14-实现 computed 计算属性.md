> [14-computed](https://github.com/Atlanstis/mini-vue/tree/14-computed)

现在需要实现这样一个功能：

1. 实现一个函数 **computed**，该函数接受一个方法 **getter**，**computed** 返回一个响应式对象，其 **value** 值等于 **getter** 执行后的结果。
2. 当访问返回值的 **value** 属性时，**getter** 才会被执行；再次访问 **value** 属性，**getter** 方法也不会被执行。
3. 当 **getter** 中，依赖的响应式对象的值发生变化后，再次访问 **value** 属性，**getter** 才会再次执行。

测试用例如下：

```typescript
it('happy path', () => {
  const user = reactive({ age: 1 });

  const age = computed(() => {
    return user.age;
  });

  expect(age.value).toBe(1);
});
```

首先，新建一个 **ComoutedRefImpl** 类，用于包裹传入的 **getter** 方法。

在 **computed** 函数中，返回 **ComoutedRefImpl** 的实例，当访问 **value** 属性时，调用 **getter** 方法并返回。

```typescript
class ComoutedRefImpl {
  private _getter: any;

  constructor(getter) {
    this._getter = getter;
  }

  get value() {
    return this._getter();
  }
}

export function computed(getter) {
  return new ComoutedRefImpl(getter);
}
```

为实现惰性的执行方式，可以在 **ComoutedRefImpl** 中增加两个成员 **\_dirty** 与 **\_value** 分别判断 **getter** 是否执行和记录执行后的值。

在通过 **value** 属性获取值时判断 **\_dirty** 是通过执行 **getter** 获取，还是 直接返回 **\_value**。

```typescript
class ComoutedRefImpl {
  private _getter: any;
  private _value: any;
  private _dirty = true;

  constructor(getter) {
    this._getter = getter;
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._getter();
    }
    return this._value;
  }
}
```

由于随着依赖的响应式对象属性的变更，**value** 的值会在被访问时，再次触发 **getter**。因此 **ComoutedRefImpl** 的实例需要被通知到，在 **ComoutedRefImpl** 类中，增加一个 **\_effect** 属性，其值为 **ReactiveEffect** 的实例，并传入 **getter**。由于，变更后无需立即触发 **getter**，配合 **scheduler** 更改 **\_dirty** 的值，以便访问 **value** 属性时，触发 **getter**。

```typescript
class ComoutedRefImpl {
  private _getter: any;
  private _value: any;
  private _dirty = true;
  private _effect;

  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}
```
