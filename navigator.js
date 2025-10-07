// Основной класс навигатора
class CollegeNavigator {
    constructor() {
        this.currentFloor = 1;
        this.floorsData = {};
        this.init();
    }

    // Инициализация приложения
    async init() {
        await this.loadFloorsData();
        this.createFloorSelector();
        this.loadFloor(1);
        this.bindGlobalEvents();
    }

    // Данные о помещениях (в реальном проекте можно загружать из JSON)
    async loadFloorsData() {
        this.floorsData = {
            1: {
                name: "Первый этаж",
                svgFile: 'maps/floor-1.svg',
                rooms: {
                    'room-101': { 
                        number: "101", 
                        name: "Кабинет информатики", 
                        type: "classroom",
                        description: "Компьютерный класс, проектор",
                        capacity: "25 мест"
                    },
                    'room-102': { 
                        number: "102", 
                        name: "Кабинет математики", 
                        type: "classroom",
                        description: "Класс для занятий математикой",
                        capacity: "30 мест"
                    },
                    'stairs-a': { 
                        number: "A", 
                        name: "Лестница А", 
                        type: "stairs",
                        description: "Основная лестница между этажами"
                    },
                    'entrance-main': { 
                        number: "Главный", 
                        name: "Главный вход", 
                        type: "entrance",
                        description: "Центральный вход в техникум"
                    }
                }
            },
            2: {
                name: "Второй этаж",
                svgFile: 'maps/floor-2.svg',
                rooms: {
                    'room-201': { 
                        number: "201", 
                        name: "Физическая лаборатория", 
                        type: "lab",
                        description: "Лаборатория для практических работ",
                        capacity: "20 мест"
                    },
                    'room-202': { 
                        number: "202", 
                        name: "Кабинет истории", 
                        type: "classroom",
                        description: "Класс для гуманитарных дисциплин",
                        capacity: "28 мест"
                    }
                }
            },
            3: {
                name: "Третий этаж",
                svgFile: 'maps/floor-3.svg',
                rooms: {
                    'room-301': { 
                        number: "301", 
                        name: "Актовый зал", 
                        type: "auditorium",
                        description: "Помещение для мероприятий и собраний",
                        capacity: "100 мест"
                    }
                }
            },
            4: {
                name: "Четвертый этаж", 
                svgFile: 'maps/floor-4.svg',
                rooms: {
                    'room-401': { 
                        number: "401", 
                        name: "Спортивный зал", 
                        type: "gym",
                        description: "Зал для занятий физкультурой",
                        capacity: "50 мест"
                    }
                }
            }
        };
    }

    // Создание переключателя этажей
    createFloorSelector() {
        const selector = document.querySelector('.floor-selector');
        selector.innerHTML = '';

        Object.keys(this.floorsData).forEach(floorNum => {
            const button = document.createElement('button');
            button.className = 'floor-btn';
            button.dataset.floor = floorNum;
            button.textContent = `${floorNum} этаж`;
            
            button.addEventListener('click', (e) => {
                this.switchFloor(parseInt(e.target.dataset.floor));
            });
            
            selector.appendChild(button);
        });
    }

