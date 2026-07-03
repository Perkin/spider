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
        this.suitCount = 1; // по умолчанию 1 масть

        const saved = this.loadFromStorage();
        if (saved) {
            // Если есть сохранённая игра — загружаем её без показа модалки
            this.columns = saved.columns;
            this.stock = saved.stock;
            this.completedSets = saved.completedSets;
            this.score = saved.score;
            this.moves = saved.moves;
            this.suitCount = saved.suitCount || 1;
            this.bindEvents();
            this.render();
            this.updateScore();
        } else {
            // Нет сохранённой игры — показываем выбор сложности
            this.showDifficultyModal();
            this.bindEvents();
        }
    }

    showDifficultyModal() {
        document.getElementById('difficulty-overlay').classList.remove('hidden');
    }

    hideDifficultyModal() {
        document.getElementById('difficulty-overlay').classList.add('hidden');
    }

    getSuits() {
        return ALL_SUITS.slice(0, this.suitCount);
    }

    createDeck() {
        const deck = [];
        const suits = this.getSuits();
        // 8 полных наборов по 13 карт, распределённых по мастям
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
            this.history = [];
            this.render();
            this.updateScore();
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

        // Раздача: первые 4 колонки по 6 карт, остальные по 5
        let cardIdx = 0;
        for (let col = 0; col < 10; col++) {
            const count = col < 4 ? 6 : 5;
            for (let i = 0; i < count; i++) {
                const card = deck[cardIdx++];
                if (i === count - 1) card.faceUp = true;
                this.columns[col].push(card);
            }
        }

        // Остаток в сток (50 карт)
        this.stock = deck.slice(cardIdx);
        // Все карты стока рубашкой вверх
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
                suitCount: this.suitCount
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

    // Сохранить состояние для отмены
    saveState(moveData) {
        this.history.push({
            columns: this.columns.map(col => col.map(c => ({ ...c }))),
            stock: this.stock.map(c => ({ ...c })),
            completedSets: [...this.completedSets],
            score: this.score,
            moves: this.moves,
            moveData: moveData || this._lastMove || null
        });
        // Ограничим историю 50 ходами
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    canMoveCards(col, cardIndex) {
        const colCards = this.columns[col];
        if (cardIndex < 0 || cardIndex >= colCards.length) return false;
        if (!colCards[cardIndex].faceUp) return false;

        const firstSuit = colCards[cardIndex].suit;
        // Проверяем, что все карты от cardIndex до конца образуют последовательность по убыванию
        // и все одной масти
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

        // Создаём объект хода ДО выполнения (чтобы saveState сохранил его в историю)
        const cards = this.columns[fromCol].slice(cardIndex);
        const moveData = { type: 'move', fromCol, toCol, cardIndex, count: cards.length };

        // Сохраняем состояние ДО хода вместе с данными о том, какой ход будет сделан
        this.saveState(moveData);

        // Выполняем ход
        this.columns[fromCol].splice(cardIndex);
        this.flipTopCard(fromCol);
        this.columns[toCol].push(...cards);
        this.checkComplete(toCol);

        this.moves++;
        this.updateScore();
        this.render();
        this.saveToStorage();

        // Сохраняем позиции карт ПОСЛЕ render'a (где они сейчас, в toCol)
        const rects = [];
        const toColEl = document.querySelector(`.column[data-col="${toCol}"]`);
        if (toColEl) {
            const cardEls = toColEl.querySelectorAll('.card.front');
            for (let i = cardEls.length - cards.length; i < cardEls.length; i++) {
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
        if (colCards.length < 13) return;

        // Проверяем последние 13 карт
        const start = colCards.length - 13;
        let complete = true;
        const firstSuit = colCards[start].suit;
        for (let i = 0; i < 12; i++) {
            // Проверяем убывание значения
            if (colCards[start + i].value !== colCards[start + i + 1].value + 1) {
                complete = false;
                break;
            }
            // Проверяем совпадение масти (для 2/4 мастей)
            if (colCards[start + i].suit !== firstSuit || colCards[start + i + 1].suit !== firstSuit) {
                complete = false;
                break;
            }
        }

        if (complete && colCards[start].value === 13) { // K = 13
            // Убираем последовательность
            const removed = colCards.splice(start, 13);
            removed.forEach(c => c.faceUp = true);
            this.completedSets.push(removed);
            this.flipTopCard(col);
            this.score += 100;
            this.render();
            this.checkWin();
        }
    }

    dealFromStock() {
        if (this.stock.length === 0) return;

        if (this.columns.some(col => col.length === 0 && this.stock.length > 0)) {
            alert('Сначала заполните все пустые колонки!');
            return;
        }

        // Создаём объект хода ДО выполнения
        const dealtCols = [];
        for (let col = 0; col < 10; col++) {
            if (this.stock.length === 0) break;
            dealtCols.push(col);
        }
        const moveData = { type: 'deal', cols: dealtCols };

        // Сохраняем состояние ДО раздачи
        this.saveState(moveData);

        // Запоминаем позицию и размер карты стока ДО render (пока сток еще на месте)
        const stockEl = document.getElementById('stock-pile');
        const stockRect = stockEl ? stockEl.getBoundingClientRect() : null;
        const stockCenterX = stockRect ? stockRect.left + stockRect.width / 2 : 0;
        const stockCenterY = stockRect ? stockRect.top + stockRect.height / 2 : 0;
        
        // Измеряем размер реальной карты в стоке до рендера
        const stockCardEl = stockEl ? stockEl.querySelector('.card.back') : null;
        const stockCardRect = stockCardEl ? stockCardEl.getBoundingClientRect() : null;
        const stockW = stockCardRect ? stockCardRect.width : 60;
        const stockH = stockCardRect ? stockCardRect.height : 84;

        // Выполняем раздачу
        for (let col = 0; col < 10; col++) {
            if (this.stock.length === 0) break;
            const card = this.stock.pop();
            card.faceUp = true;
            this.columns[col].push(card);
            this.checkComplete(col);
        }

        this._lastMove = moveData;

        this.moves++;
        this.updateScore();
        this.saveToStorage();

        // Render - создаём все карты
        this.render();

        // Сразу скрываем новые карты (чтобы не было мигания перед анимацией)
        const newCards = [];
        dealtCols.forEach((col) => {
            const colEl = document.querySelector(`.column[data-col="${col}"]`);
            if (!colEl) return;
            const cards = colEl.querySelectorAll('.card.front');
            const topCard = cards[cards.length - 1];
            if (topCard) {
                // Сохраняем содержимое карты для восстановления после flip
                const cardContent = topCard.innerHTML;
                topCard.dataset.cardContent = cardContent;
                
                // Скрываем сразу, чтобы не было видно "лишней" карты (visibility hidden сохраняет размеры)
                topCard.style.visibility = 'hidden';
                
                // Очищаем содержимое и меняем класс front на back
                topCard.innerHTML = '';
                topCard.classList.remove('front');
                topCard.classList.add('back');
                newCards.push(topCard);
            }
        });

        // Анимация: карты вылетают из стока и раскладываются по колонкам
        this.animateDeal(dealtCols, newCards, stockCenterX, stockCenterY, stockW, stockH);
    }

    animateDeal(cols, newCards, stockCenterX, stockCenterY, stockW, stockH) {
        newCards.forEach((topCard, idx) => {
            const cardRect = topCard.getBoundingClientRect();
            
            const origTop = topCard.style.top || '';
            const origLeft = topCard.style.left || '';
            const origPosition = topCard.style.position || '';
            
            // Начинаем анимацию с задержкой для эффекта "веера"
            const delay = idx * 30;
            setTimeout(() => {
                // Сразу показываем карту, ставим в позицию стока (без анимации)
                topCard.style.transition = 'none';
                topCard.style.visibility = '';
                topCard.style.position = 'fixed';
                topCard.style.left = (stockCenterX - cardRect.width / 2) + 'px';
                topCard.style.top = (stockCenterY - cardRect.height / 2) + 'px';
                topCard.style.transformOrigin = 'center center';
                topCard.style.transform = `scale(${stockW / cardRect.width})`;
                topCard.style.zIndex = '1000';
                void topCard.offsetHeight;
                
                // Анимируем: летим в колонку + flip
                topCard.style.transition = 'left 0.4s ease-out, top 0.4s ease-out, transform 0.4s ease-out';
                topCard.style.left = (cardRect.left) + 'px';
                topCard.style.top = (cardRect.top) + 'px';
                topCard.style.transform = 'rotateY(180deg)';
                
                // После завершения полёта
                setTimeout(() => {
                    // Восстанавливаем DOM-позицию
                    topCard.style.position = origPosition;
                    topCard.style.left = origLeft;
                    topCard.style.top = origTop;
                    topCard.style.transition = '';
                    topCard.style.transform = '';
                    topCard.style.transformOrigin = '';
                    topCard.style.visibility = '';
                    topCard.style.zIndex = '';
                    
                    // Меняем класс с back на front и показываем содержимое
                    topCard.classList.remove('back');
                    topCard.classList.add('front');
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

    // Подсветка колонки куда можно положить
    canDrop(col, cardValue, cardSuit) {
        const colCards = this.columns[col];
        if (colCards.length === 0) return true;
        const topCard = colCards[colCards.length - 1];
        return topCard.value === cardValue + 1 && topCard.suit === cardSuit;
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
            // Сохраняем позиции карт ДО render
            const cardPositions = this.saveDealCardPositions(moveData.cols);
            
            // Render обновляет DOM
            this.render();
            this.updateScore();
            this.saveToStorage();
            
            // Создаём временные элементы для анимации (остальные карты не пропадают)
            if (cardPositions.length > 0) {
                this.animateUndoDeal(cardPositions);
            }
        } else {
            this.render();
            this.updateScore();
            this.saveToStorage();

            // Анимация возврата карт
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

        // Создаём временные элементы для анимации
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

    animateUndo(lastMove) {
        if (lastMove.type === 'move') {
            const colEl = document.querySelector(`.column[data-col="${lastMove.fromCol}"]`);
            if (!colEl) return;
            const count = lastMove.count;
            const rects = lastMove.rects;
            if (!rects || rects.length < count) return;

            for (let i = 0; i < count; i++) {
                // Ищем карту по data-idx (учитывая, что между ними могут быть закрытые карты)
                const cardEl = colEl.querySelector(`[data-idx="${lastMove.cardIndex + i}"]`);
                if (!cardEl) continue;

                const newRect = cardEl.getBoundingClientRect();
                const dx = rects[i].left - newRect.left;
                const dy = rects[i].top - newRect.top;

                // Сначала ставим карту на старую позицию (без анимации)
                cardEl.style.transition = 'none';
                cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
                cardEl.style.zIndex = '999';

                // Принудительный reflow
                void cardEl.offsetHeight;

                // Теперь анимируем в новую позицию
                cardEl.style.transition = 'transform 0.4s ease-out';
                cardEl.style.transform = 'translate(0, 0)';
            }
        }
    }

    // ============ RENDER ============
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

            const backOffset = 16;  // отступ для закрытых (больше, чтобы видеть количество)
            const frontOffset = 30; // отступ для открытых

            // Находим длину стака (последовательность по убыванию с конца, одной масти)
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
                
                // Считаем отступ: закрытые карты идут с минимальным шагом
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
                // Если эта карта закрытая, а предыдущая была открытой — небольшой зазор
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

                    // Если карта не входит в стак — затемняем
                    if (idx < stackStart) {
                        cardEl.classList.add('blocked');
                    }

                    cardEl.innerHTML = `
                        <span class="rank">${card.rank}</span>
                        <span class="suit-corner">${card.suit}</span>
                        <span class="suit-icon">${card.suit}</span>
                    `;
                } else {
                    cardEl.className = 'card back';
                }

                colEl.appendChild(cardEl);
            });

            // Высота колонки
            const lastCard = cards[cards.length - 1];
            let totalHeight = 0;
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].faceUp) {
                    totalHeight += frontOffset;
                } else {
                    totalHeight += backOffset;
                }
            }
            // Если последняя закрытая — добавим место для открытых
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
        for (let i = 0; i < show; i++) {
            const card = document.createElement('div');
            card.className = 'card back';
            // Убираем прозрачность - все карты одинаково непрозрачные
            card.style.opacity = '1';
            card.style.zIndex = show - i; // Верхние карты имеют больший z-index
            card.style.top = (i * 12) + 'px'; // Небольшой отступ, чтобы видеть край каждой карты
            stockEl.appendChild(card);
        }
    }

    renderFoundation() {
        const area = document.getElementById('foundation-area');
        area.innerHTML = '';
        this.completedSets.forEach((set, idx) => {
            const pile = document.createElement('div');
            pile.className = 'foundation-pile';
            
            // Показываем до 5 карт
            const showCards = Math.min(set.length, 5);
            const start = set.length - showCards;
            for (let i = start; i < set.length; i++) {
                const card = set[i];
                const cardEl = document.createElement('div');
                cardEl.className = 'card front foundation-card';
                if (i === set.length - 1) {
                    cardEl.classList.add('top-card');
                }
                cardEl.innerHTML = `
                    <span class="rank">${card.rank}</span>
                    <span class="suit-icon">${card.suit}</span>
                `;
                pile.appendChild(cardEl);
            }
            
            area.appendChild(pile);
        });
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }

    // ============ EVENTS ============
    bindEvents() {
        // Кнопки выбора сложности
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.suitCount = parseInt(btn.dataset.suits);
                this.hideDifficultyModal();
                this.clearStorage();
                this.init();
            });
        });

        // Кнопки
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showDifficultyModal();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-overlay').classList.add('hidden');
            this.showDifficultyModal();
        });

        // Клик по стоку
        document.getElementById('stock-pile').addEventListener('click', () => {
            this.dealFromStock();
        });

        // Двойной клик — автоперенос (десктоп)
        document.addEventListener('dblclick', (e) => {
            const cardEl = this.getCardFromEvent(e);
            if (!cardEl || cardEl.dataset.col === undefined) return;

            const col = parseInt(cardEl.dataset.col);
            const idx = parseInt(cardEl.dataset.idx);
            this.autoMove(col, idx);
        });

        // Mouse events
        this.bindMouseEvents();

        // Touch events
        this.bindTouchEvents();
    }

    // Обработка тапа на мобилках — автоперенос
    handleTap(col, idx) {
        this.autoMove(col, idx);
    }

    // Автоперенос при двойном клике (на мобилках — по тапу)
    autoMove(col, cardIndex) {
        if (!this.canMoveCards(col, cardIndex)) return;

        const movingCard = this.columns[col][cardIndex];
        const movingValue = movingCard.value;

        // Ищем все подходящие колонки
        let bestCol = null;
        let bestLen = -1;
        let bestHasSameSuitStack = false;

        for (let i = 0; i < 10; i++) {
            if (i === col) continue;
            if (!this.canDrop(i, movingValue, movingCard.suit)) continue;

            const colCards = this.columns[i];
            const targetTopCard = colCards.length > 0 ? colCards[colCards.length - 1] : null;

            // Считаем длину стопки в колонке i (подряд открытые по убыванию с конца, одной масти)
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

            // Определяем, есть ли на целевой колонке стопка той же масти, что перемещаемая карта
            const hasSameSuitStack = targetTopCard !== null && targetTopCard.suit === movingCard.suit;

            // Приоритет: сначала колонки с той же мастью, потом по длине стопки
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

        // Сохраняем позиции карт ДО перемещения
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

        // Анимация: карты летят со старой позиции на новую
        requestAnimationFrame(() => {
            const colEl = document.querySelector(`.column[data-col="${bestCol}"]`);
            if (!colEl || rects.length === 0) return;

            const allCards = colEl.querySelectorAll('.card.front');
            const startIdx = allCards.length - rects.length;
            for (let i = 0; i < rects.length; i++) {
                const cardEl = allCards[startIdx + i];
                if (!cardEl) continue;
                const newRect = cardEl.getBoundingClientRect();
                const dx = rects[i].left - newRect.left;
                const dy = rects[i].top - newRect.top;
                
                // Ставим на старую позицию
                cardEl.style.transition = 'none';
                cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
                cardEl.style.zIndex = '999';
                void cardEl.offsetHeight;
                
                // Анимируем на новое место
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

    // ============ MOUSE DRAG & DROP ============
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

            // Подсветка колонок
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
                if (targetCol === fromCol || this.canDrop(targetCol, movingCard.value, movingCard.suit)) {
                    this.moveCards(fromCol, cardIdx, targetCol);
                }
            }

            this.cleanupDrag();
            fromCol = null;
            cardIdx = null;
        });
    }

    // ============ TOUCH DRAG & DROP ============
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

            // Не начинаем перетаскивание сразу - ждём движения
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (fromCol === null || cardIdx === null) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            // Если движение больше 5px - начинаем перетаскивание
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
            // Если не было перетаскивания - это тап, делаем автоперенос
            if (!hasMoved && fromCol !== null && cardIdx !== null) {
                this.handleTap(fromCol, cardIdx);
            }
            
            if (isDragging && fromCol !== null) {
                const touch = e.changedTouches[0];
                const targetCol = this.getColumnAtPosition(touch.clientX, touch.clientY);

                if (targetCol !== null) {
                    const movingCard = this.columns[fromCol][cardIdx];
                    if (targetCol === fromCol || this.canDrop(targetCol, movingCard.value, movingCard.suit)) {
                        this.moveCards(fromCol, cardIdx, targetCol);
                    }
                }
            }
            
            this.cleanupDrag();
            isDragging = false;
            fromCol = null;
            cardIdx = null;
            hasMoved = false;
        });
    }

    // ============ HELPERS ============
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
        cards.forEach((card, i) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card front';
            cardEl.style.position = 'relative';
            cardEl.style.marginBottom = '-30px';
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
    }

    removeDragGhost() {
        const existing = document.querySelector('.drag-ghost');
        if (existing) existing.remove();
    }

    highlightDropZones(x, y, fromCol, cardIdx) {
        // Убираем старую подсветку
        document.querySelectorAll('.column.highlight').forEach(el => el.classList.remove('highlight'));

        // Не подсвечиваем, если нет активного перетаскивания
        if (!this.isDragging || fromCol === null || cardIdx === null) return;

        const col = this.getColumnAtPosition(x, y);
        if (col === null || col === fromCol) return;

        const movingCard = this.columns[fromCol][cardIdx];
        if (this.canDrop(col, movingCard.value, movingCard.suit)) {
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
        // Сбрасываем локальные переменные в bindMouseEvents/bindTouchEvents через событие
    }

    newGame() {
        this.clearStorage();
        this.init();
    }
}

// Start the game
const game = new SpiderSolitaire();

// Expose for debugging
window.game = game;