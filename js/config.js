(function () {
  'use strict';

  const CONFIG = {
    company: {
      name: 'AUROOM CLEAN',
      appTitle: 'Калькулятор стоимости',
      city: 'Гомель',
      sourceDocument: '00_Главный_файл_ценообразование_Auroom_Clean.docx',
      sourceVersion: '19.06.2026'
    },
    money: { currency: 'BYN', locale: 'ru-BY', roundingStep: 1 },
    deposit: { percent: 50 },
    storage: { key: 'auroom-clean-calculator-history-v1', historyLimit: 20 },
    defaults: { objectType: 'apartment', cleaningType: 'maintenance', dirtLevel: 'medium', area: '' },

    cleaningTypes: {
      maintenance: {
        label: 'Поддерживающая', shortLabel: 'Поддерживающая уборка', mode: 'area',
        baseRate: 2.8, minimum: 80, websiteFrom: 'от 2,5 BYN/м²',
        managerHint: 'База: полы, пыль, доступные поверхности, кухня снаружи, санузел, зеркала, мусор. Окна, техника внутри, шкафы внутри, сильный жир и разбор вещей — отдельно.'
      },
      general: {
        label: 'Генеральная', shortLabel: 'Генеральная уборка', mode: 'area',
        baseRate: 5.4, minimum: 170, websiteFrom: 'от 5,0 BYN/м²',
        managerHint: 'Глубокая кухня/санузел, фасады, плинтусы, двери, выключатели, трудные зоны, удаление старой бытовой грязи.'
      },
      repair: {
        label: 'После ремонта', shortLabel: 'Уборка после ремонта', mode: 'area',
        baseRate: 6.3, minimum: 240, websiteFrom: 'от 5,8 BYN/м²',
        managerHint: 'Строительная пыль, влажная уборка поверхностей, полы, плитка, подоконники, доступные зоны.'
      },
      daily: {
        label: 'Посуточная', shortLabel: 'Сменная уборка посуточной квартиры', mode: 'fixedByArea',
        minimum: 65, websiteFrom: 'от 65 BYN',
        fixedByArea: [
          { id: 'studio', label: '1-комн / студия до 35 м²', maxArea: 35, min: 65, max: 85, recommended: 75 },
          { id: 'two_rooms', label: '2-комн 36–55 м²', maxArea: 55, min: 85, max: 110, recommended: 98 },
          { id: 'three_rooms', label: '3-комн 56–75 м²', maxArea: 75, min: 110, max: 150, recommended: 130 },
          { id: 'large_daily', label: 'Большая посуточная квартира 76+ м²', maxArea: null, min: 150, max: 190, recommended: 160 }
        ],
        managerHint: 'Быстро подготовить квартиру между гостями: мусор, санузел, кухня, полы, кровать, контроль запаха, фотоотчёт.'
      }
    },

    objectTypes: {
      apartment: { label: 'Квартира', coefficientPresets: [{ id: 'apartment_base', label: 'Квартира · базово', value: 1.0 }] },
      house: {
        label: 'Дом',
        coefficientPresets: [
          { id: 'house_one_floor', label: 'Дом 1 этаж', value: 1.15 },
          { id: 'house_two_floors', label: 'Дом 2 этажа / коттедж', value: 1.25 },
          { id: 'house_after_repair', label: 'Дом после ремонта', value: 1.35 }
        ],
        serviceOverrides: { maintenance: { baseRate: 3.2, minimum: 120 }, general: { baseRate: 6.2, minimum: 250 }, repair: { baseRate: 7.0, minimum: 300 } }
      },
      office: {
        label: 'Офис',
        coefficientPresets: [
          { id: 'office_simple', label: 'Офис простой / мало мебели', value: 0.9 },
          { id: 'office_standard', label: 'Офис стандартный', value: 1.0 },
          { id: 'office_complex', label: 'Офис сложный / санузлы / кухня', value: 1.1 }
        ],
        serviceOverrides: { maintenance: { baseRate: 2.5, minimum: 100 }, general: { baseRate: 3.5, minimum: 120 }, repair: { baseRate: 6.3, minimum: 240 } }
      },
      commercial: {
        label: 'Коммерческое помещение',
        coefficientPresets: [
          { id: 'commercial_simple', label: 'Коммерция простая', value: 1.0 },
          { id: 'commercial_complex', label: 'Коммерция сложная', value: 1.1 }
        ],
        serviceOverrides: { maintenance: { baseRate: 2.8, minimum: 100 }, general: { baseRate: 3.5, minimum: 120 }, repair: { baseRate: 6.3, minimum: 240 } }
      }
    },

    dirtLevels: {
      light: { label: 'Лёгкое', coefficient: 1.0, hint: 'Регулярно убирали, мало вещей, без животных.' },
      medium: { label: 'Среднее', coefficient: 1.1, hint: 'Пыль, бытовая грязь, стандартная кухня/ванна.' },
      strong: { label: 'Сильное', coefficient: 1.25, hint: 'Жир на кухне, налёт, много вещей, давно не убирали.' }
    },

    addOns: {
      windows: { label: 'Окна', description: 'Обычное окно, 1 створка. Сложный доступ дороже.', type: 'unit', unitLabel: 'створок', pricePerUnit: 12, min: 10, max: 15, defaultQuantity: 1 },
      oven: { label: 'Духовка', description: 'Внутри. При застарелом жире согласовать повышенную доплату.', type: 'fixed', price: 40, min: 30, max: 55 },
      fridge: { label: 'Холодильник', description: 'Клиент должен освободить продукты заранее.', type: 'choice', defaultChoice: 'inside', choices: [{ id: 'inside', label: 'внутри', price: 35, min: 25, max: 45 }, { id: 'outside', label: 'снаружи', price: 0, min: 0, max: 0 }, { id: 'full', label: 'полностью', price: 35, min: 25, max: 45 }] },
      balcony: { label: 'Балкон', description: 'Если склад вещей — только после расчистки и согласования.', type: 'choice', defaultChoice: 'open', choices: [{ id: 'open', label: 'без остекления', price: 40, min: 25, max: 60 }, { id: 'glazed', label: 'с остеклением', price: 90, min: 60, max: 140 }] },
      microwave: { label: 'Микроволновка', description: 'Внутри. Жир/запах может потребовать доплаты.', type: 'fixed', price: 20, min: 15, max: 25 },
      hood: { label: 'Вытяжка', description: 'Снаружи. Фильтр/разбор отдельно.', type: 'fixed', price: 35, min: 25, max: 45 },
      cabinets: { label: 'Шкафы внутри', description: 'Кухонные шкафы внутри. Клиент освобождает полки заранее.', type: 'unit', unitLabel: 'секций', pricePerUnit: 15, min: 10, max: 20, defaultQuantity: 1 },
      dishes: { label: 'Мытьё посуды', description: 'Большой объём посуды после гостей — отдельная доплата.', type: 'minutes', unitLabel: 'минут', pricePerMinute: 1, minimumCharge: 15, maximumCharge: 50, defaultMinutes: 15 },
      petHair: { label: 'Шерсть животных', description: 'Либо коэффициент 1,10–1,25, либо доплата.', type: 'fixed', price: 40, min: 20, max: 80 },
      mold: { label: 'Плесень', description: 'Не обещать 100% результат на старых/повреждённых поверхностях.', type: 'fixed', price: 70, min: 25, max: 120, warning: 'Плесень — зона риска. Лучше просить фото и не давать гарантию полного удаления.' },
      rust: { label: 'Ржавчина', description: 'Старая ржавчина может не уйти полностью.', type: 'fixed', price: 60, min: 25, max: 100, warning: 'Ржавчину и старый налёт фиксировать по фото, гарантию 100% не обещать.' },
      heavyContamination: { label: 'Очень сильное загрязнение', description: 'После арендаторов, запах, мусор, волосы, липкие поверхности.', type: 'coefficientOverride', coefficient: 1.4, minCoefficient: 1.4, maxCoefficient: 1.6, warning: 'Не фиксировать без фото. Можно разделить уборку на этапы.' },
      urgent: { label: 'Срочный выезд', description: 'Заказ сегодня, если реально есть свободный клинер.', type: 'percent', percent: 25, minPercent: 20, maxPercent: 30 },
      trash: { label: 'Вынос мусора', description: 'Бытовой мусор. Строительный мусор считается отдельно.', type: 'unit', unitLabel: 'мешков', pricePerUnit: 20, min: 10, max: 30, defaultQuantity: 1 },
      ironing: { label: 'Глажка', description: 'В главном документе нет фиксированной цены. Менеджер вводит согласованную сумму вручную.', type: 'manual', defaultAmount: 0, placeholder: 'Сумма за глажку, BYN' },
      road: { label: 'Дорога / дальний район', description: 'Формула документа учитывает дорогу, но фиксированной ставки нет. Введите сумму вручную при необходимости.', type: 'manual', defaultAmount: 0, placeholder: 'Доплата за дорогу, BYN' },
      managerExtra: { label: 'Ручная корректировка', description: 'Для случаев, где нужна индивидуальная доплата по фото/осмотру.', type: 'manual', defaultAmount: 0, placeholder: 'Доплата, BYN' }
    },

    managerRules: [
      'Не говорить точную финальную цену без фото, если объект сложный.',
      'Перед уборкой отправить клиенту тип уборки, адрес, дату, цену, что входит и что не входит.',
      'Если на месте грязи больше — пауза, фото, согласование новой цены до работ.',
      'После уборки отправить фотоотчёт и чек-лист выполненных зон.',
      'Если клиент спорит по цене — сверяться с согласованным чек-листом и допами.'
    ],
    copyTemplate: { greeting: 'Здравствуйте!', thanks: 'Спасибо!' }
  };

  window.AUROOM_CONFIG = Object.freeze(CONFIG);
})();
