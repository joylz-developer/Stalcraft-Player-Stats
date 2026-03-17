<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Stalcraft Player Stats

Статистика игроков Stalcraft с кастомными метриками и системой авторизации через EXBO.

Просмотреть приложение в AI Studio: https://ai.studio/apps/4552da04-9821-481c-806e-a7f0578523b5

## Требования

- Node.js (версия 18 или выше)
- Учётная запись EXBO (https://exbo.net/)

## Настройка перед запуском

### 1. Получение API-ключей Stalcraft

Перед запуском сервера необходимо получить клиентские ключи для доступа к API Stalcraft:

1. Перейдите на https://exbo.net/oauth/clients
2. Авторизуйтесь под своей учётной записью EXBO
3. Создайте новое OAuth-приложение
4. Скопируйте **Client ID** и **Client Secret**

### 2. Настройка переменных окружения

1. Создайте файл `.env` в корне проекта (или скопируйте `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Откройте `.env` и заполните следующие значения:

   ```env
   # URL приложения (для локальной разработки)
   APP_URL="http://localhost:3000"

   # Client ID из шага 1
   STALCRAFT_CLIENT_ID="ваш_client_id"

   # Client Secret из шага 1
   STALCRAFT_CLIENT_SECRET="ваш_client_secret"
   ```

   > ⚠️ **Важно:** Ключи `STALCRAFT_CLIENT_ID` и `STALCRAFT_CLIENT_SECRET` не включены в репозиторий по соображениям безопасности. Вы должны добавить их самостоятельно.

## Запуск локально

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите сервер разработки:
   ```bash
   npm run dev
   ```

3. Откройте браузер и перейдите по адресу:
   ```
   http://localhost:3000
   ```

## Структура проекта

- `server.ts` — Express-сервер с API для авторизации и проксирования запросов к Stalcraft API
- `src/` — React-фронтенд
- `.env` / `.env.example` — переменные окружения
