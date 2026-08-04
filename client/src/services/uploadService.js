import api from './api.js';

// Owner: append images to a PG gallery (multipart, field "images")
export const uploadPGImages = (pgId, files) => {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  return api
    .post(`/upload/pg/${pgId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// Owner: drop a single gallery image by its URL
export const removePGImage = (pgId, url) =>
  api
    .delete(`/upload/pg/${pgId}/images`, { data: { url } })
    .then((r) => r.data);

// Any user: submit a live selfie for identity verification (field "photo")
export const uploadVerification = (blob) => {
  const form = new FormData();
  form.append('photo', blob, 'selfie.jpg');
  return api
    .post('/upload/verify', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
