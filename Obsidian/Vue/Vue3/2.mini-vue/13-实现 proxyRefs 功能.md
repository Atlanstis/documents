> [13-proxyRefs](https://github.com/Atlanstis/mini-vue/tree/13-proxyRefs)

现在需要实现这样一个功能：

1. 实现一个函数 **proxyRefs**，接受一个对象参数，并返回一个对象。该参数的属性值如果是有 **ref** 包裹，则返回对象访问该属性值时可以不通过 **.value**，可以直接访问。如果不由 **ref** 包裹，则直接返回。
2. 当对返回对象进行 **set** 操作时，其原始值也会同步变更。

> 该函数常用于 template 中。

测试用例如下：

```typescript
it('proxyRefs', () => {
  const user = {
    age: ref(10),
    name: 'xiaohong',
  };
  const proxyUser = proxyRefs(user);
  expect(user.age.value).toBe(10);
  expect(proxyUser.age).toBe(10);
  expect(user.name).toBe('xiaohong');

  proxyUser.age = 20;

  expect(proxyUser.age).toBe(20);
  expect(user.age.value).toBe(20);

  proxyUser.age = ref(10);

  expect(proxyUser.age).toBe(10);
  expect(user.age.value).toBe(10);
});
```

首先 **proxyRefs** 将返回一个 **Proxy** 对象，在 **get** 中，判断请求的值是否通过 **ref** 包裹，其功能与 **unRef** 函数一致。

```typescript
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
  });
}
```

当进行 **set** 操作时，当操作的属性值为 **ref** 包裹，但新值不为 **ref** 包裹，则我们需要更改其 **value** 属性，否则直接通过 **Reflect.set** 修改。

```typescript
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },

    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
```
