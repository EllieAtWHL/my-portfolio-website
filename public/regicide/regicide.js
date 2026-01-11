import Deck from "./deck.js"
import Toast from "../scripts/toast.js"

const NUM_OF_PLAYERS = 1
const TOTAL_JESTERS = 2
const HAND_LIMIT = 8
const CARD_VALUE_MAP = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 10,
    "Q": 15,
    "K": 20,
    "A": 1
} 
const SUIT_POWER_MAP = {
    "♠": "Shield against enemy attack",
    "♥": "Heal from the discard",
    "♣": "Double damage",
    "♦": "Draw cards"
}
const ROYAL_STATS_MAP = {
    "J": {attack: 10, health: 20},
    "Q": {attack: 15, health: 30},
    "K": {attack: 20, health: 40}
}
const GAME_STATS_MAP = [
    {'name':'ellieatwhl_stats_date', 'label':'Stats since'},
    {'name':'ellieatwhl_games_started', 'label':'Games started:'},
    {'name':'ellieatwhl_games_won', 'label':'Games won:'},
    {'name':'ellieatwhl_games_lost', 'label':'Games lost:'}
]

const statsIcon = document.getElementById('stats-icon')

const gameStart =  document.getElementById('game-start')
const playButton = document.getElementById('play-game')
const playArea = document.getElementById('play-area')
const statsScreen = document.getElementById('stats-screen')
const gameMessage = document.getElementById('game-message')
const messageElement = document.getElementById('message')
const statsMessageElement = document.getElementById('stat-message')
const royalDeckElement = document.querySelector('.royal-deck')
const drawDeckElement = document.querySelector('.draw-deck')
const royalCardSlot = document.querySelector('.royal-card-slot')
const discardCardSlot = document.querySelector('.discard-card-slot')
const attackElement = document.querySelector('.attack')
const healthElement = document.querySelector('.health')
const powerTextElement = document.querySelector('.power-text')
const attackButton = document.getElementById('attack-button')
const jesterButton = document.getElementById('use-jester')
const undoButton = document.getElementById('undo-move')
const handSlots = [
    document.getElementById('hand-card-slot-first'),
    document.getElementById('hand-card-slot-second'),
    document.getElementById('hand-card-slot-third'),
    document.getElementById('hand-card-slot-fourth'),
    document.getElementById('hand-card-slot-fifth'),
    document.getElementById('hand-card-slot-sixth'),
    document.getElementById('hand-card-slot-seventh'),
    document.getElementById('hand-card-slot-eigth')
]
const activeSlots = [
    document.getElementById('active-card-slot-first'),
    document.getElementById('active-card-slot-second'),
    document.getElementById('active-card-slot-third'),
    document.getElementById('active-card-slot-fourth'),
    document.getElementById('active-card-slot-fifth'),
    document.getElementById('active-card-slot-sixth'),
    document.getElementById('active-card-slot-seventh'),
    document.getElementById('active-card-slot-eigth')
]
const defenceElement = document.getElementById('defence-message')

let royalDeck, drawDeck, royalCard, chosenCards, activeDeck, discardDeck, playerHand
let currentRoyalAttack, discardedRoyalAttack, currentRoyalHealth, currentShield, onAttack, jestersRemaining
let moves

playButton.addEventListener('click', startGame)
statsIcon.addEventListener('click', seeStats)

handSlots.forEach(slot => {
    slot.addEventListener('click', cardSelected)
})

attackButton.addEventListener('click', handlePlayerAttack)
jesterButton.addEventListener('click', handleUseJester)
undoButton.addEventListener('click', handleUndoMove)

