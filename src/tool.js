// src/tools.js

// 模拟的工具函数
function getCurrentWeather(city) {
    console.log(`[Tool] Executing getCurrentWeather for city: ${city}`);
    if (city.toLowerCase().includes("北京")) {
        return JSON.stringify({ city: "北京", temperature: "15°C", condition: "晴", humidity: "40%" });
    }
    if (city.toLowerCase().includes("上海")) {
        return JSON.stringify({ city: "上海", temperature: "18°C", condition: "小雨", humidity: "75%" });
    }
    return JSON.stringify({ city, temperature: "未知", condition: "未知" });
}

function calculator(expression) {
    console.log(`[Tool] Executing calculator for expression: ${expression}`);
    try {
        // 注意：在生产环境中使用 eval 是非常危险的，这里仅为演示。
        // 应该使用安全的数学表达式解析库，如 math.js
        const result = eval(expression);
        return JSON.stringify({ result });
    } catch (error) {
        return JSON.stringify({ error: "无效的数学表达式" });
    }
}

// 工具注册表
const availableTools = {
    get_current_weather: {
        func: getCurrentWeather,
        schema: {
            name: "get_current_weather",
            description: "获取指定城市当前的实时天气信息。",
            parameters: [{ name: "city", type: "string", description: "城市名称, e.g., 北京" }],
        },
    },
    calculator: {
        func: calculator,
        schema: {
            name: "calculator",
            description: "一个可以执行基本数学运算的计算器。",
            parameters: [{ name: "expression", type: "string", description: "数学表达式, e.g., '5*8+2'" }],
        },
    },
};

export function getTool(name) {
    return availableTools[name];
}

export function getAllToolSchemas() {
    return Object.values(availableTools).map(tool => tool.schema);
}
