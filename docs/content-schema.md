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

## Добавлено в v3 (сайт + админка)

- `events[]`: `desc` — описание (до 300 знаков), `image` — путь `app/g/...` или https-ссылка, `link` — ссылка «Записаться», `featured` — показывать в главном баннере сайта.
- `prices[]`: `{ cat, note, price }` — таблица цен на сайте («Посещение», главная).
- `site`: `{ heroMode: "Мероприятия" | "Экспонаты", homeExhibits: [id…], appBanner: true|false }`.
- `contacts`: `{ phone, email, address, metro, press }` — подвал сайта и «О музее».
- Рендеры экспонатов: `app/g/gen/*.webp` (портрет 960×1200), `*_wide.webp` для широкого баннера.

## Добавлено в v202 (админ): картинки экспоната

- `exhibits[].thumb` — аватарка экспоната (квадрат от 600×600): превью в списках, на карте и в альбоме, пока марка не собрана. Путь `app/…` или ссылка `https://…`. Нет поля — стандартная (`thumbs/gen/<id>.webp`, иначе `thumbs/<id>.webp`).
- `exhibits[].stamp` — кадр марки 3:4 (от 1400 px по ширине, предмет чуть ниже центра, тёмные поля сверху и снизу под текст). Нет поля — стандартный `app/g/stamps/<id>.webp`.
- Приложение применяет их в блоке `v202 admin` (по событию `kc`): подменяет `window.__AV[id]` и путь картинки в `window.stampHTML`.
- Стандартные кадры марок серии «Кино» лежат в `app/g/stamps/<id>.webp`, исходники — `app/g/stamps/src/<id>_kino.jpg`.
