> [10-isProxy](https://github.com/Atlanstis/mini-vue/tree/10-isProxy)

现在需要实现这样一个功能：

- 实现函数 **isProxy**，其功能时检测一个对象是否是通过 **reactive** 或者 **readonly** 创建。

测试用例如下：

```typescript
it('isProxy', () => {
  const original = { foo: 1 };
  const observed = reactive(original);

  expect(isProxy(observed)).toBe(true);
});

it('isProxy', () => {
  const original = { foo: 1 };
  const wrapped = readonly(original);

  expect(isProxy(wrapped)).toBe(true);
});
```

只需判断 **isReactive** 跟 **isReadonly**，满足其一即可。

```typescript
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
```
