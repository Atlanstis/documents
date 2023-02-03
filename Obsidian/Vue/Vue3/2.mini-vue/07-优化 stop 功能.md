> [07-stop-optimize](https://github.com/Atlanstis/mini-vue/tree/07-stop-optimize)

原先的 **stop** 函数，在面对元素的自增操作（obj.prop++）时，存在一些问题。

`obj.prop++` 等价于 `obj.prop = obj.prop + 1`，会先后触发响应式对象的 **get** 与 **set**。

导致在 **get** 中重新触发依赖的收集，因此在 **set** 操作时，重新执行依赖函数。

```typescript
let activeEffect;
let shouldTrack = false;

export function track(target, key) {
  if (!isTracking()) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
```

解决方案就是，增加一个全局变量控制 **shouldTrack** 控制依赖的收集。

依赖的收集操作，取决于 **\_fn** 的执行，因此修改 **ReactiveEffect** 类的 **run** 方法。

在 **\_fn** 执行前，开始依赖的收集标识 **shouldTrack**，执行完毕后，关闭依赖的收集标识 **shouldTrack**。

当当前依赖实例被 **stop** 执行后，则直接返回 **\_fn** 的返回结果。

```typescript
class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  onStop?: () => void;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
      if (this.onStop) {
        this.onStop();
      }
    }
  }
}
```
