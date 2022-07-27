const fs = require('fs');
const path = require('path');

async function start() {
  try {
    const isExist = await isFileExit('README.md');
    if (isExist) {
      await fs.unlinkSync('README.md');
    }
    const dirJson = [];
    const dirs = fs.readdirSync('src');
    // 遍历 src 一级目录
    dirs.forEach((dir) => {
      if (isRightDir(dir)) {
        const pointIndex = dir.indexOf('.');
        const dirObj = {
          index: dir.substring(0, pointIndex),
          name: dir,
          children: [],
        };
        const dirPath = path.join('src', dir);
        const docs = fs.readdirSync(dirPath);
        // 遍历 src 二级文件
        docs.forEach((doc) => {
          if (isRightFile(doc)) {
            const fileObj = {
              index: doc.substring(0, pointIndex),
              name: doc,
            };
            dirObj.children.push(fileObj);
          }
        });
        dirJson.push(dirObj);
      }
    });
    // 整理顺序，并生成文件内容
    let content = '# 一些杂乱的文档\n';
    content = sortAndContact(dirJson, content, 1);
    await fs.writeFileSync('README.md', content, { flag: 'a' });
  } catch (e) {
    console.log(e);
  }
}

start();

function sortAndContact(arr, content, hierarchy, parent) {
  arr.sort((a, b) => a.index - b.index);
  arr.forEach((item) => {
    if (hierarchy === 1) {
      content += `## ${item.name}\n`;
    } else if (hierarchy === 2) {
      content += `- [${item.name}](https://github.com/Atlanstis/documents/blob/main/src/${encodeURI(
        parent.name,
      )}/${encodeURI(item.name)})\n`;
    }
    if (item.children?.length) {
      content = sortAndContact(item.children, content, 2, item);
    }
  });
  return content;
}

// 以数字 + . 开头
function isRightDir(name) {
  return /^[0-9]+\..+/.test(name);
}

// 以数字 + . 开头，并以 .md 结尾
function isRightFile(name) {
  return /^[0-9]+\..+\.md/.test(name);
}

// 判断文件是否存在
function isFileExit(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err ? true : false);
    });
  });
}
