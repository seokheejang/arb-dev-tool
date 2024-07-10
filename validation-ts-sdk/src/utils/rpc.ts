import axios from 'axios';

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const postData = {
  id: 1,
  jsonrpc: '2.0',
};

export const reqApiPost = async (url: string) => {
  try {
    const { data } = await axios.post(url, {}, { headers });
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const reqApiGet = async (url: string) => {
  try {
    const { data } = await axios.get(url, { headers });
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const reqRpcPost = async (url: string, method: string, params: string[]) => {
  try {
    const { data } = await axios.post(url, { method, params, ...postData }, { headers });
    return data.result;
  } catch (error) {
    console.error(error);
  }
};

export const reqRpcGet = async (url: string, method: string, params: string[]) => {
  try {
    const { data } = await axios.get(url, { headers, params: { method, params, ...postData } });
    return data.result;
  } catch (error) {
    console.error(error);
  }
};
