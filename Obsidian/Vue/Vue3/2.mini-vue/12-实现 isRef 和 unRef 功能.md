> [12-isRef-unRef](https://github.com/Atlanstis/mini-vue/tree/12-isRef-unRef)

现在需要实现这样一个功能：

1. 实现一个函数 **isRef**，传入一个参数，判断这个参数是否是通过 **ref** 函数创建的。
2. 实现一个函数 **unRef**，传入一个参数，判断这个参数是否是通过 **ref** 函数创建的；如果是，返回通过 **ref** 包裹前的值，不是则返回这个参数。

功能 1 的测试用例如下：

```typescript
it('isRef', () => {
  const a = ref(1);
  const user = reactive({ age: 1 });

  expect(isRef(a)).toBe(true);
  expect(isRef(1)).toBe(false);
  expect(isRef(user)).toBe(false);
});
```

通过 **ref** 函数最终返回的是 **RefImpl** 的实例，因此只要在 **RefImpl** 类中增加一个成员属性 **\_\_v_isRef** 标识即可。

```typescript
class RefImpl {
  private _value: any;
  private _rawValue: any;
  public __v_isRef = true;

  public dep = new Set();

  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    if (!hasChanged(this._rawValue, newVal)) return;
    this._value = convert(newVal);
    this._rawValue = newVal;
    triggerEffects(this.dep);
  }
}
```

在 **isRef** 中，只需判断传入的参数是否存在 **\_\_v_isRef** 标识即可。

```typescript
export function isRef(ref) {
  return !!ref.__v_isRef;
}
```

功能 2 的测试用例如下：

```typescript
it('unRef', () => {
  const a = ref(1);

  expect(unRef(a)).toBe(1);
  expect(unRef(1)).toBe(1);
});
```

在 **unRef** 函数中，通过 **isRef** 函数判断即可；**true** 返回其 **value** 属性的值，**false** 返回原值。

```typescript
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
```
