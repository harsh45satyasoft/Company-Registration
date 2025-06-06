import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

export const checkEmailAvailability = async (email) => {
  const response = await API.post("/companies/check-email", { email });
  return response.data;
};

export const registerCompany = async (companyData) => {
  const response = await API.post("/companies/register", companyData);
  return response.data;
};

export const getCompanies = async (search = "") => {
  const response = await API.get(
    `/companies${search ? `?search=${search}` : ""}`
  );
  return response.data;
};

export const getCompanyById = async (id) => {
  const response = await API.get(`/companies/${id}`);
  return response.data;
};

export default API;