function seeStats(){
    let footerElement = document.getElementById('stats-screen-footer')
    
    let resetButton = document.createElement('button')
    resetButton.id = 'modal-button'
    resetButton.innerText = 'Reset Stats'
    footerElement.appendChild(resetButton)
    resetButton.addEventListener('click', resetStats)

    let closeButton = document.createElement('button')
    closeButton.id = 'modal-button'
    closeButton.innerText = 'Close'
    footerElement.appendChild(closeButton)
    closeButton.addEventListener('click', closeModal)

    let statsHeader = document.createElement('h3')
    statsHeader.innerText = 'Your Statistics'
    statsMessageElement.appendChild(statsHeader)

    let listElement = document.createElement('div')
    listElement.classList.add('stat-message')

    statsMessageElement.appendChild(listElement)

    GAME_STATS_MAP.forEach(stat => {
        let statMessage = document.createElement('p')
        statMessage.classList.add('list-message')
        let statValue = getStat(stat.name)
        if(!statValue) statValue = 0
        statMessage.innerText = `${stat.label} ${statValue}`
        listElement.appendChild(statMessage)
    })
    statsScreen.style.display = 'block'
}

function resetStats(){
    localStorage.clear()
    startGameSetStats()
    closeModal()
    seeStats()
}

function getStat(statName){
    return localStorage.getItem(statName)
}

function startGame() {
    startGameSetStats()
    gameStart.style.display = 'none'
    playArea.style.display = 'grid'
    hideElement(attackButton)
    hideElement(undoButton)
    showElement(jesterButton)
    onAttack = true
    chosenCards = undefined
    activeDeck = undefined
    discardDeck = undefined
    jestersRemaining = TOTAL_JESTERS
    moves = []
    discardedRoyalAttack = 0
    clearDefenceMessage()
    updateJesterText()
    clearActiveDeck()
    updateDiscardPile()
    createDecks()
    setRoyalCard()
    createPlayerHand()
    updateDeckCount()
}

function startGameSetStats(){
    if(!localStorage.getItem('ellieatwhl_stats_date')) {
        let now = new Date;
        now = now.toLocaleString()
        localStorage.setItem('ellieatwhl_stats_date', now)
    }
    const statsSinceDate = localStorage.getItem('ellieatwhl_stats_date')

    if(!localStorage.getItem('ellieatwhl_games_started')) localStorage.setItem('ellieatwhl_games_started', 0)
    let gamesStarted = parseInt(localStorage.getItem('ellieatwhl_games_started')) + 1
    localStorage.setItem('ellieatwhl_games_started', gamesStarted)
}

function createDecks(){
    let deck = new Deck()
    let jackCards = []
    let queenCards = []
    let kingCards = []
    let playerCards = []
    deck.cards.forEach(card => {
        switch (card.value) {
            case 'J':
                jackCards.push(card)
                break
            case 'Q':
                queenCards.push(card)
                break
            case 'K':
                kingCards.push(card)
                break
            default:
                playerCards.push(card)
                break
        }
    })
    drawDeck = new Deck(playerCards)
    drawDeck.shuffle()
    royalDeck =  createRoyalDeck(jackCards, queenCards, kingCards)
}

function createRoyalDeck(jacks, queens, kings){
    let jacksDeck = new Deck(jacks)
    jacksDeck.shuffle()
    let queensDeck = new Deck(queens)
    queensDeck.shuffle()
    let kingsDeck = new Deck(kings)
    kingsDeck.shuffle()
    return new Deck(jacksDeck.cards.concat(queensDeck.cards, kingsDeck.cards))
}

function setRoyalCard(){
    royalCard = royalDeck.pop()
    if(!royalCard) wonGame()
    currentRoyalAttack = ROYAL_STATS_MAP[royalCard.value].attack
    currentRoyalHealth = ROYAL_STATS_MAP[royalCard.value].health
    renderRoyalCard()
}

function renderRoyalCard(){
    royalCardSlot.innerHTML = ''
    let tempRoyalCard = new Deck([royalCard])
    royalCard = tempRoyalCard.cards[0]
    royalCardSlot.appendChild(royalCard.getHTML())
    powerTextElement.innerText = `Immunity against: ${SUIT_POWER_MAP[royalCard.suit]}`
    updateStatsText()
}

function createPlayerHand(){
    playerHand = new Deck(drawDeck.cards.splice(0, HAND_LIMIT))
    playerHand.sort()
    updatePlayerHand()

}

function updatePlayerHand(){
    handSlots.forEach( (slot, index) => {
        slot.innerHTML = ''
        if(playerHand.cards[index]){
            slot.appendChild(playerHand.cards[index].getHTML())
        }
    })
}

