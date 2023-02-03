> [05-readonly](https://github.com/Atlanstis/mini-vue/tree/05-readonly)

现在需要实现这样一个功能：

- 实现一个 **readonly** 函数，功能与 **reactive** 函数相似，但 set 操作无法被执行，会抛出警告。

测试用例如下：

```typescript
it('happy path', () => {
  const original = { foo: 1, bar: { baz: 2 } };
  const wrapped = readonly(original);

  expect(wrapped).not.toBe(original);
  expect(wrapped.foo).toBe(1);
});

it('warn when call set', () => {
  console.warn = jest.fn();

  const user = readonly({
    age: 10,
  });
  user.age = 11;

  expect(console.warn).toBeCalledTimes(1);
  expect(user.age).toBe(10);
});
```

为实现这一功能，只需将与依赖相关的 **track** 与 **trigger** 删除，并在 set 操作时，抛出警告。

```typescript
export function readonly(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      return res;
    },
    set(target, key) {
      console.warn(`key: ${String(key)} set fail, because target is readonly.`, target);
      return true;
    },
  });
}
```

由于 **readonly** 与 **reactive** 结构类似，就可以将相似的部分进行抽离。

在 **Proxy** 中，**get** 部分，**readonly** 与 **reactive** 的差别在于 **track** 是否执行，因此可以通过一个 **createGetter** 函数生成 **get**。

```typescript
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}
```

为保持代码的一致性，可以将 **set** 修改为类似 **createSetter** 函数。

```typescript
function createSetter() {
  return function set(target, key, val) {
    const res = Reflect.set(target, key, val);
    trigger(target, key);
    return res;
  };
}
```

此时，**readonly** 与 **reactive** 结构如下：

```typescript
export function reactive(raw) {
  return new Proxy(raw, {
    get: createGetter(),
    set: createSetter(),
  });
}

export function readonly(raw) {
  return new Proxy(raw, {
    get: createGetter(true),
    set(target, key) {
      console.warn(`key: ${String(key)} set fail, because target is readonly.`, target);
      return true;
    },
  });
}
```

接着我们可以将 **Proxy** 的第二个参数 **handler** 进行抽离，

```typescript
export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};

export const readonlyHandlers = {
  get: createGetter(true),
  set(target, key) {
    console.warn(`key: ${String(key)} set fail, because target is readonly.`, target);
    return true;
  },
};
```

此时，**readonly** 与 **reactive** 结构如下：

```typescript
export function reactive(raw) {
  return new Proxy(raw, mutableHandlers);
}

export function readonly(raw) {
  return new Proxy(raw, readonlyHandlers);
}
```

接着可以进一步抽离，将 **Proxy** 实例化的过程放到另一个函数中，传入不同的 **handler** 配置即可。

此时，**readonly** 与 **reactive** 结构如下：

```typescript
export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
```
