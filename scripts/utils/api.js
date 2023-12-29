const getData = async () => {
  const ls = localStorage.getItem("data");
  if (!ls) {
    const a = await fetch("./data/recipes.json");
    if (!a) return { data: [] };
    const data = await a.json();
    localStorage.setItem("data", JSON.stringify(data));
    return data;
  }
  return JSON.parse(ls);
};
const api = async () => await getData();

export default api;