    // Переключение этажа
    async switchFloor(floorNumber) {
        if (floorNumber === this.currentFloor) return;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.floor) === floorNumber);
        });
        
        this.currentFloor = floorNumber;
        await this.loadFloor(floorNumber);
    }

    // Загрузка SVG карты этажа
    async loadFloor(floorNumber) {
        const floorData = this.floorsData[floorNumber];
        if (!floorData) return;

        try {
            // Показываем загрузку
            this.showLoading();
            
            // Обновляем заголовок
            document.getElementById('floor-title').textContent = floorData.name;
            
            // Загружаем SVG
            const response = await fetch(floorData.svgFile);
            const svgText = await response.text();
            
            const container = document.getElementById('svg-container');
            container.innerHTML = svgText;
            
            // Делаем SVG интерактивным
            this.makeSvgInteractive(floorNumber);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Ошибка загрузки карты:', error);
            this.showError(`Не удалось загрузить карту ${floorNumber} этажа`);
        }
    }

    // Делаем SVG элементы кликабельными
    makeSvgInteractive(floorNumber) {
        const svg = document.querySelector('#svg-container svg');
        if (!svg) return;

        const floorData = this.floorsData[floorNumber];
        
        // Обрабатываем все элементы с ID (комнаты, лестницы, входы)
        const interactiveElements = svg.querySelectorAll('[id]');
        
        interactiveElements.forEach(element => {
            const elementId = element.id;
            const roomData = floorData.rooms[elementId];
            
            if (roomData) {
                // Добавляем класс для стилизации
                element.classList.add('interactive-room');
                element.classList.add(`room-type-${roomData.type}`);
                
                // Добавляем обработчики событий
                this.addRoomEventListeners(element, roomData, elementId);
            }
        });
    }

    // Добавляем обработчики событий для комнаты
    addRoomEventListeners(element, roomData, elementId) {
        // Клик - показать информацию
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRoomInfo(roomData, elementId, element);
        });

        // Наведение - подсветка
        element.addEventListener('mouseenter', (e) => {
            if (!element.classList.contains('selected')) {
                element.classList.add('hovered');
            }
        });

        element.addEventListener('mouseleave', (e) => {
            element.classList.remove('hovered');
        });

        // Добавляем title для тултипа
        element.setAttribute('title', `${roomData.number} - ${roomData.name}`);
    }

    // Показать информацию о помещении
    showRoomInfo(roomData, elementId, element) {
        // Сбрасываем выделение
        this.resetSelection();
        
        // Выделяем выбранный элемент
        element.classList.add('selected');
        
        // Показываем информацию в панели
        const infoPanel = document.getElementById('room-info');
        infoPanel.innerHTML = this.createRoomInfoHTML(roomData, elementId);
        
        // Показываем панель
        infoPanel.classList.add('visible');
        
        // Сохраняем выбранный элемент
        this.selectedElement = element;
    }

    // Создание HTML для информации о комнате
    createRoomInfoHTML(roomData, elementId) {
        const typeIcons = {
            classroom: '🏫',
            lab: '🔬', 
            auditorium: '🎭',
            gym: '⚽',
            stairs: '🪜',
            entrance: '🚪',
            office: '💼'
        };

        const icon = typeIcons[roomData.type] || '📍';

        return `
            <div class="room-header">
                <span class="room-icon">${icon}</span>
                <h3>${roomData.number} - ${roomData.name}</h3>
            </div>
            <div class="room-details">
                <div class="detail-item">
                    <span class="detail-label">Тип:</span>
                    <span class="detail-value">${this.getRoomTypeText(roomData.type)}</span>
                </div>
                ${roomData.capacity ? `
                <div class="detail-item">
                    <span class="detail-label">Вместимость:</span>
                    <span class="detail-value">${roomData.capacity}</span>
                </div>
                ` : ''}
                <div class="detail-item full-width">
                    <span class="detail-label">Описание:</span>
                    <span class="detail-value">${roomData.description}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Этаж:</span>
                    <span class="detail-value">${this.currentFloor}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value code">${elementId}</span>
                </div>
            </div>
        `;
    }

    // Сброс выделения
    resetSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        document.querySelectorAll('.interactive-room').forEach(room => {
            room.classList.remove('selected', 'hovered');
        });
        
        document.getElementById('room-info').classList.remove('visible');
    }

    // Глобальные обработчики событий
    bindGlobalEvents() {
        // Клик вне комнаты - сброс выделения
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.interactive-room') && !e.target.closest('#room-info')) {
                this.resetSelection();
            }
        });

        // Клавиша Escape - сброс выделения
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.resetSelection();
            }
        });

        // Поиск помещений
        const searchInput = document.getElementById('room-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    // Поиск помещений
    handleSearch(query) {
        if (!query.trim()) {
            this.resetSearch();
            return;
        }

        const currentFloorData = this.floorsData[this.currentFloor];
        const results = [];

        // Ищем совпадения
        Object.entries(currentFloorData.rooms).forEach(([id, roomData]) => {
            const searchText = `${roomData.number} ${roomData.name} ${roomData.type}`.toLowerCase();
            if (searchText.includes(query.toLowerCase())) {
                results.push({ id, roomData });
            }
        });

        this.highlightSearchResults(results);
    }

    // Подсветка результатов поиска
    highlightSearchResults(results) {
        // Сбрасываем предыдущие результаты
        this.resetSearch();
        
        results.forEach(result => {
            const element = document.getElementById(result.id);
            if (element) {
                element.classList.add('search-result');
            }
        });

        // Показываем первый результат
        if (results.length > 0) {
            const firstResult = results[0];
            const element = document.getElementById(firstResult.id);
            if (element) {
                this.showRoomInfo(firstResult.roomData, firstResult.id, element);
            }
        }
    }

    // Сброс поиска
    resetSearch() {
        document.querySelectorAll('.search-result').forEach(el => {
            el.classList.remove('search-result');
        });
    }

    // Вспомогательные методы
    getRoomTypeText(type) {
        const types = {
            classroom: 'Учебный кабинет',
            lab: 'Лаборатория',
            auditorium: 'Актовый зал',
            gym: 'Спортивный зал',
            stairs: 'Лестница',
            entrance: 'Вход',
            office: 'Офис'
        };
        return types[type] || type;
    }

    showLoading() {
        const container = document.getElementById('svg-container');
        container.innerHTML = '<div class="loading">Загрузка карты...</div>';
    }

    hideLoading() {
        // Автоматически скрывается при загрузке SVG
    }

    showError(message) {
        const container = document.getElementById('svg-container');
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Дополнительные утилиты
class NavigationUtils {
    // Можно добавить сюда функции для будущей маршрутизации
    static calculateRoute(fromRoom, toRoom) {
        // Заглушка для будущей функциональности
        console.log(`Построение маршрута из ${fromRoom} в ${toRoom}`);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем поддержку SVG
    if (!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
        document.body.innerHTML = '<div class="error">Ваш браузер не поддерживает SVG. Пожалуйста, обновите браузер.</div>';
        return;
    }
    
    // Запускаем навигатор
    window.collegeNavigator = new CollegeNavigator();
});

// Глобальные функции для отладки
window.debugNavigator = {
    getCurrentFloor: () => window.collegeNavigator?.currentFloor,
    getSelectedRoom: () => window.collegeNavigator?.selectedElement?.id,
    showAllRooms: () => console.log(window.collegeNavigator?.floorsData)
};