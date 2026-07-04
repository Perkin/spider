// Spider Solitaire - Пасьянс Паук
// Поддержка 1, 2 и 4 мастей

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
const ALL_SUITS = ['♠', '♥', '♣', '♦'];

class SpiderSolitaire {
    constructor() {
        this.columns = [[], [], [], [], [], [], [], [], [], []];
        this.stock = [];
        this.completedSets = [];
        this.score = 500;
        this.moves = 0;
        this.history = [];
        this.selectedCards = null;
        this.selectedCol = null;
        this.isDragging = false;
        this.dragData = null;
        this.suitCount = 1;
        this.currentShirt = 0;

        this.registerSW();

        const saved = this.loadFromStorage();
        if (saved) {
            this.columns = saved.columns;
            this.stock = saved.stock;
            this.completedSets = saved.completedSets;
            this.score = saved.score;
            this.moves = saved.moves;
            this.suitCount = saved.suitCount || 1;
            if (saved.currentShirt !== undefined) {
                this.currentShirt = saved.currentShirt;
            }
            this.bindEvents();
            this.render();
            this.updateScore();
        } else {
            const lastDiff = this.getLastDifficulty();
            this.suitCount = lastDiff;
            this.currentShirt = this.loadShirt();
            this.bindEvents();
            this.init();
        }
    }

    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW зарегистрирован'))
                .catch((err) => console.log('Ошибка регистрации SW:', err));
        }
    }

    showDifficultyModal() {
        document.getElementById('difficulty-overlay').classList.remove('hidden');
    }

    hideDifficultyModal() {
        document.getElementById('difficulty-overlay').classList.add('hidden');
    }

    getLastDifficulty() {
        try {
            const diff = localStorage.getItem('spider-solitaire-difficulty');
            if (diff) return parseInt(diff);
        } catch(e) {
            // ignore
        }
        return 1;
    }

    setLastDifficulty(difficulty) {
        try {
            localStorage.setItem('spider-solitaire-difficulty', difficulty.toString());
        } catch(e) {
            // ignore
        }
    }

    getSuits() {
        return ALL_SUITS.slice(0, this.suitCount);
    }

    getShirtStyle(index) {
        const styles = {
            0: 'linear-gradient(135deg, #2471a3 0%, #3498db 50%, #2980b9 100%)',
            1: 'linear-gradient(135deg, #0e6655 0%, #148f77 50%, #1abc9c 100%)',
            2: 'linear-gradient(135deg, #922b21 0%, #c0392b 50%, #e74c3c 100%)',
            3: 'repeating-linear-gradient(45deg, #1a5276 0px, #1a5276 10px, #2980b9 10px, #2980b9 20px)',
            4: 'radial-gradient(circle, #8e44ad 0%, #6c3483 100%)',
            5: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 50%, #e67e22 100%)',
            6: 'linear-gradient(135deg, #641e16 0%, #922b21 50%, #b03a2e 100%)',
            7: 'repeating-linear-gradient(0deg, #17a589 0px, #17a589 8px, #48c9b0 8px, #48c9b0 16px)',
            8: 'linear-gradient(135deg, #f0b27a 0%, #b9770e 50%, #7d6608 100%)',
            9: 'repeating-linear-gradient(90deg, #5d4037 0px, #5d4037 12px, #795548 12px, #795548 24px)',
            10: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #7f8c8d 100%)',
            11: 'conic-gradient(from 45deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6, #e74c3c)',
            12: 'repeating-linear-gradient(90deg, #c0392b 0px, #c0392b 8px, #ecf0f1 8px, #ecf0f1 16px)',
            13: 'linear-gradient(135deg, #16a085 0%, #2ecc71 100%)',
            14: 'repeating-conic-gradient(#8e44ad 0% 25%, #af7ac5 0% 50%)',
            15: 'linear-gradient(135deg, #d35400 0%, #e67e22 50%, #f39c12 100%)',
            16: 'repeating-linear-gradient(45deg, #2c3e50 0px, #2c3e50 10px, #34495e 10px, #34495e 20px)',
            17: 'radial-gradient(circle at 30% 30%, #f1c40f 0%, #e67e22 50%, #d35400 100%)',
            18: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #58d68d 100%)',
            19: 'repeating-linear-gradient(135deg, #2980b9 0px, #2980b9 6px, #3498db 6px, #3498db 12px)'
        };
        return styles[index] || styles[0];
    }

    getShirtBorder(index) {
        const borders = {
            0: '#2471a3',
            1: '#0e6655',
            2: '#922b21',
            3: '#1a5276',
            4: '#6c3483',
            5: '#9a7d0a',
            6: '#641e16',
            7: '#117a65',
            8: '#7d6608',
            9: '#5d4037',
            10: '#2c3e50',
            11: '#8e44ad',
            12: '#c0392b',
            13: '#16a085',
            14: '#6c3483',
            15: '#d35400',
            16: '#2c3e50',
            17: '#e67e22',
            18: '#27ae60',
            19: '#2980b9'
        };
        return borders[index] || '#2471a3';
    }

    loadShirt() {
        try {
            const saved = localStorage.getItem('spider-solitaire-shirt');
            if (saved) return parseInt(saved);
        } catch (e) {}
        return 0;
    }

    saveShirt() {
        try {
            localStorage.setItem('spider-solitaire-shirt', this.currentShirt.toString());
        } catch (e) {}
    }

    showShirtModal() {
        document.getElementById('shirt-overlay').classList.remove('hidden');
    }

    hideShirtModal() {
        document.getElementById('shirt-overlay').classList.add('hidden');
    }

    setShirt(index) {
        this.currentShirt = index;
        this.saveShirt();
        this.saveToStorage();
        this.render();
    }

    createDeck() {
        const deck = [];
        const suits = this.getSuits();
        for (let i = 0; i < 8; i++) {
            const suit = suits[i % suits.length];
            for (const rank of RANKS) {
                deck.push({ suit, rank, value: RANK_VALUES[rank], faceUp: false });
            }
        }
        return this.shuffle(deck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    init() {
        const saved = this.loadFromStorage();
        if (saved) {
            this.columns = saved.columns;
            this.stock = saved.stock;
            this.completedSets = saved.completedSets;
            this.score = saved.score;
            this.moves = saved.moves;
            this.suitCount = saved.suitCount || 1;
            if (saved.currentShirt !== undefined) {
                this.currentShirt = saved.currentShirt;
            }
            this.history = [];
            this.render();
            this.updateScore();
            this.setLastDifficulty(this.suitCount);
            return;
        }

        const deck = this.createDeck();
        this.columns = [[], [], [], [], [], [], [], [], [], []];
        this.stock = [];
        this.completedSets = [];
        this.score = 500;
        this.moves = 0;
        this.history = [];
        this.selectedCards = null;
        this.selectedCol = null;

        let cardIdx = 0;
        for (let col = 0; col < 10; col++) {
            const count = col < 4 ? 6 : 5;
            for (let i = 0; i < count; i++) {
                const card = deck[cardIdx++];
                if (i === count - 1) card.faceUp = true;
                this.columns[col].push(card);
            }
        }

        this.stock = deck.slice(cardIdx);
        this.stock.forEach(c => c.faceUp = false);

        this.render();
        this.updateScore();
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            const state = {
                columns: this.columns,
                stock: this.stock,
                completedSets: this.completedSets,
                score: this.score,
                moves: this.moves,
                suitCount: this.suitCount,
                currentShirt: this.currentShirt
            };
            localStorage.setItem('spider-solitaire', JSON.stringify(state));
        } catch(e) {
            // ignore storage errors
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('spider-solitaire');
            if (!data) return null;
            return JSON.parse(data);
        } catch(e) {
            return null;
        }
    }

    clearStorage() {
        localStorage.removeItem('spider-solitaire');
    }

    saveState(moveData) {
        this.history.push({
            columns: this.columns.map(col => col.map(c => ({ ...c }))),
            stock: this.stock.map(c => ({ ...c })),
            completedSets: [...this.completedSets],
            score: this.score,
            moves: this.moves,
            moveData: moveData || this._lastMove || null
        });
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    canMoveCards(col, cardIndex) {
        const colCards = this.columns[col];
        if (cardIndex < 0 || cardIndex >= colCards.length) return false;
        if (!colCards[cardIndex].faceUp) return false;

        const firstSuit = colCards[cardIndex].suit;
        for (let i = cardIndex; i < colCards.length - 1; i++) {
            if (colCards[i].value !== colCards[i + 1].value + 1) {
                return false;
            }
            if (colCards[i].suit !== firstSuit || colCards[i + 1].suit !== firstSuit) {
                return false;
            }
        }
        return true;
    }

    moveCards(fromCol, cardIndex, toCol) {
        if (fromCol === toCol) return false;

        const cards = this.columns[fromCol].slice(cardIndex);
        const moveData = { type: 'move', fromCol, toCol, cardIndex, count: cards.length };

        this.saveState(moveData);

        this.columns[fromCol].splice(cardIndex);
        this.flipTopCard(fromCol);
        this.columns[toCol].push(...cards);
        const completion = this.checkComplete(toCol);

        this.moves++;
        this.score = Math.max(0, this.score - 1);
        this.updateScore();
        
        if (completion) {
            this.render();
            this.saveToStorage();
            this.animateCompletion(completion.positions);
            this.checkWin();
        } else {
            this.render();
            this.saveToStorage();
        }

        const rects = [];
        const toColEl = document.querySelector(`.column[data-col="${toCol}"]`);
        if (toColEl) {
            const cardEls = toColEl.querySelectorAll('.card.front');
            const actualCards = Math.min(cards.length, cardEls.length);
            for (let i = cardEls.length - actualCards; i < cardEls.length; i++) {
                if (i < 0) continue;
                const rect = cardEls[i].getBoundingClientRect();
                rects.push({ left: rect.left, top: rect.top });
            }
        }
        moveData.rects = rects;
        this._lastMove = moveData;

        return true;
    }

    flipTopCard(col) {
        const colCards = this.columns[col];
        if (colCards.length > 0 && !colCards[colCards.length - 1].faceUp) {
            colCards[colCards.length - 1].faceUp = true;
        }
    }

    checkComplete(col) {
        const colCards = this.columns[col];
        if (colCards.length < 13) return null;

        const start = colCards.length - 13;
        let complete = true;
        const firstSuit = colCards[start].suit;
        for (let i = 0; i < 12; i++) {
            if (colCards[start + i].value !== colCards[start + i + 1].value + 1) {
                complete = false;
                break;
            }
            if (colCards[start + i].suit !== firstSuit || colCards[start + i + 1].suit !== firstSuit) {
                complete = false;
                break;
            }
        }

        if (complete && colCards[start].value === 13) {
            const colEl = document.querySelector(`.column[data-col="${col}"]`);
            const positions = [];
            for (let i = start; i < start + 13; i++) {
                const cardEl = colEl.querySelector(`[data-idx="${i}"]`);
                if (cardEl) {
                    const rect = cardEl.getBoundingClientRect();
                    positions.push({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        suit: colCards[i].suit
                    });
                }
            }

            const removed = colCards.splice(start, 13);
            removed.forEach(c => c.faceUp = true);
            this.completedSets.push(removed);
            this.flipTopCard(col);
            this.score += 100;
            
            return { col, positions };
        }
        return null;
    }

    dealFromStock() {
        if (this.stock.length === 0) return;

        if (this.columns.some(col => col.length === 0 && this.stock.length > 0)) {
            alert('Сначала заполните все пустые колонки!');
            return;
        }

        const dealtCols = [];
        for (let col = 0; col < 10; col++) {
            if (this.stock.length === 0) break;
            dealtCols.push(col);
        }
        const moveData = { type: 'deal', cols: dealtCols };

        this.saveState(moveData);

        const stockEl = document.getElementById('stock-pile');
        const stockRect = stockEl ? stockEl.getBoundingClientRect() : null;
        const stockCenterX = stockRect ? stockRect.left + stockRect.width / 2 : 0;
        const stockCenterY = stockRect ? stockRect.top + stockRect.height / 2 : 0;
        
        const stockCardEl = stockEl ? stockEl.querySelector('.card.back') : null;
        const stockCardRect = stockCardEl ? stockCardEl.getBoundingClientRect() : null;
        const stockW = stockCardRect ? stockCardRect.width : 60;
        const stockH = stockCardRect ? stockCardRect.height : 84;

        const completions = [];
        for (let col = 0; col < 10; col++) {
            if (this.stock.length === 0) break;
            const card = this.stock.pop();
            card.faceUp = true;
            this.columns[col].push(card);
            const completion = this.checkComplete(col);
            if (completion) completions.push(completion);
        }

        this._lastMove = moveData;

        this.moves++;
        this.updateScore();
        this.saveToStorage();

        this.render();

        const newCards = [];
        dealtCols.forEach((col) => {
            const colEl = document.querySelector(`.column[data-col="${col}"]`);
            if (!colEl) return;
            const cards = colEl.querySelectorAll('.card.front');
            const topCard = cards[cards.length - 1];
            if (topCard) {
                const cardContent = topCard.innerHTML;
                topCard.dataset.cardContent = cardContent;
                topCard.style.visibility = 'hidden';
                topCard.innerHTML = '';
                topCard.classList.remove('front');
                topCard.classList.add('back');
                topCard.classList.add('shirt-' + this.currentShirt);
                topCard.style.background = this.getShirtStyle(this.currentShirt);
                topCard.style.borderColor = this.getShirtBorder(this.currentShirt);
                newCards.push(topCard);
            }
        });

        this.animateDeal(dealtCols, newCards, stockCenterX, stockCenterY, stockW, stockH);
        
        if (completions.length > 0) {
            const allPositions = completions.flatMap(c => c.positions);
            this.animateCompletion(allPositions);
        }
    }

    animateDeal(cols, newCards, stockCenterX, stockCenterY, stockW, stockH) {
        newCards.forEach((topCard, idx) => {
            const cardRect = topCard.getBoundingClientRect();
            
            const origTop = topCard.style.top || '';
            const origLeft = topCard.style.left || '';
            const origPosition = topCard.style.position || '';
            
            const delay = idx * 30;
            setTimeout(() => {
                topCard.style.transition = 'none';
                topCard.style.visibility = '';
                topCard.style.position = 'fixed';
                topCard.style.left = (stockCenterX - cardRect.width / 2) + 'px';
                topCard.style.top = (stockCenterY - cardRect.height / 2) + 'px';
                topCard.style.transformOrigin = 'center center';
                topCard.style.transform = `scale(${stockW / cardRect.width})`;
                topCard.style.zIndex = '1000';
                void topCard.offsetHeight;
                
                topCard.style.transition = 'left 0.4s ease-out, top 0.4s ease-out, transform 0.4s ease-out';
                topCard.style.left = (cardRect.left) + 'px';
                topCard.style.top = (cardRect.top) + 'px';
                topCard.style.transform = 'rotateY(180deg)';
                
                setTimeout(() => {
                    topCard.style.position = origPosition;
                    topCard.style.left = origLeft;
                    topCard.style.top = origTop;
                    topCard.style.transition = '';
                    topCard.style.transform = '';
                    topCard.style.transformOrigin = '';
                    topCard.style.visibility = '';
                    topCard.style.zIndex = '';
                    
                    topCard.classList.remove('back');
                    topCard.classList.remove('shirt-' + this.currentShirt);
                    topCard.classList.add('front');
                    topCard.style.background = '';
                    topCard.style.borderColor = '';
                    topCard.innerHTML = topCard.dataset.cardContent || '';
                    delete topCard.dataset.cardContent;
                }, 400);
            }, delay);
        });
    }

    checkWin() {
        if (this.completedSets.length === 8) {
            document.getElementById('win-score').textContent = this.score;
            document.getElementById('win-moves').textContent = this.moves;
            document.getElementById('win-overlay').classList.remove('hidden');
        }
    }

    canDrop(col, cardValue) {
        const colCards = this.columns[col];
        if (colCards.length === 0) return true;
        const topCard = colCards[colCards.length - 1];
        return topCard.value === cardValue + 1;
    }

    undo() {
        if (this.history.length === 0) return;
        const state = this.history.pop();

        const moveData = state.moveData || null;
        this._lastMove = null;

        this.columns = state.columns;
        this.stock = state.stock;
        this.completedSets = state.completedSets;
        this.score = state.score;
        this.moves = state.moves;
        
        if (moveData && moveData.type === 'deal') {
            const cardPositions = this.saveDealCardPositions(moveData.cols);
            
            this.render();
            this.updateScore();
            this.saveToStorage();
            
            if (cardPositions.length > 0) {
                this.animateUndoDeal(cardPositions);
            }
        } else {
            this.render();
            this.updateScore();
            this.saveToStorage();

            if (moveData) {
                this.animateUndo(moveData);
            }
        }
    }

    saveDealCardPositions(cols) {
        const positions = [];
        cols.forEach((col) => {
            const colEl = document.querySelector(`.column[data-col="${col}"]`);
            if (!colEl) return;
            const cards = colEl.querySelectorAll('.card.front');
            const topCard = cards[cards.length - 1];
            if (topCard) {
                const rect = topCard.getBoundingClientRect();
                positions.push({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                });
            }
        });
        return positions;
    }

    animateUndoDeal(cardPositions) {
        const stockEl = document.getElementById('stock-pile');
        if (!stockEl || cardPositions.length === 0) return;
        
        const stockRect = stockEl.getBoundingClientRect();
        const targetX = stockRect.left + stockRect.width / 2;
        const targetY = stockRect.top + stockRect.height / 2;

        cardPositions.forEach((pos, idx) => {
            const tempCard = document.createElement('div');
            tempCard.className = 'card front';
            tempCard.style.position = 'fixed';
            tempCard.style.left = pos.left + 'px';
            tempCard.style.top = pos.top + 'px';
            tempCard.style.width = pos.width + 'px';
            tempCard.style.height = pos.height + 'px';
            tempCard.style.zIndex = '999';
            tempCard.innerHTML = '<span class="rank">?</span><span class="suit-icon">♠</span>';
            document.body.appendChild(tempCard);

            const dx = targetX - (pos.left + pos.width / 2);
            const dy = targetY - (pos.top + pos.height / 2);

            setTimeout(() => {
                tempCard.style.transition = 'none';
                void tempCard.offsetHeight;
                tempCard.style.transition = 'transform 0.35s ease-in, opacity 0.35s ease-in';
                tempCard.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
                tempCard.style.opacity = '0';
                tempCard.addEventListener('transitionend', () => {
                    tempCard.remove();
                }, { once: true });
            }, idx * 20);
        });
    }

    animateCompletion(positions) {
        if (!positions || positions.length === 0) return;
        
        const foundationArea = document.getElementById('foundation-area');
        const foundationRect = foundationArea.getBoundingClientRect();
        
        const foundationPile = foundationArea.querySelector('.foundation-pile');
        let targetX, targetY;
        if (foundationPile) {
            const pileRect = foundationPile.getBoundingClientRect();
            targetX = pileRect.left + pileRect.width / 2;
            targetY = pileRect.top + pileRect.height / 2;
        } else {
            targetX = foundationRect.left + foundationRect.width / 2;
            targetY = foundationRect.top + foundationRect.height / 2;
        }

        const tempCards = [];
        positions.forEach((pos, idx) => {
            const tempCard = document.createElement('div');
            tempCard.className = 'card front shirt-' + this.currentShirt;
            if (pos.suit === '♥' || pos.suit === '♦') {
                tempCard.classList.add('red');
            }
            tempCard.style.position = 'fixed';
            tempCard.style.left = pos.left + 'px';
            tempCard.style.top = pos.top + 'px';
            tempCard.style.width = pos.width + 'px';
            tempCard.style.height = pos.height + 'px';
            tempCard.style.zIndex = '1001';
            tempCard.style.transition = 'none';
            tempCard.style.background = this.getShirtStyle(this.currentShirt);
            tempCard.style.borderColor = this.getShirtBorder(this.currentShirt);
            tempCard.innerHTML = `
                <span class="rank">K</span>
                <span class="suit-corner">${pos.suit}</span>
                <span class="suit-icon">${pos.suit}</span>
            `;
            document.body.appendChild(tempCard);
            tempCards.push(tempCard);

            const dx = targetX - (pos.left + pos.width / 2);
            const dy = targetY - (pos.top + pos.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const duration = Math.min(0.6, Math.max(0.3, dist / 1000));

            setTimeout(() => {
                void tempCard.offsetHeight;
                tempCard.style.transition = `transform ${duration}s ease-in, opacity ${duration}s ease-in`;
                tempCard.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`;
                tempCard.style.opacity = '0.5';
                
                const removeCard = () => {
                    tempCard.style.transition = 'opacity 0.15s ease-out';
                    tempCard.style.opacity = '0';
                    setTimeout(() => {
                        tempCard.remove();
                    }, 150);
                };
                
                tempCard.addEventListener('transitionend', removeCard, { once: true });
                setTimeout(removeCard, duration * 1000 + 50);
            }, idx * 25);
        });
    }

    animateUndo(lastMove) {
        if (lastMove.type === 'move') {
            const colEl = document.querySelector(`.column[data-col="${lastMove.fromCol}"]`);
            if (!colEl) return;
            const count = lastMove.count;
            const rects = lastMove.rects;
            if (!rects || rects.length < count) return;

            for (let i = 0; i < count; i++) {
                const cardEl = colEl.querySelector(`[data-idx="${lastMove.cardIndex + i}"]`);
                if (!cardEl) continue;

                const newRect = cardEl.getBoundingClientRect();
                const dx = rects[i].left - newRect.left;
                const dy = rects[i].top - newRect.top;

                cardEl.style.transition = 'none';
                cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
                cardEl.style.zIndex = '999';

                void cardEl.offsetHeight;

                cardEl.style.transition = 'transform 0.4s ease-out';
                cardEl.style.transform = 'translate(0, 0)';
            }
        }
    }

    render() {
        this.renderTableau();
        this.renderStock();
        this.renderFoundation();
    }

    renderTableau() {
        for (let col = 0; col < 10; col++) {
            const colEl = document.querySelector(`.column[data-col="${col}"]`);
            colEl.innerHTML = '';
            colEl.style.minHeight = '150px';

            const cards = this.columns[col];
            if (cards.length === 0) {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                colEl.appendChild(placeholder);
                colEl.style.minHeight = '100px';
                continue;
            }

            const backOffset = 16;
            const frontOffset = 28;

            let stackLen = 0;
            for (let i = cards.length - 1; i >= 0; i--) {
                if (!cards[i].faceUp) break;
                if (i === cards.length - 1) {
                    stackLen = 1;
                } else if (cards[i].value === cards[i + 1].value + 1 && cards[i].suit === cards[i + 1].suit) {
                    stackLen++;
                } else {
                    break;
                }
            }
            const stackStart = cards.length - stackLen;

            cards.forEach((card, idx) => {
                const cardEl = document.createElement('div');
                
                let offset = 0;
                let prevFaceUp = false;
                for (let i = 0; i < idx; i++) {
                    if (cards[i].faceUp) {
                        offset += frontOffset;
                        prevFaceUp = true;
                    } else {
                        offset += backOffset;
                    }
                }
                if (!card.faceUp && prevFaceUp) {
                    offset += 8;
                }

                cardEl.style.top = offset + 'px';
                cardEl.dataset.col = col;
                cardEl.dataset.idx = idx;

                if (card.faceUp) {
                    cardEl.className = 'card front';
                    const color = card.suit === '♠' || card.suit === '♣' ? 'black' : 'red';
                    if (color === 'red') cardEl.classList.add('red');

                    if (idx < stackStart) {
                        cardEl.classList.add('blocked');
                    }

                    cardEl.innerHTML = `
                        <span class="rank">${card.rank}</span>
                        <span class="suit-corner">${card.suit}</span>
                        <span class="suit-icon">${card.suit}</span>
                    `;
                } else {
                    cardEl.className = 'card back shirt-' + this.currentShirt;
                    cardEl.style.background = this.getShirtStyle(this.currentShirt);
                    cardEl.style.borderColor = this.getShirtBorder(this.currentShirt);
                }

                colEl.appendChild(cardEl);
            });

            const lastCard = cards[cards.length - 1];
            let totalHeight = 0;
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].faceUp) {
                    totalHeight += frontOffset;
                } else {
                    totalHeight += backOffset;
                }
            }
            if (!lastCard.faceUp) totalHeight += 80;
            colEl.style.minHeight = Math.max(150, totalHeight + 80) + 'px';
        }
    }

    renderStock() {
        const stockEl = document.getElementById('stock-pile');
        const countEl = document.getElementById('stock-count');
        const deals = Math.ceil(this.stock.length / 10);
        countEl.textContent = deals;

        stockEl.innerHTML = '';
        const show = Math.min(5, deals);
        const shirtStyle = this.getShirtStyle(this.currentShirt);
        const shirtBorder = this.getShirtBorder(this.currentShirt);
        for (let i = 0; i < show; i++) {
            const card = document.createElement('div');
            card.className = 'card back shirt-' + this.currentShirt;
            card.style.background = shirtStyle;
            card.style.borderColor = shirtBorder;
            card.style.opacity = '1';
            card.style.zIndex = show - i;
            card.style.top = (i * 12) + 'px';
            stockEl.appendChild(card);
        }
    }

    renderFoundation() {
        const area = document.getElementById('foundation-area');
        area.innerHTML = '';
        
        const pile = document.createElement('div');
        pile.className = 'foundation-pile';
        
        const showCards = Math.min(5, this.completedSets.length);
        const startIdx = this.completedSets.length - showCards;
        for (let i = 0; i < showCards; i++) {
            const set = this.completedSets[startIdx + i];
            const cardEl = document.createElement('div');
            cardEl.className = 'card front foundation-card';
            
            cardEl.style.position = 'absolute';
            cardEl.style.top = (i * 12) + 'px';
            cardEl.style.left = '50%';
            cardEl.style.transform = 'translateX(-50%)';
            cardEl.style.zIndex = showCards - i;
            
            const suit = set[set.length - 1].suit;
            const color = suit === '♠' || suit === '♣' ? 'black' : 'red';
            if (color === 'red') cardEl.classList.add('red');
            
            cardEl.innerHTML = `
                <span class="suit-icon" style="font-size:2rem;">${suit}</span>
            `;
            pile.appendChild(cardEl);
        }
        
        pile.style.height = showCards > 0 ? (12 * (showCards - 1) + 84) + 'px' : '84px';
        
        area.appendChild(pile);
        
        const countEl = document.createElement('div');
        countEl.id = 'foundation-count';
        countEl.style.cssText = 'font-size:0.85rem;font-weight:700;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:5px;min-width:28px;text-align:center;margin-top:4px;';
        countEl.textContent = this.completedSets.length;
        area.appendChild(countEl);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }

    bindEvents() {
        document.getElementById('difficulty-btn').addEventListener('click', () => {
            this.showDifficultyModal();
        });

        document.getElementById('shirt-btn').addEventListener('click', () => {
            this.showShirtModal();
        });

        document.getElementById('shirt-close-btn').addEventListener('click', () => {
            this.hideShirtModal();
        });

        document.querySelectorAll('.shirt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setShirt(parseInt(btn.dataset.shirt));
                this.hideShirtModal();
            });
        });

        document.getElementById('difficulty-close-btn').addEventListener('click', () => {
            this.hideDifficultyModal();
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.suitCount = parseInt(btn.dataset.suits);
                this.setLastDifficulty(this.suitCount);
                this.hideDifficultyModal();
                this.clearStorage();
                this.init();
            });
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            const lastDiff = this.getLastDifficulty();
            if (lastDiff > 0) {
                this.suitCount = lastDiff;
                this.clearStorage();
                this.init();
            } else {
                this.showDifficultyModal();
            }
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-overlay').classList.add('hidden');
            const lastDiff = this.getLastDifficulty();
            if (lastDiff > 0) {
                this.suitCount = lastDiff;
                this.clearStorage();
                this.init();
            } else {
                this.showDifficultyModal();
            }
        });

        document.getElementById('stock-pile').addEventListener('click', () => {
            this.dealFromStock();
        });

        document.addEventListener('dblclick', (e) => {
            const cardEl = this.getCardFromEvent(e);
            if (!cardEl || cardEl.dataset.col === undefined) return;

            const col = parseInt(cardEl.dataset.col);
            const idx = parseInt(cardEl.dataset.idx);
            this.autoMove(col, idx);
        });

        this.bindMouseEvents();
        this.bindTouchEvents();
    }

    handleTap(col, idx) {
        this.autoMove(col, idx);
    }

    autoMove(col, cardIndex) {
        if (!this.canMoveCards(col, cardIndex)) return;

        const movingCard = this.columns[col][cardIndex];
        const movingValue = movingCard.value;

        let bestCol = null;
        let bestLen = -1;
        let bestHasSameSuitStack = false;

        for (let i = 0; i < 10; i++) {
            if (i === col) continue;
            if (!this.canDrop(i, movingValue)) continue;

            const colCards = this.columns[i];
            const targetTopCard = colCards.length > 0 ? colCards[colCards.length - 1] : null;

            let stackLen = 0;
            for (let j = colCards.length - 1; j >= 0; j--) {
                if (!colCards[j].faceUp) break;
                if (j === colCards.length - 1) {
                    stackLen = 1;
                } else if (colCards[j].value === colCards[j + 1].value + 1 && colCards[j].suit === colCards[j + 1].suit) {
                    stackLen++;
                } else {
                    break;
                }
            }

            const hasSameSuitStack = targetTopCard !== null && targetTopCard.suit === movingCard.suit;

            if (bestCol === null) {
                bestCol = i;
                bestLen = stackLen;
                bestHasSameSuitStack = hasSameSuitStack;
            } else if (hasSameSuitStack && !bestHasSameSuitStack) {
                bestCol = i;
                bestLen = stackLen;
                bestHasSameSuitStack = true;
            } else if (!hasSameSuitStack && bestHasSameSuitStack) {
                // keep current best
            } else if (stackLen > bestLen) {
                bestLen = stackLen;
                bestCol = i;
            }
        }

        if (bestCol === null) return;

        const fromColEl = document.querySelector(`.column[data-col="${col}"]`);
        const rects = [];
        const cards = this.columns[col];
        for (let i = cardIndex; i < cards.length; i++) {
            if (!cards[i].faceUp) continue;
            const cardEl = fromColEl.querySelector(`[data-idx="${i}"]`);
            if (!cardEl) continue;
            const r = cardEl.getBoundingClientRect();
            rects.push({ left: r.left, top: r.top });
        }

        this.moveCards(col, cardIndex, bestCol);

        requestAnimationFrame(() => {
            const colEl = document.querySelector(`.column[data-col="${bestCol}"]`);
            if (!colEl || rects.length === 0) return;

            const allCards = colEl.querySelectorAll('.card.front');
            const startIdx = Math.max(0, allCards.length - rects.length);
            for (let i = 0; i < rects.length; i++) {
                const cardEl = allCards[startIdx + i];
                if (!cardEl) continue;
                const newRect = cardEl.getBoundingClientRect();
                const dx = rects[i].left - newRect.left;
                const dy = rects[i].top - newRect.top;
                
                cardEl.style.transition = 'none';
                cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
                cardEl.style.zIndex = '999';
                void cardEl.offsetHeight;
                
                cardEl.style.transition = 'transform 0.4s ease-out';
                cardEl.style.transform = 'translate(0, 0)';
                cardEl.addEventListener('transitionend', () => {
                    cardEl.style.transition = '';
                    cardEl.style.transform = '';
                    cardEl.style.zIndex = '';
                }, { once: true });
            }
        });
    }

    bindMouseEvents() {
        let isDragging = false;
        let fromCol = null;
        let cardIdx = null;
        let ghost = null;
        let offsetX, offsetY;

        document.addEventListener('mousedown', (e) => {
            const cardEl = this.getCardFromEvent(e);
            if (!cardEl || cardEl.dataset.col === undefined) return;

            fromCol = parseInt(cardEl.dataset.col);
            cardIdx = parseInt(cardEl.dataset.idx);

            if (!this.canMoveCards(fromCol, cardIdx)) return;

            const rect = cardEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            isDragging = true;
            this.isDragging = true;
            this.createDragGhost(fromCol, cardIdx, e.clientX - offsetX, e.clientY - offsetY);
            ghost = document.querySelector('.drag-ghost');

            document.body.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !ghost) return;
            ghost.style.left = (e.clientX - offsetX) + 'px';
            ghost.style.top = (e.clientY - offsetY) + 'px';

            this.highlightDropZones(e.clientX, e.clientY, fromCol, cardIdx);
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging || fromCol === null) {
                this.cleanupDrag();
                fromCol = null;
                cardIdx = null;
                return;
            }

            const targetCol = this.getColumnAtPosition(e.clientX, e.clientY);

            if (targetCol !== null) {
                const movingCard = this.columns[fromCol][cardIdx];
                if (targetCol === fromCol || this.canDrop(targetCol, movingCard.value)) {
                    try {
                        this.moveCards(fromCol, cardIdx, targetCol);
                    } finally {
                        this.cleanupDrag();
                    }
                } else {
                    this.cleanupDrag();
                }
            } else {
                this.cleanupDrag();
            }

            fromCol = null;
            cardIdx = null;
        });
    }

    bindTouchEvents() {
        let isDragging = false;
        let fromCol = null;
        let cardIdx = null;
        let ghost = null;
        let offsetX, offsetY;
        let startX, startY;
        let hasMoved = false;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!el) return;

            const cardEl = el.closest('.card.front');
            if (!cardEl || cardEl.dataset.col === undefined) return;

            fromCol = parseInt(cardEl.dataset.col);
            cardIdx = parseInt(cardEl.dataset.idx);
            startX = touch.clientX;
            startY = touch.clientY;
            hasMoved = false;

            if (!this.canMoveCards(fromCol, cardIdx)) return;

            const rect = cardEl.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;

            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (fromCol === null || cardIdx === null) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasMoved = true;
                isDragging = true;
                this.isDragging = true;
                this.createDragGhost(fromCol, cardIdx, touch.clientX - offsetX, touch.clientY - offsetY);
                ghost = document.querySelector('.drag-ghost');
            }
            
            if (!isDragging || !ghost) return;
            ghost.style.left = (touch.clientX - offsetX) + 'px';
            ghost.style.top = (touch.clientY - offsetY) + 'px';

            this.highlightDropZones(touch.clientX, touch.clientY, fromCol, cardIdx);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!hasMoved && fromCol !== null && cardIdx !== null) {
                this.handleTap(fromCol, cardIdx);
            }
            
            if (isDragging && fromCol !== null) {
                const touch = e.changedTouches[0];
                const targetCol = this.getColumnAtPosition(touch.clientX, touch.clientY);

                if (targetCol !== null) {
                    const movingCard = this.columns[fromCol][cardIdx];
                    if (targetCol === fromCol || this.canDrop(targetCol, movingCard.value)) {
                        try {
                            this.moveCards(fromCol, cardIdx, targetCol);
                        } finally {
                            this.cleanupDrag();
                        }
                    } else {
                        this.cleanupDrag();
                    }
                } else {
                    this.cleanupDrag();
                }
            } else {
                this.cleanupDrag();
            }
            
            isDragging = false;
            fromCol = null;
            cardIdx = null;
            hasMoved = false;
        });
    }

    getCardFromEvent(e) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return null;
        return el.closest('.card.front');
    }

    createDragGhost(col, idx, x, y) {
        this.removeDragGhost();

        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.left = x + 'px';
        ghost.style.top = y + 'px';

        const cards = this.columns[col].slice(idx);
        const backOffset = 16;
        const frontOffset = 28;

        let totalGhostHeight = 80;
        if (cards.length > 1) {
            totalGhostHeight += (cards.length - 1) * frontOffset;
        }
        ghost.style.height = totalGhostHeight + 'px';

        cards.forEach((card, i) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card front';
            cardEl.style.position = 'absolute';
            cardEl.style.left = '0';
            cardEl.style.width = '80px';
            cardEl.style.height = '112px';

            const cardTop = (i === 0) ? 0 : (i * frontOffset);
            cardEl.style.top = cardTop + 'px';

            const color = card.suit === '♠' || card.suit === '♣' ? 'black' : 'red';
            if (color === 'red') cardEl.classList.add('red');
            cardEl.innerHTML = `
                <span class="rank">${card.rank}</span>
                <span class="suit-corner">${card.suit}</span>
                <span class="suit-icon">${card.suit}</span>
            `;
            ghost.appendChild(cardEl);
        });

        document.body.appendChild(ghost);

        const colEl = document.querySelector(`.column[data-col="${col}"]`);
        if (colEl) {
            for (let i = idx; i < this.columns[col].length; i++) {
                const c = colEl.querySelector(`[data-idx="${i}"]`);
                if (c) c.style.visibility = 'hidden';
            }
        }
    }

    removeDragGhost() {
        const existing = document.querySelector('.drag-ghost');
        if (existing) existing.remove();
        const hiddenCards = document.querySelectorAll('.column .card.front[style*="visibility: hidden"]');
        hiddenCards.forEach(el => el.style.visibility = '');
    }

    highlightDropZones(x, y, fromCol, cardIdx) {
        document.querySelectorAll('.column.highlight').forEach(el => el.classList.remove('highlight'));

        if (!this.isDragging || fromCol === null || cardIdx === null) return;

        const col = this.getColumnAtPosition(x, y);
        if (col === null || col === fromCol) return;

        const movingCard = this.columns[fromCol][cardIdx];
        if (this.canDrop(col, movingCard.value)) {
            document.querySelector(`.column[data-col="${col}"]`).classList.add('highlight');
        }
    }

    getColumnAtPosition(x, y) {
        const cols = document.querySelectorAll('.column');
        for (const col of cols) {
            const rect = col.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return parseInt(col.dataset.col);
            }
        }
        return null;
    }

    cleanupDrag() {
        this.removeDragGhost();
        document.querySelectorAll('.column.highlight').forEach(el => el.classList.remove('highlight'));
        document.body.style.cursor = '';
        this.isDragging = false;
        this.dragData = null;
    }

    newGame() {
        this.clearStorage();
        this.init();
    }

    changeDifficulty(suitCount) {
        this.suitCount = suitCount;
        this.setLastDifficulty(suitCount);
        this.clearStorage();
        this.init();
    }
}

const game = new SpiderSolitaire();
window.game = game;