import Card from "./factories/card.js";
import api from "./utils/api.js";

const Factory = {
    recipes: (recipes) => {
        recipes.map((r) => new Card(r));
    },

    /**
     *
     * @param {HTMLElement} container
     * @param {Array<item>} items
     * @param {function(itemElement)} onclick
     */
    items: (container, items, onclick) => {
        container.innerHTML = "";
        for (let item of items.values()) {
            const element = document.createElement("span");
            element.textContent = item.name;
            element.itemtype = item.type;
            element.classList.add("dropDown--item");
            container.appendChild(element);
            element.onclick = () => onclick && onclick(element);
        }
    },

    /**
     *
     * @param {string} type
     * @param {string} text
     * @param {Function} onclick callback
     * @returns HTMLELement
     */
    tag: (type, text, onclick, ...rest) => {
        text = text.toLowerCase();
        const item = { type: type, name: text };
        const tag = document.createElement("span");

        tag.type = type;
        tag.name = text;
        tag.textContent = text;
        const typeClass = type.toUpperCase();
        tag.classList.add("tag", "drop_list--" + typeClass);

        tag.onclick = () => onclick && onclick(tag, ...rest);

        return tag;
        /*
    const div = document.querySelector(".tags");
    tag.onclick = () => {
      element.classList.remove("hide");
      div.removeChild(tag);
      // filter...
      tags_all.splice(tags_all.indexOf(item), 1);
      filterAndRenderTags();
    };
    div.appendChild(tag);
    // filter...
    tags_all.push(item);
    filterAndRenderTags();
    */
    },
};

const Renderer = {
    recipes: (recipes, activeRecipes) => {
        recipes.map((r) => r.card.element.classList.add("hide"));
        activeRecipes.map((r) => r.card.element.classList.remove("hide"));
    },

    tags: (tags, activeTags) => {
        tags.map((t) => t.hide());
        activeTags.map((t) => t.show());
    },

    items: (container, text) => {
        const value = text.trim().toLowerCase();
        container.querySelectorAll("span").forEach((f) => {
            f.style.display = f.textContent.toLowerCase().includes(value)
                ? "inline"
                : "none";
        });
    },
};

const Update = {
    byText: (recipes, text) => {
        const str = text.toLowerCase().trim();
        return recipes.filter(
            (item) =>
                item.name.toLowerCase().includes(str) ||
                item.ingredients.find((i) =>
                    i.ingredient.toLowerCase().includes(str)
                ) ||
                item.description.toLowerCase().includes(str)
        );
    },

    byTags: (filterFunctions, recipes, tags) => {
        return recipes.filter(
            (recipe) =>
                tags.filter((tag) => {
                    const filterFunction = filterFunctions.get(
                        tag.type.toLowerCase()
                    );
                    return filterFunction && filterFunction(tag.name, recipe)
                        ? true
                        : false;
                }).length === tags.length
        );
    },

    tag: () => {},
};

export class Filter {
    constructor(originals) {
        this.originals = [...originals];
        this.filteredList = [];

        this.filterFunctions = new Map();

        this.tags = [];
        this.itemsI = [];
        this.itemsU = [];
        this.itemsA = [];

        this.placeholders = {
            I: ["Ingrédients", "Recherche un ingrédient"],
            U: ["Ustensiles", "Recherche un ustensile"],
            A: ["Appareils", "Recherche un appareil"],
        };

        this._filterText = "";
        this.update = Update;
        this.factory = Factory;
        this.renderer = Renderer;
    }

    get filterText() {
        return this._filterText;
    }

    set filterText(text) {
        const old = this._filterText;
        if (text.length > 2) {
            this._filterText = text;
        } else {
            this._filterText = "";
        }
        if (old !== this._filterText) {
            this.filteredList = this.update.byText(
                this.originals,
                this._filterText
            );
            this.filter();
        }
    }

    init() {
        this.factory.recipes(this.originals);

        // Ajout des différents filters dans la map
        // Fonction filter ingrédient pour trier selon le tableau des tags
        this.filterFunctions.set("i", (tagName, recipe) =>
            recipe.ingredients.find(
                (ing) => ing.ingredient.toLowerCase() === tagName
            )
        );

        // Fonction filter utensils pour trier selon le tableau des tags
        this.filterFunctions.set("u", (tagName, recipe) =>
            recipe.ustensils.find((u) => u.toLowerCase() === tagName)
        );

        // Fonction filter appliance pour trier selon le tableau des tags
        this.filterFunctions.set(
            "a",
            (tagName, recipe) => recipe.appliance.toLowerCase() === tagName
        );

        // generate list of items for ingredients
        const list = new Set();
        this.originals.map((r) =>
            r.ingredients.map((i) => list.add(i.ingredient.toLowerCase()))
        );
        list.forEach((i) => this.itemsI.push({ name: i, type: "i" }));

        // generate list of items for appliances
        list.clear();
        this.originals.map((a) => list.add(a.appliance.toLowerCase()));
        list.forEach((a) => this.itemsA.push({ name: a, type: "a" }));

        // generate list of items for utensils
        list.clear();
        this.originals.map((r) =>
            r.ustensils.map((u) => list.add(u.toLowerCase()))
        );
        list.forEach((u) => this.itemsU.push({ name: u, type: "u" }));

        const that = this;
        const tagsElement = document.querySelector(".tags");
        const onClickTagElement = (tagElement, itemElement) => {
            itemElement.classList.remove("hide");
            tagsElement.removeChild(tagElement);
            // filter...
            that.tags = that.tags.filter(
                (t) => t.name !== tagElement.textContent
            );
            that.filter();
        };

        const onClickItemElement = (itemElement) => {
            itemElement.classList.add("hide");
            console.log(itemElement, itemElement.itemtype);
            const tagElement = that.factory.tag(
                itemElement.itemtype,
                itemElement.textContent,
                onClickTagElement,
                itemElement
            );
            tagsElement.appendChild(tagElement);
            that.tags.push(tagElement);
            that.filter();
        };

        this.factory.items(
            document.querySelector("#dropDown-I"),
            this.itemsI,
            onClickItemElement
        );
        this.factory.items(
            document.querySelector("#dropDown-U"),
            this.itemsU,
            onClickItemElement
        );
        this.factory.items(
            document.querySelector("#dropDown-A"),
            this.itemsA,
            onClickItemElement
        );

        this.renderer.recipes(this.originals, this.originals);
    }