function setState(){
    return {
        discardDeck: discardDeck ? new Deck(discardDeck.cards) : null,
        playerHand: playerHand ? new Deck(playerHand.cards) : null,
        royalDeck: royalDeck ? new Deck(royalDeck.cards) : null,
        activeDeck: activeDeck ? new Deck(activeDeck.cards) : null,
        chosenCards: chosenCards ? new Deck(chosenCards.cards) : null,
        drawDeck: drawDeck ? new Deck(drawDeck.cards) : null,
        royalCard: royalCard ? JSON.parse(JSON.stringify(royalCard)) : null,
        royalAttack: currentRoyalAttack,
        royalHealth: currentRoyalHealth,
        currentShield: currentShield,
        jestersRemaining: jestersRemaining,
        discardedRoyalAttack: discardedRoyalAttack,
        onAttack: onAttack
    }
}



function resetState(state){
    activeDeck = state.activeDeck ? new Deck(state.activeDeck.cards) : null
    chosenCards = state.chosenCards ? new Deck(state.chosenCards.cards) : null
    discardDeck = state.discardDeck ? new Deck(state.discardDeck.cards) : null
    drawDeck = state.drawDeck ? new Deck(state.drawDeck.cards) : null
    playerHand = state.playerHand ? new Deck(state.playerHand.cards) : null
    royalDeck = state.royalDeck ? new Deck(state.royalDeck.cards) : null
    royalCard = state.royalCard
    currentRoyalAttack = state.royalAttack
    currentRoyalHealth = state.royalHealth
    currentShield = state.currentShield
    jestersRemaining = state.jestersRemaining
    discardedRoyalAttack = state.discardedRoyalAttack
    onAttack = state.onAttack
  
    updateAllItems()
}

function cardSelected(){
    let type = onAttack ? 'playCard' : 'discardCard'
    let state = setState();
    moves.unshift({type: type, state: state})

    if(!event.target.dataset.value) return
    let cardValue = event.target.dataset
    let selectedCard = {suit: cardValue.suit, value: cardValue.value}
    if(onAttack){
        if(invalidSelection(selectedCard)){
            let toast = new Toast({
                text: 'Illegal move',
                error: true
            })
            moves.shift()
        }
        else {
            showElement(attackButton)
            moveSelectedCardToChosenCards(selectedCard)
            let slotToClear = event.target.parentElement
            renderSelectedCardMovement(slotToClear)
        }
    } else {        
        discardedRoyalAttack -= CARD_VALUE_MAP[selectedCard.value]
        moveSelectedCardToDiscard(selectedCard)
        let slotToClear = event.target.parentElement
        renderDiscardedCardMovement(slotToClear)
        if(discardedRoyalAttack <= 0) {
            clearDefenceMessage()
            onAttack = true
        } else {
            updateDefenceMessage()
        }
        if(playerHand.numberOfCards === 0 && jestersRemaining === 0) {
            alertBox(['Sorry, you lost'], true)
            let gamesLost = parseInt(localStorage.getItem('ellieatwhl_games_lost'))
            if(!gamesLost){
                gamesLost = 1
            } else {
                gamesLost++
            }
            localStorage.setItem('ellieatwhl_games_lost', gamesLost)
        }
    }
    if(moves.length > 0) showElement(undoButton)
}

