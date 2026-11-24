# Схема контента `app/content.json` (window.KC)

Ведёт чат «админ-панель». Приложение читает файл в начале `<head>` и кладёт его в `window.KC`. После каждого обновления (превью, публикация, опрос раз в 15 с) на `window` срабатывает событие `kc`. Блок приложения перерисовывается так: `addEventListener('kc', render)`.

- `?preview=1` — поверх читается черновик `localStorage.kosmoDraft` (так работает превью в админке).
- Помощник: `__kc('tickets.priceFrom', 500)` возвращает значение или значение по умолчанию.
- Применение к блокам — в `source/app/src/app2.html`, блок `v200 admin: применение KC`.

| Ключ | Тип | Где в приложении |
|---|---|---|
| `version`, `updated` | число, ГГГГ-ММ-ДД | ставит админка при публикации |
| `home` | `{greeting, notice, noticeOn, heroTitle, heroText}` | `#helloH`, плашка `#kcNotice`, герой главной |
| `hours` | `{open, close, lateClose: 'ЧЧ:ММ', late: [дни 0–6], closedDay: 0–6 или null, note}` | `HRS` (`window.__HRS`), `hours()` в билетах |
| `tickets` | `{priceFrom, url, label, note}` | `#tkCard`, `TYPES[0]`, примечание и ссылка в покупке |
| `guides[]` | `{time, title, sub, seats}` | `#gdBar` (ближайший сеанс), `openGuides()` |
| `events[]` | `{kind, day: 'ГГГГ-ММ-ДД', time, until, title, place}`; старый формат `{date, time, title, place}` тоже понимается | `#kcEvents` «Сегодня/Скоро в музее». Прошедшие скрываются |
| `facts[]` | `{d: 'ММ-ДД', t, p, ex}` | `#fact`, пуш с фактом дня |
| `push` | `{on, text}` | срочное уведомление `#push` |
| `announcements[]` | `{at: 'ГГГГ-ММ-ДДTЧЧ:ММ', title, text}` | уведомление `#push` в назначенное время, видно 24 ч |
| `exhibits[]` | `{id, title, short, desc, dog}` — только изменённые карточки | правки поверх `EX` (карточка экспоната, рассказ Белки) |
| `shop[]` | `{cat, title, sub, price, badge}` | `window.__SHOP.P` (иконка и цвет — по категории) |
| `menu[]` | `{cat, title, sub, price}` | `window.__SHOP.MENU` |

**Для чата «улучшения приложения»:** если вы делаете свой блок афиши, поставьте на него `data-kc-block="events"` — временный блок `#kcEvents` уберётся сам. Данные берите из `KC.events` и перерисовывайте блок по событию `kc`.