    filter() {
        this.filteredList = this.update.byText(
            this.originals,
            this._filterText
        );
        this.filteredList = this.update.byTags(
            this.filterFunctions,
            this.filteredList,
            this.tags
        );
        this.renderer.recipes(this.originals, this.filteredList);
        // this.renderer.items();
    }
}

// Interface
function enableFilterItems(filter, type) {
    ["I", "A", "U"].map((i) => {
        const div = document.getElementById(`tag${i}`);
        div.classList.remove("active");
        const input = div.querySelector(`input`);
        input.placeholder = filter.placeholders[i][0];
        document.getElementById(`dropDown-${i}`).classList.remove("show");
    });
    const div = document.getElementById(`tag${type}`);
    div.classList.add("active");
    const input = div.querySelector(`input`);
    input.placeholder = filter.placeholders[type][1];
    document.getElementById(`dropDown-${type}`).classList.add("show");
}

// #region
// const renderTagLists = () => {
//     renderTagList(TAGS_I, document.querySelector("#dropDown-I"));
//     renderTagList(TAGS_U, document.querySelector("#dropDown-U"));
//     renderTagList(TAGS_A, document.querySelector("#dropDown-A"));
// };

// const renderTagList = (tagList, container) => {
//     container.innerHTML = "";
//     for (let tag of tagList.values()) {
//         const span = document.createElement("span");
//         span.textContent = tag.name;
//         span.setAttribute("itemtype", tag.type);
//         span.classList.add("dropDown--item");
//         container.appendChild(span);
//         span.onclick = (e) => {
//             span.classList.add("hide");
//             createTag(span, span.textContent, tag.type);
//         };
//     }
// };

// const createTag = (element, t, type, recipes) => {
//     const item = { type: type, name: t.toLowerCase() };
//     const div = document.querySelector(".tags");
//     const tag = document.createElement("span");
//     tag.textContent = t;
//     const typeClass = type.toUpperCase();
//     tag.classList.add("tag", "drop_list--" + typeClass);
//     tag.onclick = () => {
//         element.classList.remove("hide");
//         div.removeChild(tag);
//         // filter...
//         tags_all.splice(tags_all.indexOf(item), 1);
//         filterAndRenderTags();
//     };
//     div.appendChild(tag);
//     // filter...
//     tags_all.push(item);
//     filterAndRenderTags();
// };

// const filterAndRenderTags = () => {
//     const filteredListByTag = FilterLogic.byTags(filteredList, tags_all);
//     renderCards(filteredListByTag);
// };

// const removeActive = (i) => {
//     console.log("test");
//     const div = document.getElementById(`tag${i}`);
//     div.classList.remove("active");
//     document.getElementById(`dropDown-${i}`).classList.remove("show");
// };
// #endregion

window.onload = async () => {
    const searchInput = document.querySelector("#search");
    const tagI = document.querySelector("#tagI--title");
    const tagA = document.querySelector("#tagA--title");
    const tagU = document.querySelector("#tagU--title");
    const dropA = document.querySelector("#tagDropA");

    const filter = new Filter(await api());
    filter.init();

    // filteredList = originals;
    // createCards(originals);
    // FilterLogic.listTags(originals);

    // function filterInput() {
    //     filter.filterText = searchInput.value
    //     // filteredList =
    //     //     searchInput.value.length > 2
    //     //         ? FilterLogic.byText(originals, searchInput.value)
    //     //         : originals;
    //     // filter.renderer.recipes(filter.originals, filter.filteredList);
    //     // renderTagLists();
    // }

    // filterInput();

    // EventListener Input

    tagI.addEventListener("click", (e) => enableFilterItems(filter, "I"));
    tagA.addEventListener("click", (e) => enableFilterItems(filter, "A"));
    tagU.addEventListener("click", (e) => enableFilterItems(filter, "U"));

    // dropA.addEventListener("click", (e) => removeActive("A"));

    // oninput : Filters items in dropdown menus
    tagI.addEventListener("input", (e) =>
        filter.renderer.items(
            document.getElementById(`dropDown-I`),
            e.target.value
        )
    );

    tagA.addEventListener("input", (e) =>
        filter.renderer.items(
            document.getElementById(`dropDown-A`),
            e.target.value
        )
    );

    tagU.addEventListener("input", (e) =>
        filter.renderer.items(
            document.getElementById(`dropDown-U`),
            e.target.value
        )
    );

    searchInput.addEventListener(
        "input",
        (e) => (filter.filterText = e.target.value)
    );
};
