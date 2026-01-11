const SUITS = ["♠","♥","♣","♦"]
const VALUES = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",

]

export default class Deck {
    constructor(cards = freshDeck()){
        let newCards = []
        cards.forEach(card => {
            newCards.push(new Card(card.suit, card.value))
        })
        this.cards = newCards
    }

    get numberOfCards(){
        return this.cards.length
    }
    
    //takes the first card
    pop() {
        return this.cards.shift()
    }

    //adds to end
    push(card) {
        this.cards.push(card)
    }

    remove(card){
        // find card the matches and remove from array
        let cardIndexToRemove
        for(let i=0;i<this.numberOfCards;i++){
            if (this.matchingCard(card, this.cards[i])) cardIndexToRemove = i
        }
        return this.cards.splice(cardIndexToRemove,1)
    }

    //random shuffle of cards
    shuffle(){
        for(let i = this.numberOfCards - 1; i > 0; i--){
            const newIndex = Math.floor(Math.random() * (i + 1))
            const oldValue = this.cards[newIndex]
            this.cards[newIndex] = this.cards[i]
            this.cards[i] = oldValue
        }
    }

    //sorts cards by suit and then value
    sort(){
        let suitOrdering = this.customOrdering(SUITS)
        let valueOrdering = this.customOrdering(VALUES)
        this.cards.sort(function(a,b){
            return (suitOrdering[a.suit] - suitOrdering[b.suit]) || valueOrdering[a.value] - valueOrdering[b.value]
        })
    }

    matchingCard(cardA, cardB){
        return cardA.value === cardB.value && cardA.suit === cardB.suit
    }

    customOrdering(orderSet){
        let ordering = {}, order = orderSet
        for (let i=0;i<order.length;i++){
            ordering[order[i]] = i
        }
        return ordering
    }
}

class Card {
    constructor(suit, value){
        this.suit = suit
        this.value = value
    }

    get color(){
        return this.suit === "♠" || this.suit === "♣" ? 'black' : 'red'
    }

    getHTML(){
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const valueAsNumber = parseInt(this.value);
        if(isNaN(valueAsNumber)){
            cardDiv.append(this.createPip());
        } else{
            for (let i=0; i<valueAsNumber; i++){
                cardDiv.append(this.createPip());
            }
        }

        cardDiv.append(this.createCornerNumber("top", this.value));
        cardDiv.append(this.createCornerNumber("bottom", this.value));

        cardDiv.dataset.value = `${this.value}`
        cardDiv.dataset.suit = `${this.suit}`

        return cardDiv;
    }

    createPip(){
        const pip = document.createElement("div");
        pip.classList.add("pip");
        return pip;
    }

    createCornerNumber(position, value) {
        const corner = document.createElement("div")
        corner.textContent = value
        corner.classList.add("corner-number")
        corner.classList.add(position)
        return corner
    }
}

function freshDeck() {
    return SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return new Card(suit, value)
        })
    })
}