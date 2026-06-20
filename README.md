# Auroom Clean — внутренний калькулятор стоимости

Внутренний калькулятор менеджера Auroom Clean. Проект сделан на HTML5, CSS3 и Vanilla JavaScript, без React, Vue, npm и зависимостей.

## Как открыть локально

Откройте `index.html` в браузере.

## Структура

```text
calculator/
├── index.html
├── css/style.css
├── js/app.js
├── js/calculator.js
├── js/ui.js
├── js/storage.js
├── js/config.js
├── assets/logo.svg
└── assets/icons/
```

## Где менять цены

Все цены, коэффициенты, минимальные заказы, доплаты и правила расчёта находятся только в `js/config.js`.

Не меняйте бизнес-числа в `calculator.js`, `ui.js`, `app.js` или HTML.

Источник данных: `00_Главный_файл_ценообразование_Auroom_Clean.docx`, версия `19.06.2026`.

## Как добавить услугу

В `js/config.js` добавьте новый объект в `addOns`.

Поддерживаемые типы:

- `fixed` — фиксированная цена;
- `unit` — количество × ставка;
- `minutes` — минуты с минимумом и максимумом;
- `choice` — выбор варианта;
- `percent` — процентная надбавка;
- `manual` — ручная сумма менеджера;
- `coefficientOverride` — принудительное повышение коэффициента загрязнения.

## Как подключить backend позже

Оставьте `calculator.js` как чистую бизнес-логику. В `storage.js` замените LocalStorage на API-запросы:

- `GET /calculations` — история;
- `POST /calculations` — сохранить расчёт;
- `GET /calculations/:id` — открыть расчёт;
- `DELETE /calculations/:id` — удалить расчёт.

После этого в `app.js` можно отправлять заявку в CRM, Telegram-бот или админ-панель.
