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
        const tag = document.createElement("span");
        tag.textContent = text;

        tag.type = type;
        tag.name = text;

        tag.classList.add("tag", "drop_list--" + type.toUpperCase());

        tag.onclick = () => onclick && onclick(tag, ...rest);

        return tag;
    },
};

const Renderer = {
    recipes: (recipes, activeRecipes) => {
        recipes.map((r) => r.card.element.classList.add("hide"));
        activeRecipes.map((r) => r.card.element.classList.remove("hide"));
    },

    listItems: (container, availableItems) => {
        console.log(availableItems);
        container.querySelectorAll("span").forEach((f) => {
            const t = f.textContent.toLowerCase();
            f.style.display = availableItems.find((i) => t === i.name)
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

    listTagsA: (filteredList, array) => {
        // update de liste
        const list = new Set();
        filteredList.map((a) => list.add(a.appliance.toLowerCase()));
        console.log("list", list);
        list.forEach((a) => array.push({ name: a, type: "a" }));
    },
    listTagsU: (filteredList, array) => {
        const list = new Set();
        filteredList.map((r) =>
            r.ustensils.map((u) => list.add(u.toLowerCase()))
        );
        list.forEach((u) => array.push({ name: u, type: "u" }));
    },
    listTagsI: (filteredList, array) => {
        const list = new Set();
        filteredList.map((r) =>
            r.ingredients.map((i) => list.add(i.ingredient.toLowerCase()))
        );
        list.forEach((i) => array.push({ name: i, type: "i" }));
    },
    filterItemsByText: (listItems, text) => {
        const t = text.toLowerCase();
        return listItems.filter((i) => i.name.includes(t));
    },
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
        this.availableItemsA = [];
        this.availableItemsU = [];
        this.availableItemsI = [];
        this.activeItemsA = [];
        this.activeItemsU = [];
        this.activeItemsI = [];

        this.placeholders = {
            I: ["Ingrédients", "Recherche un ingrédient"],
            U: ["Ustensiles", "Recherche un ustensile"],
            A: ["Appareils", "Recherche un appareil"],
        };

        this._filterText = "";
        this._filterTextI = "";
        this._filterTextA = "";
        this._filterTextU = "";
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

    get filterTextI() {
        return this._filterTextI;
    }
    get filterTextA() {
        return this._filterTextA;
    }
    get filterTextU() {
        return this._filterTextU;
    }

    set filterTextI(text) {
        const old = this._filterTextI;
        this._filterTextI = text;
        if (old !== this._filterTextI) {
            this.activeItemsI = this.update.filterItemsByText(
                this.availableItemsI,
                this._filterTextI
            );
            this.renderer.listItems(
                document.getElementById(`dropDown-I`),
                this.activeItemsI
            );
        }
    }
    set filterTextA(text) {
        const old = this._filterTextA;
        this._filterTextA = text;
        if (old !== this._filterTextA) {
            this.activeItemsA = this.update.filterItemsByText(
                this.availableItemsA,
                this._filterTextA
            );
            this.renderer.listItems(
                document.getElementById(`dropDown-A`),
                this.activeItemsA
            );
        }
    }
    set filterTextU(text) {
        const old = this._filterTextU;
        this._filterTextU = text;
        if (old !== this._filterTextU) {
            this.activeItemsU = this.update.filterItemsByText(
                this.availableItemsU,
                this._filterTextU
            );
            this.renderer.listItems(
                document.getElementById(`dropDown-U`),
                this.activeItemsU
            );
        }
    }

    init() {
        this.factory.recipes(this.originals);

        // #region - Ajout des différents filters dans la map
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
        // #endregion

        // #region - generate items' lists
        // generate list of items for ingredients
        this.update.listTagsI(this.originals, this.itemsI);
        // generate list of items for appliances
        this.update.listTagsA(this.originals, this.itemsA);
        // generate list of items for utensils
        this.update.listTagsU(this.originals, this.itemsU);
        this.availableItemsI = [...this.itemsI];
        this.availableItemsA = [...this.itemsA];
        this.availableItemsU = [...this.itemsU];
        this.activeItemsI = [...this.itemsI];
        this.activeItemsA = [...this.itemsA];
        this.activeItemsU = [...this.itemsU];
        // #endregion

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

        this.filteredList = [...this.originals];
        this.render();
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

        this.availableItemsI.length = 0;
        this.availableItemsU.length = 0;
        this.availableItemsA.length = 0;

        this.update.listTagsI(this.filteredList, this.availableItemsI);
        this.update.listTagsU(this.filteredList, this.availableItemsU);
        this.update.listTagsA(this.filteredList, this.availableItemsA);

        this.activeItemsI = this.update.filterItemsByText(
            this.availableItemsI,
            this._filterTextI
        );
        this.activeItemsU = this.update.filterItemsByText(
            this.availableItemsU,
            this._filterTextU
        );
        this.activeItemsA = this.update.filterItemsByText(
            this.availableItemsA,
            this._filterTextA
        );
        console.log(this.tags);
        this.activeItemsI = this._filterActiveTag(this.activeItemsI);
        this.activeItemsU = this._filterActiveTag(this.activeItemsU);
        this.activeItemsA = this._filterActiveTag(this.activeItemsA);

        this.render();
    }

    _filterActiveTag(activeItems) {
        console.log("filter remove tags", this.tags);
        return activeItems.filter(
            (i) =>
                !this.tags.find((t) => t.type === i.type && t.name === i.name)
        );
    }

    render() {
        this.renderer.listItems(
            document.querySelector("#dropDown-A"),
            this.activeItemsA
        );
        this.renderer.listItems(
            document.querySelector("#dropDown-I"),
            this.activeItemsI
        );
        this.renderer.listItems(
            document.querySelector("#dropDown-U"),
            this.activeItemsU
        );

        this.renderer.recipes(this.originals, this.filteredList);
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
    if (div.classList.contains("active")) {
        console.log(" active");
        div.classList.remove("active");
        const input = div.querySelector(`input`);
        input.placeholder = filter.placeholders[type][0];
        document.getElementById(`dropDown-${type}`).classList.remove("show");
    } else {
        console.log("not active");
        div.classList.add("active");
        const input = div.querySelector(`input`);
        input.placeholder = filter.placeholders[type][1];
        document.getElementById(`dropDown-${type}`).classList.add("show");
    }
    document.querySelector(".hidder").style.display = "block";
}

function disableFilterItems(filter) {
    ["I", "A", "U"].map((i) => {
        const div = document.getElementById(`tag${i}`);
        div.classList.remove("active");
        const input = div.querySelector(`input`);
        input.placeholder = filter.placeholders[i][0];
        document.getElementById(`dropDown-${i}`).classList.remove("show");
    });
    document.querySelector(".hidder").style.display = "none";
}

window.onload = async () => {
    const filter = new Filter(await api());
    filter.init();

    const searchInput = document.querySelector("#search");

    const hideDropdowns = document.querySelector(".hidder");
    disableFilterItems(filter);

    const tagI = document.querySelector("#tagI--title");
    const tagA = document.querySelector("#tagA--title");
    const tagU = document.querySelector("#tagU--title");

    // EventListener Input

    tagI.addEventListener("click", (e) => enableFilterItems(filter, "I"));
    tagA.addEventListener("click", (e) => enableFilterItems(filter, "A"));
    tagU.addEventListener("click", (e) => enableFilterItems(filter, "U"));

    hideDropdowns.addEventListener("click", (e) => disableFilterItems(filter));

    // oninput : Filters items in dropdown menus
    tagI.addEventListener("input", (e) => {
        filter.filterTextI = e.target.value.toLowerCase();
    });

    tagA.addEventListener("input", (e) => {
        filter.filterTextA = e.target.value.toLowerCase();
    });

    tagU.addEventListener("input", (e) => {
        filter.filterTextU = e.target.value.toLowerCase();
    });

    searchInput.addEventListener(
        "input",
        (e) => (filter.filterText = e.target.value)
    );
};
