import Card from "../factories/card.js";
import api from "./api.js";

// Mise en places des différents éléments

const FILTERS = new Map();
const TAGS_ALL = [];
const TAGS_I = new Set();
const TAGS_A = new Set();
const TAGS_U = new Set();

let filteredList = [];

// Fonction filter ingrédient pour trier selon le tableau des tags
const filter_ing = (tagName, recipe) => {
  return recipe.ingredients.find(
    (ing) => ing.ingredient.toLowerCase() === tagName
  );
};

// Fonction filter utensils pour trier selon le tableau des tags
const filter_ust = (tagName, recipe) => {
  return recipe.ustensils.find((u) => u.toLowerCase() === u);
};

// Fonction filter appliance pour trier selon le tableau des tags
const filter_app = (tagName, recipe) => {
  return recipe.appliance.toLowerCase() === tagName;
};

// Ajout des différents filters dans la map
FILTERS.set("i", filter_ing);
FILTERS.set("u", filter_ust);
FILTERS.set("a", filter_app);

// * Section pour la création des listes
function listTagsI(recipes) {
  const list = new Set();
  recipes.map((r) =>
    r.ingredients.map((i) => list.add(i.ingredient.toLowerCase()))
  );
  list.forEach((i) => TAGS_I.add({ name: i, type: "i" }));
  return list;
}

function listTagsA(recipes) {
  const list = new Set();
  recipes.map((a) => list.add(a.appliance.toLowerCase()));
  list.forEach((a) => TAGS_A.add({ name: a, type: "a" }));
  return list;
}

function listTagsU(recipes) {
  const list = new Set();
  recipes.map((r) => r.ustensils.map((u) => list.add(u.toLowerCase())));
  list.forEach((u) => TAGS_U.add({ name: u, type: "u" }));
  return list;
}

// * Section pour la filtration selon le text
function filterRecipesByText(recipes, text) {
  const p = text.toLowerCase().trim();
  return recipes.filter(
    (item) =>
      item.name.toLowerCase().includes(p) ||
      item.ingredients.find((i) => i.ingredient.toLowerCase().includes(p)) ||
      item.description.toLowerCase().includes(p)
  );
}

function filterByTags(recipes, tags) {
  return recipes.filter(
    (recipe) =>
      tags.filter((tag) => {
        console.log(tag);
        return FILTERS.get(tag.type.toLowerCase())(tag.name, recipe);
      }).length === tags.length
  );
}

function Filter(text, tags, recipes) {
  let filtered = text.length > 2 ? filterRecipesByText(recipes, text) : recipes;

  if (tags.length) {
    // { name: "tagname", type: "u"stensil/"i"ngredient/"a"ppareil }
    filtered = filterByTags(filtered, tags);
  }

  //     generate list des ingrédients/ustensils/appareils
  TAGS_I.clear();
  listTagsI(filtered);
  TAGS_U.clear();
  listTagsU(filtered);
  TAGS_A.clear();
  listTagsA(filtered);

  console.log(TAGS_I);
  console.log("_______");
  console.log(TAGS_U);
  console.log("_______");
  console.log(TAGS_A);

  return filtered;
}

const placeholder = {
  I: ["Ingrédients", "Recherche un ingrédient"],
  U: ["Ustensiles", "Recherche un ustensile"],
  A: ["Appareils", "Recherche un appareil"],
};

function enableFilterItems(e, type) {
  console.log(e);
  ["I", "A", "U"].map((i) => {
    const div = document.getElementById(`tag${i}`);
    div.classList.remove("active");
    const input = div.querySelector(`input`);
    input.placeholder = placeholder[i][0];
    document.getElementById(`dropDown-${i}`).classList.remove("show");
  });
  const div = document.getElementById(`tag${type}`);
  div.classList.add("active");
  const input = div.querySelector(`input`);
  input.placeholder = placeholder[type][1];
  document.getElementById(`dropDown-${type}`).classList.add("show");

  // trie les items
}

const filterItems = (e, type) => {
  const value = e.target.value.trim().toLowerCase();
  const container = document.getElementById(`dropDown-${type}`);
  container.querySelectorAll("span").forEach((f) => {
    f.style.display = f.textContent.toLowerCase().includes(value)
      ? "inline"
      : "none";
  });
};

const renderCards = (recipes) => {
  recipes.map((r) => new Card(r));
};

const renderTagLists = () => {
  renderTagList(TAGS_I, "#dropDown-I");
  renderTagList(TAGS_U, "#dropDown-U");
  renderTagList(TAGS_A, "#dropDown-A");
};

const createTag = (element, t, type, recipes) => {
  const item = { type: type, name: t };
  const div = document.querySelector(".tags");
  const tag = document.createElement("span");
  tag.textContent = t;
  tag.classList.add("tag", "drop_list--" + type);
  tag.onclick = () => {
    element.classList.remove("hide");
    div.removeChild(tag);
    // filter...
    TAGS_ALL.pop(TAGS_ALL[TAGS_ALL.indexof(item)]);
    filterAndRender();
  };
  div.appendChild(tag);
  // filter...
  TAGS_ALL.push(item);
  console.log("🚀 ~ file: filter.js:156 ~ createTag ~ TAGS_ALL:", TAGS_ALL);
  filterAndRender();
};

const renderTagList = (tagList, query) => {
  const tagUlI = document.querySelector(query);
  tagUlI.innerHTML = "";
  for (let tag of tagList.values()) {
    const span = document.createElement("span");
    span.textContent = tag.name;
    span.setAttribute("itemType", tag.type);
    span.classList.add("dropDown--item");
    tagUlI.appendChild(span);
    span.onclick = (e) => {
      e.target.classList.add("hide");
      createTag(e.target, e.target.textContent, tag.type.toUpperCase());
    };
  }
  return tagUlI;
};

const filterAndRender = () => {
  filteredList = Filter("", TAGS_ALL, filteredList);
  renderCards(filteredList);
  renderTagLists();
};

window.onload = async () => {
  const searchResults = document.querySelector(".card_container");
  const searchInput = document.querySelector("#search");
  const tagI = document.querySelector("#tagI--title");
  const tagA = document.querySelector("#tagA--title");
  const tagU = document.querySelector("#tagU--title");

  const originals = await api();

  function filterInput(e) {
    searchResults.innerHTML = "";
    const searchedString = e.target.value;
    filteredList = Filter(searchedString, TAGS_ALL, originals);
    renderCards(filteredList);
    renderTagLists();
  }

  // EventListener Input
  searchInput.addEventListener("input", filterInput);
  tagI.addEventListener("click", (e) => enableFilterItems(e, "I"));
  tagA.addEventListener("click", (e) => enableFilterItems(e, "A"));
  tagU.addEventListener("click", (e) => enableFilterItems(e, "U"));
  tagI.addEventListener("input", (e) => filterItems(e, "I"));
  tagA.addEventListener("input", (e) => filterItems(e, "A"));
  tagU.addEventListener("input", (e) => filterItems(e, "U"));
  filteredList = originals;
  filterAndRender();
};
