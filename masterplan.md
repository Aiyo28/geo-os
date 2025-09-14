# MASTERPLAN — inDrive Geo‑OS (Next.js full‑stack, CLI)

Цель: за 2 дня собрать единый проект (Next.js + API Routes + deck.gl/maplibre + h3-js), который принимает данные через вебхук или загрузку CSV, строит прогноз спроса на 10–60 минут и показывает его на тепловой карте. Результат — демо‑видео 2–3 мин, презентация, GitHub и папка GDrive для сдачи.

## 0) Быстрый старт (CLI)

```bash
# Node 20+, pnpm (или npm)
corepack enable
git clone <your-repo-url> geo-os-next || npx create-next-app @latest geo-os-next --ts --app --eslint
cd geo-os-next
pnpm add deck.gl maplibre-gl h3-js d3-array
pnpm add -D @types/node @types/react typescript

# Старт дев-сервера
pnpm dev
# http://localhost:3000
```

## Данные:

Можно загрузить CSV через веб-интерфейс (upload form).

Или настроить POST webhook /api/ingest для приёма JSON с GPS точками.

Пример формата данных:

`randomized_id,lat,lng,spd,seq,timestamp`

## 1) Структура репозитория

```
geo-os-next/
  app/
    page.tsx
    api/
      ingest/route.ts       # webhook/загрузка CSV
      grid/route.ts
      forecast/route.ts
      recommendations/route.ts
      anomalies/route.ts
      simulate/route.ts
      kpi/route.ts
  lib/
    state.ts
    types.ts
    ingest.ts
    grid.ts
    forecast.ts
    recs.ts
    anomalies.ts
    simulate.ts
    geo.ts
  components/
    MapView.tsx
    KPICard.tsx
    ControlBar.tsx
    UploadForm.tsx         # форма загрузки CSV
  data/
    sample.csv             # пример
  public/
    styles.css
  README.md
```

## 2) План спринта (День 1 → День 2)

### День 1 — API + ingest + карта

- Сделать `/api/ingest`: принимает CSV файл (multipart) или JSON (webhook). Сохраняет в STATE.
- `grid.ts`: агрегация в H3 r=7.
- `forecast.ts`: EMA + hour-of-week.
- UI: форма загрузки CSV или кнопка “Симулировать вебхук”.
- Карта: слой текущего спроса.

### День 2 — прогноз + демо

- `/api/forecast`: прогноз 10–15 мин и 1 час.
- `/api/recommendations`: top‑3 зоны для водителя.
- `/api/simulate`: перемещение 10% водителей.
- KPI панель + бейдж CO₂.
- Видео 2–3 мин + слайды.

## 3) Контракты API

### POST /api/ingest

- **Вход:** CSV upload или JSON webhook.
- **Выход:** `{ rows_ingested, vehicles, zones_affected, filtered_errors }`

### GET /api/grid?hour=...

- Возвращает массив H3 зон.

### GET /api/forecast?horizon=15m|1h

- Прогноз спроса.

### GET /api/recommendations?lat=..&lng=..&k=3

- Зоны рядом с водителем.

### POST /api/simulate

- Перемещает часть водителей, KPI до/после.

## 4) UI

- `UploadForm.tsx`: drag&drop CSV → вызов /api/ingest.
- Карта: 3 слоя (текущий спрос, прогноз, аномалии).
- `ControlBar`: выбор горизонта прогноза (15m, 1h).
- `KPICard`: до/после, зелёные/красные дельты.

## 5) Демо-сценарий

1. Загружаем CSV или эмулируем POST webhook.
2. Карта показывает heatmap текущего спроса.
3. Переключаем “+15 минут” → прогнозные зоны подсвечиваются.
4. Нажимаем “Симуляция” → KPI до/после.
5. Вкладка Safety: аномалии маршрутов.

## 6) Упаковка для сдачи

- **GitHub:** код, README, примеры webhook и CSV upload.
- **GDrive:** PDF слайдами, demo.mp4, api_contract.md.
- Проверка доступа.

## 7) Риски

- CSV слишком большой → для демо берём 100k строк.
- API долго считает → кэшировать прогноз.
- Видео fallback на случай багов.

**Итог:** пользователь может загрузить файл или отправить вебхук, система сразу строит прогноз и визуализирует его на карте. Это показывает практическую ценность (реальный рабочий сервис), и закрывает все критерии (данные → прогноз → карта → KPI).