2 fonctionnalités :
- recherche
- tag

recherche               ajout/suppression de tag
     ---------------------------
              filtration


global searchText = ''
global tags = []

input.onchange = (e) => { searchText = e.target.value; filter(searchText, tags) }
 onTagsChange = () => {
    addTags (tagName)
    filter(searchText, tags)
}

const filter_ing = (tagName, recipe) => {
    // trie ...
    return recipe.ingredients.find(ing=>ing.ingredient.toLowerCase()===tagName)
}

const filter_ust = (tagName, recipe) => {
    // trie ...
    return recipe.ustensil.find(u=>tagName.toLowerCase()===u)
}

const filter_app = (tagName, recipe) => {
    // trie ...
    return recipe.appliance.toLowerCase() === tagName
}

const FILTERS = new Map()
FILTERS.set('i', filter_ing)
FILTERS.set('u', filter_ust)
FILTERS.set('a', filter_app)

function filterRecipesByText(recipes, text) {
    const p = text.toLowerCase().trim()
    return recipes.filter(item => item.name.toLowerCase().includes(p)
                || (item.ingredients.find(i => i.ingredient.includes(p))!=null)
                || item.description.toLowerCase().includes(p)
    )
}

function filterByTags(recipes:Array<Recipe>, tags) {
    return recipes.filter(recipe =>
        tags.filter( tag => FILTERS.get(tag.type)(tag.name, recipe) ).length === tags.length
    )
}

function filter (text, tags) {
    let filtered:Array<Recipe> = [...recipes]
    if(text.length>2){
        // filter cards by title or desc or ingredients
        filtered = filterRecipesByText(recipes, text)
    }

    if (tags.length) {
        // { name: "tagname", type: "u"stensil/"i"ngredient/"a"ppareil }
        // filter by tag
        filtered = filterByTags(filtered, tags)
    }

    // generate list des ingredients/ustensils/appareils
    const array = new Set()
}

