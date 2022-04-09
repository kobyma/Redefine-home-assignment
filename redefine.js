const axios = require("axios");

const GENESIS_BLOCK_TIMESTAMP = 1231006505;
const AVERAGE_BLOCK_INSERTION_SECONDS = 600;
const BASE_REQUEST_URL = "https://blockchain.info/";

async function findLastBlockBeforeTime(inputTime) {
  const axiosInstance = axios.create({
    baseURL: BASE_REQUEST_URL,
    headers,
  });
  if (inputTime <= GENESIS_BLOCK_TIMESTAMP) {
    return 0;
  }
  const latestRequest = await axiosInstance({
    url: "latestblock",
  });
  const latestHeight = latestRequest.data.height;
  const latestTime = await requestBlockTime(axiosInstance, latestHeight); // could be taken from the latestblock call, but I wasn't sure if that's allowed
  if(inputTime >= latestTime){
    return latestHeight;
  }
  const estimateHeight = Math.floor((inputTime - GENESIS_BLOCK_TIMESTAMP) / AVERAGE_BLOCK_INSERTION_SECONDS);
  if (estimateHeight > latestHeight) {
    estimateHeight = latestHeight;
  }
  const {min, max} = await calculateSearchRange(axiosInstance, inputTime, estimateHeight, latestHeight);

  return await binarySearch(axiosInstance, min, max, inputTime);
}

async function calculateSearchRange(axiosInstance, inputTime, estimateHeight, latestHeight){
  let min = 0;
  let max = latestHeight;
  const estimateTime = await requestBlockTime(axiosInstance, estimateHeight);
  const isEstimateTimeSmaller = estimateTime <= inputTime;
  if (isEstimateTimeSmaller) {
    min = estimateHeight;
  } else {
    max = estimateHeight;
  }
  let offset = isEstimateTimeSmaller ? 1 : -1;
  let found = false;
  while (!found) {
    const requestTime = await requestBlockTime(axiosInstance, estimateHeight + offset);
    if (requestTime <= inputTime) {
      min = estimateHeight + offset;
    } else {
      max = estimateHeight + offset;
    }
    if (requestTime <= inputTime != isEstimateTimeSmaller) {
      found = true;
    } else {
      offset = offset << 1;
      if (estimateHeight + offset > latestHeight) {
        found = true;
      }
      if (estimateHeight + offset < 0) {
        found = true;
      }
    }
  }
  return {
    min,
    max
  }
}

async function requestBlockTime(axiosInstance, height) {
  const request = await axiosInstance({
    url: `block-height/${height}?format=json`,
  });
  return request.data.blocks[0].time;
}

async function binarySearch(axiosInstance, min, max, inputTime) {
  if (min + 1 >= max) {
    return min;
  }
  const pos = Math.floor((min + max) / 2);
  const posTime = await requestBlockTime(axiosInstance, pos);
  if (posTime <= inputTime) {
    return binarySearch(axiosInstance, pos, max, inputTime);
  }
  return binarySearch(axiosInstance, min, pos, inputTime);
}