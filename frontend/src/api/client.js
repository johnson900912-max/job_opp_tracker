import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 60000,
});

// --- Aspirations ---
export const aspirationsApi = {
  list: () => api.get("/aspirations"),
  create: (data) => api.post("/aspirations", data),
  update: (id, data) => api.put(`/aspirations/${id}`, data),
  delete: (id) => api.delete(`/aspirations/${id}`),
};

// --- News Submission ---
export const newsApi = {
  submitUrl: (url) => api.post("/news/url", { url }),
  submitText: (content) => api.post("/news/text", { content }),
  submitImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/news/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: (page = 1) => api.get(`/news?page=${page}&limit=20`),
};

// --- Opportunities ---
export const opportunitiesApi = {
  updateUrgency: (id, urgency) => api.patch(`/opportunities/${id}/urgency`, { urgency }),
};

// --- Dashboard ---
export const dashboardApi = {
  full: () => api.get("/dashboard"),
  byAspiration: (id) => api.get(`/dashboard?aspiration_id=${id}`),
  reprocessStatus: () => api.get("/dashboard/reprocessing/status"),
};
