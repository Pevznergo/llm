# Field Operations App — Roadmap

> **Цель:** Мобильное приложение для отслеживания оклеенных домов с картой, зонами и оптимизацией маршрутов

---

## Executive Summary

**Проблема:** Нужно быстро отмечать дома при расклейке наклеек и видеть прогресс на карте  
**Решение:** PWA приложение `/admin/field` с геолокацией, картами и построением маршрутов  
**Timeline:** 5 дней разработки (MVP → Zones → Routes → Polish)

---

## Архитектура

### Tech Stack

| Компонент | Технология | Зачем |
|-----------|------------|-------|
| Frontend | Next.js + React | Уже используется |
| Карты | Mapbox GL JS | Быстрые, красивые, 3D поддержка |
| Геоданные | OpenStreetMap Overpass API | Автозагрузка адресов домов |
| Routing | OSRM / Google Directions | Построение маршрутов |
| Drawing | Mapbox Draw | Рисование зон на карте |
| Database | PostgreSQL + PostGIS | Геопространственные запросы |
| Optimization | Google OR-Tools (опционально) | Оптимальный маршрут (TSP) |
| Offline | Service Worker (PWA) | Работа без интернета |

### Data Model

```sql
-- Зоны оклейки
CREATE TABLE sticker_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  polygon GEOMETRY(POLYGON, 4326), -- GeoJSON полигон
  total_houses INTEGER DEFAULT 0,
  completed_houses INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#10b981', -- hex color
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Логи отметок
CREATE TABLE sticker_logs (
  id SERIAL PRIMARY KEY,
  short_link_id INTEGER REFERENCES short_links(id), -- связь с существующей системой
  address VARCHAR(500),
  location GEOGRAPHY(POINT, 4326), -- lat/lng
  zone_id INTEGER REFERENCES sticker_zones(id),
  marked_by VARCHAR(255),
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  photo_url TEXT -- опционально
);

-- Маршруты
CREATE TABLE sticker_routes (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES sticker_zones(id),
  name VARCHAR(255),
  waypoints JSONB, -- упорядоченный массив [{address, lat, lng, order}]
  total_distance_km DECIMAL(10, 2),
  estimated_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрых геозапросов
CREATE INDEX idx_sticker_logs_location ON sticker_logs USING GIST (location);
CREATE INDEX idx_sticker_zones_polygon ON sticker_zones USING GIST (polygon);
```

---

## Фазы разработки

### 📍 Фаза 1: MVP - Basic Tracking (День 1)

**Цель:** Быстро отмечать дома и видеть их на карте

#### Features:
- ✅ Страница `/admin/field`
- ✅ Карта с маркерами домов (из `short_links`)
- ✅ Цветовая индикация:
  - 🔴 Красный = не оклеен (`is_stuck = false`)
  - 🟢 Зеленый = оклеен (`is_stuck = true`)
- ✅ Кнопка "Отметить текущий дом"
  - Запрашивает геолокацию
  - Находит ближайший дом (радиус 50м)
  - Меняет статус на "оклеен"
  - Записывает в `sticker_logs`
- ✅ Список домов сбоку (фильтр: все/оклеенные/неоклеенные)
- ✅ Счетчик прогресса: "45/120 домов (37%)"

#### API Endpoints:
```typescript
GET  /api/field/houses       // Все дома с координатами
POST /api/field/mark         // Отметить дом как оклеенный
  { houseId: number, location: { lat, lng }, notes?: string }
GET  /api/field/stats        // Статистика (всего/оклеено/осталось)
```

#### UI Components:
```
/app/admin/field/page.tsx           // Главная страница
/components/FieldMap.tsx             // Mapbox карта
/components/HouseMarker.tsx          // Маркер дома
/components/MarkHouseButton.tsx      // Кнопка "Отметить"
/components/HouseList.tsx            // Список домов
```

#### Acceptance Criteria:
- [ ] Открывается на мобильном
- [ ] Запрашивает геолокацию
- [ ] Находит ближайший дом в радиусе 50м
- [ ] Меняет цвет маркера с красного на зеленый
- [ ] Записывает в БД timestamp + location
- [ ] Показывает уведомление "Дом отмечен!"

