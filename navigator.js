console.log('Скрипт загружен');

// Проверка существования элементов
console.log('SVG контейнер:', document.getElementById('svg-container'));
console.log('Заголовок этажа:', document.getElementById('floor-title'));

class CollegeNavigator {
    constructor() {
        this.currentFloor = 1;
        this.floorsData = {};
        this.init();
    }

    async init() {
        console.log('Инициализация навигатора...');
        await this.loadFloorsData();
        this.createFloorSelector();
        await this.loadFloor(1);
        this.bindGlobalEvents();
        console.log('Навигатор готов!');
    }

    async loadFloorsData() {
        this.floorsData = {
            1: {
                name: "Первый этаж",
                svgFile: 'maps/floor-1.svg',
                rooms: {
                    'room-101': { number: "101", name: "Кабинет информатики", type: "classroom" },
                    'room-102': { number: "102", name: "Кабинет математики", type: "classroom" },
                    'stairs-a': { number: "A", name: "Лестница А", type: "stairs" },
                    'entrance-main': { number: "Главный", name: "Главный вход", type: "entrance" }
                }
            },
            2: {
                name: "Второй этаж", 
                svgFile: 'maps/floor-2.svg',
                rooms: {
                    'room-201': { number: "201", name: "Физическая лаборатория", type: "lab" }
                }
            }
        };
    }

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

    async switchFloor(floorNumber) {
        console.log(`Переключение на этаж ${floorNumber}`);
        
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.floor) === floorNumber);
        });
        
        this.currentFloor = floorNumber;
        await this.loadFloor(floorNumber);
    }

    async loadFloor(floorNumber) {
        const floorData = this.floorsData[floorNumber];
        if (!floorData) {
            this.showError(`Данные для этажа ${floorNumber} не найдены`);
            return;
        }

        try {
            document.getElementById('floor-title').textContent = floorData.name;
            
            console.log(`Загружаем SVG: ${floorData.svgFile}`);
            const response = await fetch(floorData.svgFile);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const svgText = await response.text();
            console.log('SVG загружен успешно');
            
            const container = document.getElementById('svg-container');
            container.innerHTML = svgText;
            
            this.makeSvgInteractive(floorNumber);
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showError(`Ошибка загрузки: ${error.message}`);
        }
    }

    makeSvgInteractive(floorNumber) {
        const svg = document.querySelector('#svg-container svg');
        if (!svg) {
            console.error('SVG элемент не найден в контейнере');
            return;
        }

        console.log('Делаем SVG интерактивным...');
        const floorData = this.floorsData[floorNumber];
        
        // Делаем все элементы с ID кликабельными
        const elements = svg.querySelectorAll('[id]');
        console.log(`Найдено элементов с ID: ${elements.length}`);
        
        elements.forEach(element => {
            const elementId = element.id;
            const roomData = floorData.rooms[elementId];
            
            if (roomData) {
                element.classList.add('interactive-room');
                element.classList.add(`room-type-${roomData.type}`);
                element.style.cursor = 'pointer';
                
                element.addEventListener('click', () => {
                    this.showRoomInfo(roomData, element);
                });
                
                element.addEventListener('mouseenter', () => {
                    if (!element.classList.contains('selected')) {
                        element.style.opacity = '0.8';
                    }
                });
                
                element.addEventListener('mouseleave', () => {
                    if (!element.classList.contains('selected')) {
                        element.style.opacity = '1';
                    }
                });
                
                console.log(`Добавлена интерактивность для: ${elementId}`);
            }
        });
    }

    showRoomInfo(roomData, element) {
        // Сброс предыдущего выделения
        document.querySelectorAll('.interactive-room').forEach(el => {
            el.classList.remove('selected');
            el.style.opacity = '1';
        });
        
        // Выделение выбранного
        element.classList.add('selected');
        element.style.opacity = '1';
        
        // Обновление информационной панели
        const infoPanel = document.getElementById('room-info');
        infoPanel.innerHTML = `
            <h3>${roomData.number} - ${roomData.name}</h3>
            <p><strong>Тип:</strong> ${this.getRoomTypeText(roomData.type)}</p>
            <p><strong>Этаж:</strong> ${this.currentFloor}</p>
        `;
    }

    getRoomTypeText(type) {
        const types = {
            classroom: 'Учебный кабинет',
            lab: 'Лаборатория', 
            stairs: 'Лестница',
            entrance: 'Вход'
        };
        return types[type] || type;
    }

    showError(message) {
        const container = document.getElementById('svg-container');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.interactive-room') && !e.target.closest('#room-info')) {
                document.querySelectorAll('.interactive-room').forEach(el => {
                    el.classList.remove('selected');
                    el.style.opacity = '1';
                });
                document.getElementById('room-info').innerHTML = 'Выберите помещение на карте';
            }
        });
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.collegeNavigator = new CollegeNavigator();
});