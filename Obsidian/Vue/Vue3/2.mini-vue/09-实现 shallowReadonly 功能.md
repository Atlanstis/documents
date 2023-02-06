现在需要实现这样一个功能：

- 实现 **shallowReadonly** 函数，只把参数最外层变成 **readonly**。如果参数属性的值为对象，则该属性的值不为响应式对象。

测试用例如下：

```typescript
it('should not make non-reactive properties reactive', () => {
  const props = shallowReadonly({ n: { foo: 1 } });
  expect(isReadonly(props)).toBe(true);
  expect(isReadonly(props.n)).toBe(false);
});
```

**shallowReadonly** 首先是基于 **readonly** 的，其最外层与 **readonly** 结果一致。因此也无需在 **get** 中，进行 **track** 操作。

由于内层无需进行响应式对象转换操作，因此也针对 **Reflect.get** 的结果，进行递归操作。

所以，只需在创建 **get** 时，增加一个参数 **shallow**，为 **true** 时，直接返回即可。

```typescript
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (shallow) {
      return res;
    }

    if (isObejct(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`key: ${String(key)} set fail, because target is readonly.`, target);
    return true;
  },
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}
```