---

### 🗺️ Фаза 2: Zones - Area Management (День 2-3)

**Цель:** Группировать дома по районам и отслеживать прогресс по зонам

#### Features:
- ✅ Инструмент рисования зон (Mapbox Draw)
- ✅ Создание зоны:
  - Рисуешь полигон на карте
  - Вводишь название "ЖК Самолет"
  - Автоматически загружает дома внутри (Overpass API)
  - Сохраняет в `sticker_zones`
- ✅ Список зон с прогрессом:
  ```
  ЖК Самолет        [████████░░] 80% (32/40)
  Новостройки       [███░░░░░░░] 30% (15/50)
  Центр города      [██████████] 100% (20/20)
  ```
- ✅ Фильтр по зоне на карте
- ✅ Автоматическое обновление прогресса при отметке дома
- ✅ Цветовая визуализация зон (разные цвета)

#### API Endpoints:
```typescript
POST /api/field/zones/create     // Создать зону
  { name, polygon: GeoJSON, color }
GET  /api/field/zones             // Все зоны с прогрессом
POST /api/field/zones/:id/load    // Загрузить дома в зону (Overpass)
PUT  /api/field/zones/:id         // Редактировать зону
DELETE /api/field/zones/:id       // Удалить зону
```

#### UI Components:
```
/components/ZoneDrawer.tsx           // Инструмент рисования
/components/ZoneList.tsx             // Список зон
/components/ZoneProgress.tsx         // Прогресс бар зоны
/components/ZoneFilter.tsx           // Фильтр по зоне
```

#### Integration with Overpass API:
```javascript
// Запрос домов в полигоне
const query = `
  [out:json];
  (
    node["addr:housenumber"](poly:"${coords}");
    way["addr:housenumber"](poly:"${coords}");
  );
  out center;
`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: query
});

// Парсим адреса и добавляем в short_links
```

#### Acceptance Criteria:
- [ ] Можно нарисовать полигон на карте
- [ ] Автоматически загружает ~50-100 домов за 5 сек
- [ ] Показывает прогресс по каждой зоне
- [ ] Можно кликнуть на зону → показать только её дома
- [ ] Прогресс обновляется при отметке дома

---

### 🛣️ Фаза 3: Routes - Optimal Path (День 4)

**Цель:** Построить оптимальный маршрут для оклейки района

#### Features:
- ✅ Кнопка "Построить маршрут" для зоны
- ✅ Алгоритм построения маршрута:
  1. Берет все неоклеенные дома в зоне
  2. Находит оптимальный порядок (Nearest Neighbor или TSP)
  3. Рисует линию маршрута на карте
  4. Нумерует дома по порядку (1, 2, 3...)
- ✅ Показывает:
  - Общее расстояние (5.2 км)
  - Время прохождения (~2.5 часа)
  - Список домов по порядку
- ✅ Пошаговая навигация:
  - "Следующий дом: ул. Ленина 15 (200м)"
  - Кнопка "Навигация" → открывает Яндекс.Карты/Google Maps
- ✅ Сохранение маршрута в БД

#### Routing Algorithms:

**Вариант A: Nearest Neighbor (простой, быстрый)**
```typescript
function buildRoute(houses: House[], startLocation: Location): Route {
  const route = [];
  let current = startLocation;
  const remaining = [...houses];
  
  while (remaining.length > 0) {
    const nearest = findNearest(current, remaining);
    route.push(nearest);
    remaining.remove(nearest);
    current = nearest.location;
  }
  
  return route;
}
```

**Вариант B: Google Directions API (готовое решение)**
```typescript
const waypoints = houses.map(h => ({ lat: h.lat, lng: h.lng }));
const response = await directionsService.route({
  origin: startLocation,
  destination: startLocation, // круговой маршрут
  waypoints,
  optimizeWaypoints: true, // автоматическая оптимизация
  travelMode: 'WALKING'
});
```

