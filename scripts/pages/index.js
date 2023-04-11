import api from '../utils/api.js'
import Card from "../factories/card.js";
import {Filter} from "../utils/filter.js";



window.onload = async () => {
    let searchText=''
    const tags=[]
    const input = document.querySelector('#search')
    const container = document.querySelector('.card_container')
    const recipes = await api
    let result =null
    input.onchange= (e)=>{
        searchText=e.target.value;
        Filter(searchText,tags,recipes)}
}