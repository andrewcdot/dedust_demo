const greet = (name: string): string => {
    return `Hello, ${name}!`;
};

console.log(greet("TypeScript"));


import * as dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

// 示例：访问环境变量
console.log('MY_VARIABLE:', process.env.MY_VARIABLE);
console.log('MY_VARIABLE:', process.env.MNEMONIC);