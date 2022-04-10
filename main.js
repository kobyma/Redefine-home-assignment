const findLastBlockBeforeTime = require("./redefine");

(async () => {
    const input = 1637430034;
    const result = await findLastBlockBeforeTime(1637430034);
    console.info(`Last block before timestamp: ${input} is of height:${result}`);
})();