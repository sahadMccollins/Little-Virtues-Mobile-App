import axios from 'axios';

// Strapi API Instance
const strapiApi = axios.create({
  // baseURL: 'http://192.168.1.17:1337/api'
  baseURL: 'https://original-wonder-3fccc0ad1b.strapiapp.com/api'
});

// Strapi Calls
export const getDownloads = () => strapiApi.get('/downloads?populate[0]=file').then(res => res.data);
export const getPacks = () => strapiApi.get('/packs?populate=*').then(res => res.data);
export const getValues = () => strapiApi.get('/values?populate[0]=pack&populate[1]=coverImage&populate[2]=story&populate[3]=story.audioFile&populate[4]=flashcards').then(res => res.data);
export const getValueById = (id: string | number) => strapiApi.get(`/values/${id}?populate[0]=pack&populate[1]=coverImage&populate[2]=story&populate[3]=story.audioFile&populate[4]=flashcards`).then(res => res.data);
export const getStories = () => strapiApi.get('/bedtime-stories?populate[0]=audioFile').then(res => res.data);
export const getBedtimeCategories = () => strapiApi.get('/bedtime-categories?sort=order:asc').then(res => res.data);

export default strapiApi;