function invalidSelection(selectedCard){
    if(activeDeckEmpty()) return false
    if(activeCompanion(selectedCard)) return false
    if(activeSet(selectedCard)) return false
    return true
}
function activeDeckEmpty(){
    return !chosenCards || chosenCards.numberOfCards < 1
}
function activeCompanion(selectedCard){
    return  chosenCards
        &&  chosenCards.numberOfCards === 1 
        &&  ((chosenCards.cards[0].value === 'A' && selectedCard.value !== 'A')
            || (selectedCard.value === 'A' && chosenCards.cards[0].value !== 'A')) 
        
}
function activeSet(selectedCard){
    if (CARD_VALUE_MAP[selectedCard.value] > 4 || selectedCard.value === 'A') return false
    if (validSet(selectedCard)) return true
    return false
}
function validSet(selectedCard){
    if(selectedMatchesActive(selectedCard)) {
        return sumOfCardsLessThanTen(selectedCard)
    }
    return false
}
function selectedMatchesActive(selectedCard){
    let match = true
    chosenCards.cards.forEach(card => {
        match = match && (card.value === selectedCard.value)
    })
    return match
}
function sumOfCardsLessThanTen(selectedCard){
    if(selectedCard.value === "4" & chosenCards.numberOfCards < 2) return true
    if(selectedCard.value === "3" & chosenCards.numberOfCards < 3) return true
    if(selectedCard.value === "2" & chosenCards.numberOfCards < 4) return true
    return false
}

function moveSelectedCardToChosenCards(selectedCard){
    let removedCard = playerHand.remove(selectedCard);
    if(!chosenCards) chosenCards = new Deck(removedCard);
    else chosenCards.push(removedCard[0])
}

function moveSelectedCardToDiscard(selectedCard){
    let removedCard = playerHand.remove(selectedCard);
    if(!discardDeck) discardDeck = new Deck(removedCard)
    else {
        discardDeck = new Deck(removedCard.concat(discardDeck.cards))
    }
}

function renderSelectedCardMovement(slot){
    let cardToCreate = slot.innerHTML
    slot.innerHTML = ''
    let slotToPopulate = chosenCards.numberOfCards - 1
    if(activeDeck) slotToPopulate += activeDeck.numberOfCards
    activeSlots[slotToPopulate].innerHTML = cardToCreate
}

function renderActiveDeck(){
    let activeAreaCards = {cards: []}
    if(activeDeck && chosenCards){
        activeAreaCards = new Deck(activeDeck.cards.concat(chosenCards.cards))
    } else if(activeDeck){
        activeAreaCards = new Deck(activeDeck.cards)
    } else if(chosenCards){
        activeAreaCards = new Deck(chosenCards.cards)
    }
    activeSlots.forEach((slot,index) => {
        slot.innerHTML = ''
        if(activeAreaCards?.cards[index]){
            slot.appendChild(activeAreaCards.cards[index].getHTML())
        } 
    })
}

function renderDiscardedCardMovement(slot){
    slot.innerHTML = ''
    updateDiscardPile()
}

function handlePlayerAttack(){

    let state = setState()
    moves.unshift({type: 'playerAttack', state: state})

    let suitsActive= []
    chosenCards.cards.forEach( card => {
        if(card.suit !== royalCard.suit){
            suitsActive.push(card.suit)
        }
        else {
            const toast = new Toast({
                text: `${card.suit} power is blocked`,
            })
        }
    })
    if(suitsActive.includes('♥')){
        handleHearts()
    }
    if(suitsActive.includes('♦')){
        handleDiamonds()
    }
    playerAttack(suitsActive)
    if(moves.length > 0) showElement(undoButton)
}

function totalPlayerAttack(){
    let total = 0
    chosenCards.cards.forEach(card => {
        total += CARD_VALUE_MAP[card.value]
    })
    return total
}

function handleHearts(){
    let maxHeal = Math.min(totalPlayerAttack(), discardDeckCardTotal())
    if (maxHeal > 0) {
        healFromDiscard(maxHeal)
    } else {
        let toast =  new Toast({
            text: `Unable to heal from discard`
        })
    }
}

function healFromDiscard(maxHeal){
    let toast = new Toast({
        text: `Healing ${maxHeal} ${maxHeal === 1 ? 'card' : 'cards'} from the discard pile`
    })
    discardDeck.shuffle()
    let healedCards = discardDeck.cards.splice(0,maxHeal)
    drawDeck = new Deck(drawDeck.cards.concat(healedCards))
    updateDiscardPile()
    updateDeckCount()
}

function discardDeckCardTotal(){
    if (!discardDeck) return 0
    return discardDeck.numberOfCards
}

function handleDiamonds(){
    let maxDraw = Math.min(totalPlayerAttack(), HAND_LIMIT - playerHand.numberOfCards, drawDeck.numberOfCards)
    if (maxDraw > 0) drawFromTavern(maxDraw)
}

