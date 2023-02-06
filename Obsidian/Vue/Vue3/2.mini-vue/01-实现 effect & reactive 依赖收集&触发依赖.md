> [01-effect-&-reactive](https://github.com/Atlanstis/mini-vue/tree/01-effect-%26-reactive)

现在需要实现这样一个功能：

- 实现一个函数 **reactive**，接受一个对象参数 **raw**，并返回一个响应式对象，该响应式对象包含参数 **raw** 的所有属性。
- 实现一个函数 **effect**，接受一个函数参数 **fn**，**fn** 首先会被执行。**fn** 的如果有访问响应式对象属性的操作，则当相对应的响应式对象属性发生改变时，则 **fn** 会被再次执行。

测试用例如下：

```typescript
it('happy path', () => {
  const user = reactive({
    age: 10,
  });

  let nextAge;
  effect(() => {
    nextAge = user.age + 1;
  });

  expect(nextAge).toBe(11);

  user.age++;

  expect(nextAge).toBe(12);
});

it('happy path', () => {
  const original = { foo: 1 };
  const observed = reactive(original);

  expect(observed).not.toBe(original);
  expect(observed.foo).toBe(1);
});
```

**Vue 3** 中可以通过 **reactive** 函数将一个普通对象转换为响应式对象。

响应式对象的实现主要通过 [Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 和 [Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect) 来进行实现。

**Proxy** 对象用于创建一个对象的代理，从而实现基本操作的拦截（如属性查找、赋值、枚举等）。

**reactive** 实现大致如下：

```typescript
import { track, trigger } from './effect';

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      track(target, key);
      return res;
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val);
      trigger(target, key);
      return res;
    },
  });
}
```

在访问代理对象的属性时，会触发 **track** 的执行，用于依赖收集。

代理对象的属性发生变更时，会触发 **trigger** 的执行，用于触发依赖。

所谓的依赖指在 **effect** 函数中传入的副作用函数。

**effect** 实现大致如下：

```typescript
let activeEffect;

class ReactiveEffect {
  private _fn;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
```

构建一个 **ReactiveEffect** 类，用于包裹副作用函数。

传入的副作用函数会在 **effect** 中被执行，当副作用函数中访问响应式对象的属性时，则会触发 **track** 进行搜集，将该副作用函数与响应式对象的属性相绑定。

绑定关系如下：

```
targetMap --> depsMap --> dep
map       --> map     --> set
```

**track** 实现大致如下：

```typescript
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect);
}
```

**track** 中，通过 **target**，**key** 的递进获取方式，获取到当前被访问的属性。由于副作用函数执行前，会将当前执行的副作用函数赋值给 全局属性 **activeEffect**。此时就可以将副作用函数与响应式对象的属性相绑定。

而后当响应式对象的属性发生变更时，就会通过 **trigger** 获取到所有与该属性相关的副作用函数，重新触发副作用函数的执行。

**trigger** 实现大致如下：

```typescript
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  deps.forEach((effect) => {
    effect.run();
  });
}
```
