# MAX Bridge — React + GREEN-API

Тестовое задание на позицию **Frontend разработчик React**: веб-интерфейс для отправки и получения текстовых сообщений в **MAX** через **GREEN-API**.

Проект сделан как обычное React/Vite-приложение без серверной части и без зашитых учетных данных. Пользователь вводит `idInstance` и `apiTokenInstance` в интерфейсе, после чего приложение работает с HTTP API GREEN-API напрямую из браузера.

## Что реализовано

- React-интерфейс чата в стиле web.max.ru: навигационная панель, список диалогов, поиск, окно переписки, светлая/темная тема.
- Авторизация по `idInstance` и `apiTokenInstance` с проверкой состояния инстанса методом `getStateInstance`.
- Автоопределение стандартного `apiUrl` для MAX v3 с возможностью вручную указать `apiUrl` из личного кабинета GREEN-API.
- Создание нового чата по номеру телефона через `CheckAccount` с получением постоянного `chatId`.
- Альтернативное создание чата напрямую по известному `chatId`.
- Отправка **только текстовых сообщений** методом `SendMessage`.
- Получение сообщений через HTTP API: `ReceiveNotification` → обработка → `DeleteNotification`.
- Поддержка входящих `textMessage`, `extendedTextMessage` и текстовых `quotedMessage`.
- Автоматическое создание диалога, если входящее сообщение пришло из еще неизвестного чата.
- Оптимистическое отображение исходящих сообщений, статус отправки и повторная отправка при ошибке.
- Локальное сохранение списка чатов и переписки отдельно для каждого `idInstance`.
- Токен по умолчанию хранится только в `sessionStorage`; постоянное сохранение включается пользователем явно.
- Юнит-тесты API-утилит и reducer-а на встроенном `node:test`.
- GitHub Actions для автоматической проверки тестов и сборки проекта.
- PowerShell-скрипты для локального запуска, первой публикации на GitHub и последующих обновлений.

## Требования тестового задания

| Требование | Реализация |
|---|---|
| Интерфейс отправки и получения сообщений в MAX | Да |
| GREEN-API | Да |
| Только текстовые сообщения | Да |
| Прототип внешнего вида web.max.ru | Да |
| Максимально полный набор функций в рамках задания | Поиск, темы, статусы, retry, автосоздание чатов, сохранение истории |
| Отправка через SendMessage | Да |
| Получение через HTTP API | Да |
| React | Да |
| Ввод `idInstance`, `apiTokenInstance` | Да |
| Ввод номера получателя и создание чата | Да, через `CheckAccount` |
| Отображение ответа получателя | Да, long polling очереди уведомлений |

## Быстрый старт на Windows

Папку проекта можно положить, например, сюда:

```text
C:\Users\<username>\Desktop\MAX_GreenAPI_React_Test
```

Откройте PowerShell в папке проекта и выполните:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\01_run_local.ps1
```

Скрипт проверит Node.js, установит зависимости, запустит тесты и поднимет Vite dev server. Затем откройте адрес, который выведет Vite (обычно `http://localhost:5173`).

Ручной вариант:

```powershell
npm install
npm test
npm run dev
```

Рекомендуется Node.js 22 LTS; минимальная версия указана в `package.json`.

## Настройка GREEN-API для MAX

1. Создайте и авторизуйте MAX-инстанс в личном кабинете GREEN-API.
2. Скопируйте `idInstance`, `apiTokenInstance` и `apiUrl`.
3. Для HTTP API получения уведомлений `webhookUrl` должен быть пустым.
4. Включите получение входящих сообщений (`incomingWebhook`).
5. Откройте приложение и введите `idInstance` и `apiTokenInstance`.
6. Если автоматически предложенный `apiUrl` отличается от значения в кабинете, раскройте «Дополнительные параметры» и вставьте точный `apiUrl`.
7. Создайте чат по номеру телефона. Для MAX метод `CheckAccount` поддерживает номера РФ и РБ (`7…` / `375…`).
8. Отправьте текст. Входящие ответы появятся после получения уведомления из очереди.