function drawFromTavern(maxDraw){
    let toast = new Toast({
        text: `Drawing ${maxDraw} ${maxDraw === 1 ? 'card' : 'cards'} from tavern`
    })
    let drawnCards = []
    for(let i=0;i<maxDraw;i++){
        drawnCards.push(drawDeck.pop())
    }
    playerHand = new Deck(playerHand.cards.concat(drawnCards))
    playerHand.sort()
    updatePlayerHand()
    updateDeckCount()
}

function playerAttack(suits){
    let damageDealt = totalPlayerAttack()
    if(suits.includes('♣')) damageDealt += damageDealt
    currentRoyalHealth -= damageDealt
    let toast = new Toast({
        text: `Attacking ${royalCard.value}${royalCard.suit} for ${damageDealt} damage`
    })
    if(currentRoyalHealth > 0) {
        if (!activeDeck) activeDeck = new Deck(chosenCards.cards)
        else activeDeck = new Deck(activeDeck.cards.concat(chosenCards.cards))
        updateHealthText()
        hideElement(attackButton);
        if(playerHand.numberOfCards === 0 && jestersRemaining === 0) alertBox(['Sorry, you lost'], true)
        else handleRoyalAttack(suits)
    }
    else handleRoyalDefeated(currentRoyalHealth === 0)
}

function handleRoyalAttack(suits){
    onAttack = false
    if(!currentShield) currentShield = 0
    if(suits.includes('♠')){
        let shield = royalCard.suit === '♠' ? 0 : getCardShield(chosenCards.cards)
        currentRoyalAttack -= shield
        if (currentRoyalAttack < 0) currentRoyalAttack = 0
        currentShield += shield
        updateAttackText()
    }
    let toast = new Toast({
        text: `${royalCard.value}${royalCard.suit} is attacking for ${currentRoyalAttack}`
    })
    discardedRoyalAttack = currentRoyalAttack
    chosenCards = undefined
    if(currentRoyalAttack <= 0 ) onAttack = true;
    else {
       updateDefenceMessage()
    }    
}

function updateDefenceMessage(){
    if(discardedRoyalAttack > 0){
        defenceElement.innerText = `Current defence needed is ${discardedRoyalAttack}`
        showElement(defenceElement)
    }
    if(discardedRoyalAttack <= 0){
        hideElement(defenceElement)
        defenceElement.innerText = ` Defence Message `
    }
}
function clearDefenceMessage(){
    hideElement(defenceElement)
    defenceElement.innerText = ` Defence Message `
}

function getCardShield(cards){
    let shield = 0
    cards.forEach(card => {
        shield += CARD_VALUE_MAP[card.value]
    })
    return shield
}

function handleRoyalDefeated(exactKill){
    if(exactKill) {
        let toast = new Toast({
            text: `${royalCard.value}${royalCard.suit} defeated with critical hit`
        })
        drawDeck = new Deck([royalCard].concat(drawDeck.cards))
    }
    else {
        let toast = new Toast({
            text: `${royalCard.value}${royalCard.suit} defeated`
        })
        if(!discardDeck) discardDeck = new Deck([royalCard])
        else discardDeck = new Deck([royalCard].concat(discardDeck.cards))
    }
    
    if(playerHand.numberOfCards === 0 && jestersRemaining === 0) alertBox(['Sorry, you lost'], true)

    currentShield = 0
    moveActiveToDiscard()
    setRoyalCard()
    updateDeckCount()
}

function moveActiveToDiscard(){
    if(!discardDeck) discardDeck = new Deck(chosenCards.cards)
    else {
        if (activeDeck?.cards) discardDeck = new Deck(chosenCards.cards.concat(discardDeck.cards, activeDeck.cards))
        else discardDeck = new Deck(chosenCards.cards.concat(discardDeck.cards))
    }
    chosenCards = undefined
    activeDeck = undefined
    updateDiscardPile()
    clearActiveDeck()
}