**Вариант C: Google OR-Tools (оптимальный, сложный)**
```python
# На бэкенде (Python)
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# Решает TSP (Traveling Salesman Problem)
routing = pywrapcp.RoutingModel(len(locations))
# ... настройка
solution = routing.SolveWithParameters(search_parameters)
```

#### API Endpoints:
```typescript
POST /api/field/routes/build      // Построить маршрут
  { zoneId, algorithm: 'nearest' | 'google' | 'optimal' }
GET  /api/field/routes/:id        // Получить маршрут
POST /api/field/routes/:id/start  // Начать навигацию
```

#### UI Components:
```
/components/RouteBuilder.tsx         // Построитель маршрута
/components/RouteMap.tsx             // Карта с маршрутом
/components/RouteSteps.tsx           // Список шагов
/components/Navigation.tsx           // Навигация по маршруту
```

#### Acceptance Criteria:
- [ ] Строит маршрут за <10 сек для 50 домов
- [ ] Показывает линию маршрута на карте
- [ ] Нумерует дома по порядку
- [ ] Можно начать навигацию
- [ ] Показывает расстояние и время

---

### 🎨 Фаза 4: Polish & Features (День 5)

**Цель:** Улучшить UX и добавить вспомогательные функции

#### Features:
- ✅ **PWA (Progressive Web App):**
  - Установка на домашний экран
  - Оффлайн режим (Service Worker)
  - Кеширование карты
- ✅ **Фото документация:**
  - Кнопка "Сфотографировать" при отметке
  - Загрузка в `/api/uploads/stickers/`
  - Галерея фото по дому
- ✅ **Экспорт данных:**
  - Экспорт зоны в GPX (для Garmin/навигаторов)
  - Экспорт в CSV (для отчетов)
  - Печать QR-кодов для зоны
- ✅ **Аналитика:**
  - График оклейки по дням
  - Тепловая карта активности
  - Топ-5 самых продуктивных дней
- ✅ **Уведомления:**
  - Push при входе в зону: "Вы в зоне ЖК Самолет"
  - Напоминание: "Осталось 5 домов в этой зоне"
- ✅ **Темная тема** (для работы вечером)
- ✅ **Голосовой ввод** (опционально)
  - "Отметить текущий дом" голосом

#### API Endpoints:
```typescript
GET  /api/field/analytics         // Статистика и графики
POST /api/field/export/gpx        // Экспорт в GPX
POST /api/field/export/csv        // Экспорт в CSV
POST /api/field/upload-photo      // Загрузка фото
```

#### PWA Manifest:
```json
{
  "name": "Aporto Field Ops",
  "short_name": "Field",
  "description": "Отслеживание оклейки наклеек",
  "start_url": "/admin/field",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/icons/field-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### Acceptance Criteria:
- [ ] Можно установить как приложение
- [ ] Работает оффлайн (основные функции)
- [ ] Можно сфотографировать дом
- [ ] Можно экспортировать маршрут в GPX
- [ ] Есть график прогресса за неделю

---

## User Flows

### Flow 1: Быстрая отметка дома
```
1. Открываю /admin/field на телефоне
2. Разрешаю геолокацию
3. Тапаю "Отметить текущий дом"
4. Вижу уведомление "Дом отмечен! (45/120)"
5. Маркер на карте меняется с 🔴 на 🟢
```
**Время:** 3 секунды

### Flow 2: Создание зоны
```
1. Тапаю "Создать зону"
2. Рисую полигон на карте вокруг района
3. Ввожу название "ЖК Самолет"
4. Тапаю "Загрузить дома"
5. Вижу "Загружено 47 домов"
6. Вижу прогресс "0/47 (0%)"
```
**Время:** 30 секунд

### Flow 3: Построение маршрута
```
1. Выбираю зону "ЖК Самолет"
2. Тапаю "Построить маршрут"
3. Вижу оптимальный путь через 47 домов
4. Вижу "Расстояние: 3.2 км, ~2 часа"
5. Тапаю "Начать навигацию"
6. Открывается Яндекс.Карты с первым адресом
7. Иду по маршруту, отмечаю каждый дом
```
**Время:** 2-3 часа (вся оклейка)

---

## Technical Implementation Details

### Mapbox Setup

```bash
# 1. Установить зависимости
npm install mapbox-gl @mapbox/mapbox-gl-draw

