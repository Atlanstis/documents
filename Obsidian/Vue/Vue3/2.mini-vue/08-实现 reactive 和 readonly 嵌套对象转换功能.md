> [08-reactive-readonly-nest](https://github.com/Atlanstis/mini-vue/tree/08-reactive-readonly-nest)

当前情况下，通过 **reactive** 和 **readonly** 创建的响应式对象只代理了第一层，当原始数据复杂时，其子对象并非为响应式对象。

因此，需实现以下功能：

- 将原始数据中的子对象也转化为响应式对象。

测试用例如下：

```typescript
it('nested reactive', () => {
  const original = {
    nested: {
      foo: 1,
    },
    array: [{ bar: 2 }],
  };
  const observed = reactive(original);
  expect(isReactive(observed.nested)).toBe(true);
  expect(isReactive(observed.array)).toBe(true);
  expect(isReactive(observed.array[0])).toBe(true);
});

it('nested readonly', () => {
  const original = { foo: 1, bar: { baz: 2 } };
  const wrapped = readonly(original);

  expect(isReadonly(wrapped.bar)).toBe(true);
});
```

只需在 **Prxoy** 的 **get** 中，判断如果返回的值是对象类型，则对值再次进行 **reactive** 和 **readonly** 操作。

```typescript
export const isObejct = (val) => {
  return val !== null && typeof val === 'object';
};

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (isObejct(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}
```