## Как работает создание чата

В MAX рекомендуется отправлять сообщения по постоянному `chatId`. Поэтому приложение не отправляет сообщение «вслепую» по номеру телефона:

1. Пользователь вводит номер.
2. `CheckAccount` проверяет наличие MAX-аккаунта и возвращает `chatId`.
3. Приложение, если возможно, получает имя и аватар через `GetContactInfo`.
4. Все дальнейшие сообщения отправляются по полученному `chatId`.

Такой сценарий удобнее для корректной обработки входящих сообщений и не расходует квоту на один контакт в разных форматах идентификатора.

## Получение сообщений

Приложение использует очередь уведомлений GREEN-API:

1. `ReceiveNotification` с `receiveTimeout=5`.
2. Если пришло входящее текстовое сообщение — оно добавляется в нужный чат.
3. После успешной обработки вызывается `DeleteNotification`.
4. Затем цикл продолжает ожидание следующего уведомления.

Если сеть временно недоступна, polling автоматически возобновляется.

## Безопасность

- В репозитории **нет** настоящих `idInstance`/`apiTokenInstance`, номеров телефонов или переписки пользователя.
- Не добавляйте токен в `.env` и не коммитьте секреты.
- По умолчанию введенные учетные данные лежат в `sessionStorage` и пропадают после завершения браузерной сессии.
- Опция «Запомнить токен на этом устройстве» переносит учетные данные в `localStorage`; используйте ее только на личном компьютере.
- В исходном коде нет аналитики, рекламных SDK или отправки данных на сторонние сервисы; сетевые запросы приложения направляются только в указанный `apiUrl` GREEN-API.
- История чатов сохраняется в `localStorage` браузера для удобства тестирования; на общем компьютере очистите данные сайта после проверки.

## Проверки

```powershell
npm test
npm run build
```

Полная проверка:

```powershell
npm run check
```

## Публикация на GitHub

Нужны Git и GitHub CLI (`gh`). Один раз выполните вход:

```powershell
gh auth login
```

После этого:

```powershell
.\02_publish_github.ps1
```

По умолчанию будет создан публичный репозиторий `max-green-api-react-test`, выполнен первый commit и push.

С другим именем:

```powershell
.\02_publish_github.ps1 -RepoName "green-api-max-react" -Visibility public
```

Для последующих изменений:

```powershell
.\03_push_updates.ps1 -Message "fix: improve chat UI"
```


## Структура

```text
src/
  api/greenApi.js            # HTTP-клиент GREEN-API и парсинг уведомлений
  components/                # UI-компоненты
  hooks/useNotificationPoller.js
  state/chatReducer.js       # состояние чатов и сообщений
  storage/storage.js         # sessionStorage/localStorage
  utils/                     # форматирование и id
.github/workflows/
  ci.yml
01_run_local.ps1
02_publish_github.ps1
03_push_updates.ps1
```

## Официальная документация, использованная при реализации

- MAX API / Before start: https://green-api.com/v3/docs/before-start/
- SendMessage: https://green-api.com/v3/docs/api/sending/SendMessage/
- HTTP API receiving: https://green-api.com/v3/docs/api/receiving/technology-http-api/
- ReceiveNotification: https://green-api.com/v3/docs/api/receiving/technology-http-api/ReceiveNotification/
- DeleteNotification: https://green-api.com/v3/docs/api/receiving/technology-http-api/DeleteNotification/
- CheckAccount: https://green-api.com/v3/docs/api/service/CheckAccount/
- MAX chatId: https://green-api.com/v3/docs/api/chat-id/
- Incoming text format: https://green-api.com/v3/docs/api/receiving/notifications-format/incoming-message/TextMessage/

## Ограничения

Тестовое задание требует только текстовые сообщения, поэтому файлы, голосовые сообщения, изображения, звонки, реакции и группы намеренно не реализованы. Уведомления не текстовых типов извлекаются из очереди и подтверждаются, но не отображаются.

Для работы с реальным MAX-инстансом нужны действующие учетные данные GREEN-API и корректные настройки входящих уведомлений.
