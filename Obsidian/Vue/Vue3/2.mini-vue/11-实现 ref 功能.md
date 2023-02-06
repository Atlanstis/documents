> [11-ref](https://github.com/Atlanstis/mini-vue/tree/11-ref)

现在需要实现这样一个功能：

1. 实现函数 **ref**，其接受一个任意参数，并返回一个对象。返回对象拥有一个属性 **value**，其值等同于接受的参数。
2. 当返回对象的 **value** 的值，在 **effect** 函数中被使用，且发生变化时，会触发 **effect** 的再次执行。
3. 当参数为对象时，转换后相对应的值也应该为响应式对象。

功能 1 的测试用例如下：

```typescript
it('happy path', () => {
  const a = ref(1);
  expect(a.value).toBe(1);
});
```

为实现这一功能，先声明一个 **RefImpl** 类，包含一个私用属性 **\_value**，其值为传入的参数。

在类中增加 **value** 属性的 **get** 方法，并返回 **\_value**。

最后在 **ref** 函数中，返回 **RefImpl** 类的实例即可。

```typescript
class RefImpl {
  private _value: any;
  constructor(value) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
}

export function ref(value) {
  return new RefImpl(value);
}
```

功能 2 的测试用例如下：

```typescript
it('should be reactive', () => {
  const a = ref(1);
  let dummy;
  let calls = 0;
  effect(() => {
    calls++;
    dummy = a.value;
  });
  expect(calls).toBe(1);
  expect(dummy).toBe(1);
  a.value = 2;
  expect(calls).toBe(2);
  expect(dummy).toBe(2);
  // same value should not trigger
  a.value = 2;
  expect(calls).toBe(2);
  expect(dummy).toBe(2);
});
```

要实现功能 2，意味着在访问 **value** 属性时，也进行了 **track** 操作。在 **value** 属性发生变化时，触发 **trigger**。

给 **RefImpl** 增加一个 **dep** 属性，用于收集相关的依赖，然后在触发 **value** 的 **get** 时，通过 **trackEffects** 收集依赖；在触发 **value** 的 **set** 且值发生变化时，通过 **triggerEffects** 进行依赖的再次执行。

```typescript
export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};

class RefImpl {
  private _value: any;
  public dep = new Set();

  constructor(value) {
    this._value = value;
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    if (!hasChanged(this._value, newVal)) return;
    this._value = newVal;
    triggerEffects(this.dep);
  }
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
```

功能 3 的测试用例如下：

```typescript
it('should make nested properties reactive', () => {
  const a = ref({ count: 1 });
  let dummy;
  effect(() => {
    dummy = a.value.count;
  });
  expect(dummy).toBe(1);
  a.value.count = 2;
  expect(dummy).toBe(2);
});
```

首先，需对 **ref** 的参数进行判断，如为对象类型， 则通过 **reactive** 进行包裹。

接着在 **set** 操作对前后值进行比较时，原始对象与 **proxy** 对象必定不相等。

因此在 **RefImpl ** 中增加一个属性 **\_rawValue** 用于存储原始值。

比较后，如果不相等，再将新的值赋给 **\_rawValue** 与 **\_value**。

```typescript
function convert(value) {
  return isObejct(value) ? reactive(value) : value;
}

class RefImpl {
  private _value: any;
  private _rawValue: any;

  public dep = new Set();

  constructor(value) {
    this._rawValue = value;
    // 判断 value 是不是对象，是 -> 通过 reactive 进行包裹
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