# 2. Получить API key
# https://account.mapbox.com/access-tokens/
```

```typescript
// components/FieldMap.tsx
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [37.6156, 55.7522], // Москва
  zoom: 12
});

// Добавить инструмент рисования
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true
  }
});
map.addControl(draw);
```

### Геолокация

```typescript
// Запросить текущее местоположение
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Найти ближайший дом
    const nearest = findNearestHouse(latitude, longitude);
  },
  (error) => {
    alert('Нужен доступ к геолокации');
  },
  { enableHighAccuracy: true, timeout: 5000 }
);
```

### Поиск ближайшего дома

```typescript
// Использовать PostGIS для быстрого поиска
async function findNearestHouse(lat: number, lng: number) {
  const result = await sql`
    SELECT id, address, 
           ST_Distance(
             location::geography,
             ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
           ) as distance_meters
    FROM short_links
    WHERE is_stuck = false  -- только неоклеенные
    ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    LIMIT 1
  `;
  
  if (result[0].distance_meters > 50) {
    throw new Error('Нет дома в радиусе 50 метров');
  }
  
  return result[0];
}
```

### Overpass API Integration

```typescript
// Загрузить дома в полигоне
async function loadHousesInZone(polygon: GeoJSON.Polygon) {
  // Конвертировать GeoJSON в формат Overpass
  const coords = polygon.coordinates[0]
    .map(([lng, lat]) => `${lat} ${lng}`)
    .join(' ');
  
  const query = `
    [out:json][timeout:25];
    (
      node["addr:housenumber"]["addr:street"](poly:"${coords}");
      way["addr:housenumber"]["addr:street"](poly:"${coords}");
    );
    out center;
  `;
  
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  });
  
  const data = await response.json();
  
  // Парсим результаты
  const houses = data.elements.map(el => ({
    street: el.tags['addr:street'],
    housenumber: el.tags['addr:housenumber'],
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon
  }));
  
  return houses;
}
```

---

## Performance Considerations

### Оптимизация карты:
- Кластеринг маркеров для >100 домов
- Ленивая загрузка маркеров (viewport-based)
- WebGL рендеринг (Mapbox GL)

### Оптимизация БД:
- Spatial индексы (GIST)
- Кеширование зон в Redis
- Пагинация списка домов

### Оффлайн режим:
- Service Worker кеширует:
  - HTML/CSS/JS приложения
  - Тайлы карты в viewport
  - Список последних 100 домов
- IndexedDB для локального хранения отметок
- Синхронизация при восстановлении сети

---

## Security & Permissions

### Auth Requirements:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.redirect('/login');
  }
  
  // Только админы могут редактировать
  if (request.url.includes('/admin/field') && 
      !session.user.isAdmin) {
    return NextResponse.redirect('/');
  }
}

export const config = {
  matcher: '/admin/field/:path*'
};
```

### Геолокация:
- Запрашивать разрешение только при первом использовании
- Показывать зачем нужна геолокация
- Работать без геолокации (ручной выбор на карте)

---

## Testing Strategy

### Unit Tests:
```typescript
// __tests__/field/routing.test.ts
describe('Route Builder', () => {
  it('should find optimal route for 10 houses', () => {
    const houses = generateTestHouses(10);
    const route = buildRoute(houses, startLocation);
    
    expect(route.length).toBe(10);
    expect(route.totalDistance).toBeLessThan(5000); // <5km
  });
  
  it('should handle empty house list', () => {
    const route = buildRoute([], startLocation);
    expect(route.length).toBe(0);
  });
});
```

