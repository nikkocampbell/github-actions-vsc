import axios from 'axios';

let instance:any = null;

const client = (key:string | null = null) => {
  if (!instance || key !== null) {
    instance = axios.create({
      baseURL: 'https://api.github.com',
      headers: { 'authorization': `Bearer ${key}` }
    });
  }

  return instance;
};

export {
  client
};
