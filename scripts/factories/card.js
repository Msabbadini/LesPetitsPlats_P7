const rep_words = [
  { key: "cuillères", value: "c" },
  { key: "cuillère", value: "c" },
  { key: " à soupe", value: "s" },
  { key: "gramme", value: "gr" },
  { key: "grammes", value: "gr" },
];

export default class Card {
  constructor(data) {
    // Récupération des données
    this.data = data;
    this.container = document.querySelector(".card_container");
    this.template = document.querySelector("#card_recipe");
    this.card = this.template.content.cloneNode(true);
    this.titleCard = this.card.querySelector(".card_content_header_title");
    this.timeCard = this.card.querySelector(".card_content_header_time_text");
    this.listeCard = this.card.querySelector(".card_content_body_liste");
    this.instructionCard = this.card.querySelector(
      ".card_content_body_instruction"
    );

    this.render();
  }

  getUnity = (param) =>
    rep_words.reduce((p, kv) => p.replace(kv.key, kv.value), param);

  setListIngredient = (item) => {
    const span = document.createElement("span");
    span.classList.add("list_inline");
    const p = document.createElement("p");
    const strong = document.createElement("span");
    strong.classList.add("ingredient");
    strong.textContent = `${item.ingredient} `;
    span.appendChild(strong);

    p.textContent = `${item.quantity ? `: ${item.quantity}` : ""} ${
      item.unit ? this.getUnity(item.unit) : ""
    }`;
    span.appendChild(p);
    return span;
  };

  setList = () => {
    this.data.ingredients.map((item) => {
      this.listeCard.append(this.setListIngredient(item));
    });
  };

  render = () => {
    this.titleCard.textContent = this.data.name;
    this.timeCard.textContent = `${this.data.time} min`;
    this.setList();
    let desc = this.data.description;
    const desc_len = 250;
    if (desc.length > desc_len) {
      desc = desc.substring(0, desc_len);
      for (let i = desc_len; i > 0; i--)
        if (desc[i] === " ") {
          desc = desc.substring(0, i);
          break;
        }
      desc += "...";
    }
    this.instructionCard.textContent = desc;

    this.container.appendChild(this.card);
  };
}