### Integration Tests:
```typescript
// __tests__/field/api.test.ts
describe('Field API', () => {
  it('POST /api/field/mark should mark house', async () => {
    const response = await fetch('/api/field/mark', {
      method: 'POST',
      body: JSON.stringify({
        houseId: 123,
        location: { lat: 55.7522, lng: 37.6156 }
      })
    });
    
    expect(response.status).toBe(200);
    
    // Проверить в БД
    const log = await sql`
      SELECT * FROM sticker_logs WHERE short_link_id = 123
    `;
    expect(log.length).toBe(1);
  });
});
```

### E2E Tests (Playwright):
```typescript
// __tests__/field/e2e.test.ts
test('should mark house on map', async ({ page }) => {
  await page.goto('/admin/field');
  
  // Мокаем геолокацию
  await page.context().setGeolocation({
    latitude: 55.7522,
    longitude: 37.6156
  });
  
  await page.click('[data-testid="mark-house-btn"]');
  
  // Проверяем уведомление
  await expect(page.locator('.toast')).toContainText('Дом отмечен');
  
  // Проверяем цвет маркера изменился
  const marker = page.locator('[data-house-id="123"]');
  await expect(marker).toHaveClass(/marker-green/);
});
```

---

## Deployment Checklist

### Environment Variables:
```bash
# .env.production
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYXBvcnRvIiwiYSI6...
POSTGIS_ENABLED=true
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

### Database Migration:
```bash
# Запустить миграции
npm run db:migrate

# Проверить PostGIS
psql -c "SELECT PostGIS_version();"
```

### Nginx Configuration:
```nginx
# Увеличить timeout для Overpass запросов
location /api/field/zones {
  proxy_read_timeout 30s;
  proxy_pass http://localhost:3001;
}
```

### Monitoring:
- Логировать каждую отметку дома
- Alerting на ошибки геолокации
- Метрики:
  - Время построения маршрута
  - Успешность Overpass запросов
  - Количество отметок в час

---

## Future Enhancements (Post-MVP)

### V2.0 Features:
- 📸 **Computer Vision:** Автоопределение "наклейка на месте" по фото
- 🤖 **AI маршруты:** ML модель учится на истории для лучших маршрутов
- 👥 **Team mode:** Несколько работников одновременно
- 📊 **Advanced analytics:** Heatmaps, конверсия QR → регистрация
- 🎯 **Gamification:** Лидерборд, достижения, стрики
- 🔔 **Smart notifications:** "В районе X низкая конверсия, возможно наклейки отклеились"
- 🗣️ **Voice control:** Полностью голосовое управление
- 🌡️ **Weather integration:** Не предлагать маршруты в дождь

### Integration Ideas:
- Sync с CRM (кто оклеил → кто продал)
- Webhook в Telegram при завершении зоны
- API для партнеров/франчайзи
- Экспорт в 1C/Excel для бухгалтерии

---

## Success Metrics

### MVP (Фаза 1):
- ✅ <3 сек на отметку дома
- ✅ 95% точность определения ближайшего дома
- ✅ 0 багов с геолокацией

### Zones (Фаза 2):
- ✅ <10 сек загрузка 50 домов через Overpass
- ✅ Прогресс обновляется в реальном времени

### Routes (Фаза 3):
- ✅ Маршрут на 30% короче ручного
- ✅ <5 сек построение маршрута для 50 домов

### Overall:
- ✅ 50% сокращение времени на планирование
- ✅ 100% охват (все дома на карте)
- ✅ 90% NPS (user satisfaction)

---

## Resources

### Documentation:
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [PostGIS Manual](https://postgis.net/documentation/)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Google OR-Tools](https://developers.google.com/optimization)

### Design Inspiration:
- Google Maps route planning
- Uber driver app
- Waze crowd-sourced navigation

### Similar Apps:
- Field sales tracking apps
- Delivery route optimizers
- Survey data collection apps

---

## Contact & Support

**Project Lead:** Igor Tkachenko  
**Development Team:** {to be assigned}  
**Timeline:** 5 days (20-24 Jan 2026)  
**Budget:** Internal project

---

**Last Updated:** 2026-01-18  
**Version:** 1.0  
**Status:** 📋 Planning → Ready for Development