function clearActiveDeck(){
    activeSlots.forEach(slot => {
        slot.innerHTML = ''
    })
    hideElement(attackButton);
}

function updateDiscardPile(){
    discardCardSlot.innerText = ''
    if(discardDeck?.cards[0]) discardCardSlot.appendChild(discardDeck.cards[0].getHTML())
    else discardCardSlot.innerText = 'Discard Pile'

}

function updateStatsText(){
    updateAttackText()
    updateHealthText()
}
function updateAttackText(){
    attackElement.innerText = `${currentRoyalAttack}`
}
function updateHealthText(){
    healthElement.innerText = `${currentRoyalHealth}`
}

function updateDeckCount() {
    royalDeckElement.innerText = royalDeck.numberOfCards
    drawDeckElement.innerText = drawDeck.numberOfCards
}

function handleUseJester(){
    let state = setState()
    moves.unshift({type: 'useJester', state: state})
    if(jestersRemaining < 1) {
        alertBox([`No jesters remaining`], false)
        return
    }
    jestersRemaining--
    discardPlayerHand()
    updateJesterText()
    if(jestersRemaining === 0){
        hideElement(jesterButton)
    }
    if(moves.length > 0) showElement(undoButton)
}

function discardPlayerHand(){
    if (!discardDeck) discardDeck = new Deck(playerHand.cards)
    else {
        discardDeck = new Deck(playerHand.cards.concat(discardDeck.cards))
    }
    createPlayerHand()
    updateDiscardPile()
    updateDeckCount()
}

function updateJesterText(){
    let jesterMessage = document.getElementById('jester-message')
    jesterMessage.innerText = `Jesters left: ${jestersRemaining}`
}

function handleUndoMove(){
    let moveToUndo = moves.shift()
    resetState(moveToUndo.state)
}

function wonGame(){
    alertBox([`You won the game?!?`], true)
    
    let gamesWon = parseInt(localStorage.getItem('ellieatwhl_games_won'))
    if(!gamesWon){
        gamesWon = 1
    } else {
        gamesWon++
    }
    localStorage.setItem('ellieatwhl_games_won', gamesWon)
}

function alertBox(messages, endGame){
    if(endGame){
        addAlertBoxButton('Restart', endGame)
    } else {
        addAlertBoxButton('Continue')
    }

    let listElement = document.createElement('div')
    listElement.classList.add('message')

    messageElement.appendChild(listElement)
    messages.forEach((message) => {
        let listMessage = document.createElement('p')
        listMessage.classList.add('list-message')
        listMessage.innerText = message
        listElement.appendChild(listMessage)
    }) 
    gameMessage.style.display = 'block'
    
}

function addAlertBoxButton(label, endGame){
    let footerElement = document.getElementById('game-message-footer')
    let button = document.createElement('button')
    button.id = 'modal-button'
    button.innerText = label
    footerElement.appendChild(button)
    if(endGame){
        button.addEventListener('click', restartGame)
    } else {
        button.addEventListener('click', closeModal)
    }
}

function closeModal(){
    while(document.getElementById('modal-button')) {
        let button = document.getElementById('modal-button')
        button.removeEventListener('click', closeModal)
        button.remove()
    }
    clearModal()
}

function restartGame(){   
    let button = document.getElementById('modal-button')
    button.removeEventListener('click', closeModal)
    button.remove()
    startGame()
    clearModal()
}

function clearModal(){
    gameMessage.style.display = 'none'
    statsScreen.style.display = 'none'
    statsMessageElement.innerHTML = ''
    messageElement.innerHTML = ''
    let footerElement = document.querySelector('.modal-footer')
    footerElement.innerHTML = ''
}

function updateAllItems(){
    if(!chosenCards) hideElement(attackButton)
    if(moves.length < 1) hideElement(undoButton)
    renderRoyalCard()
    updateDeckCount()
    updateDefenceMessage()
    updateDiscardPile()
    updateJesterText()
    renderActiveDeck()
    updatePlayerHand()
}

function hideElement(element){
    element.classList.add('hide')
    element.classList.remove('show');
}

function showElement(element){
    element.classList.remove('hide')
    element.classList.add('show');
}