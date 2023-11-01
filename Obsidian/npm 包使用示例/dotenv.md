## [dotenv](https://www.npmjs.com/package/dotenv)

通过读取项目中的 `.env` 格式的文件获得数据，并挂载到 `process.env` 属性上。

### 安装

```shell
npm i dotenv
```

### 文件格式

`.env` 文件的格式类似于如下键值对的方式，仅支持一对一的格式，不支持嵌套使用（# 代表注释）：

```.env
SECRET_KEY_A="SECRET_KEY_A"
SECRET_KEY_B="SECRET_KEY_B"
```

### 使用

新建一个 `src/index.js` ，

```js
require('dotenv').config({
  path: './.env',
});

console.log(process.env);
```

在 `package.json` 中增加一条可执行的命令 `"default": "node src/index.js"` 并执行，可以在终端中查询到如下数据：

```
  SECRET_KEY_A: 'SECRET_KEY_A',
  SECRET_KEY_B: 'SECRET_KEY_B'
```

如果需要根据不同环境读取不同的数据，则需通过手动指定文件的方式，通过设置环境变量 ，并根据该环境变量来读取文件。

新建一个 `.production.env` 文件，

```
SECRET_KEY_A="PRODUCTION_SECRET_KEY_A"
SECRET_KEY_B="PRODUCTION_SECRET_KEY_B"
```

新建一个 `src/production.js`：

```js
require('dotenv').config({
  path: process.env.NODE_ENVIRONMENT === 'production' ? '.production.env' : '.env',
});

console.log('SECRET_KEY_A:', process.env.SECRET_KEY_A);
console.log('SECRET_KEY_B:', process.env.SECRET_KEY_B);
```

在 `package.json` 中增加一条可执行的命令 `"production": "cross-env NODE_ENVIRONMENT=production node src/production.js"` 并执行，可以在终端中查询到如下数据：

```
SECRET_KEY_A: PRODUCTION_SECRET_KEY_A
SECRET_KEY_B: PRODUCTION_SECRET_KEY_B
```

## 注释

`.env` 支持添加注释，通过 `#` 实现。

```
# 我是注释
SECRET_KEY_A="SECRET_KEY_A"
```

## 代码示例

[dotenv-github](https://github.com/Atlanstis/demo-project/tree/npm/dotenv)
