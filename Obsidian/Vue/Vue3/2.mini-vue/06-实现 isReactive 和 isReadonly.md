> [06-isReactive-isReadonly](https://github.com/Atlanstis/mini-vue/tree/06-isReactive-isReadonly)

现在需要实现这样一个功能：

- 实现 **isReactive** 函数，判断对象是否通过 **reactive** 函数创建。
- 实现 **isReadonly** 函数，判断对象是否通过 **readonly** 函数创建。

其测试用例如下：

```typescript
it('isReactive', () => {
  const original = { foo: 1 };
  const observed = reactive(original);

  expect(isReactive(observed)).toBe(true);
  expect(isReactive(original)).toBe(false);
});

it('isReadonly', () => {
  const original = { foo: 1 };
  const wrapped = readonly(original);

  expect(isReadonly(wrapped)).toBe(true);
  expect(isReadonly(original)).toBe(false);
});
```

首先判断一个对象是否是通过 **reactive** 或者 **readonly** 创建的。

**reactive** 或者 **readonly** 创建时，**createGetter** 中，**isReadonly** 不同，因此可以通过访问一个特殊的属性，触发 **get** 去进行判断。

对于一个普通对象，也可通过访问一个特殊的属性，判断其值是否存在。

以下为代码实现：

```typescript
export const enum ReactiveFlag {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function isReactive(value) {
  return !!value[ReactiveFlag.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlag.IS_READONLY];
}

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}
```
