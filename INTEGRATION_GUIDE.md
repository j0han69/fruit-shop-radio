# Фруктовая лавка: интеграция бэкенда

> Документ для разработчика или другой нейросети (например, Kimi).
> Здесь описано, что изменено в проекте, как это устроено и как запустить.

## 0. Что сделано

| Функция | Где в коде | Статус |
|---|---|---|
| Непрерывный аудиопоток (синглтон) | `src/audio/radioAudio.ts`, `src/hooks/useRadioPlayer.ts` | ✅ |
| Видео без звука ↔ заглушка | `src/components/LiveVideoPlayer.tsx`, `src/screens/LiveScreen.tsx` | ✅ |
| «Сейчас играет» (Icecast/Radio.co, 15 с) | `src/services/radio.ts`, `src/hooks/useNowPlaying.ts` | ✅ |
| Донаты через **ЮKassa** | `src/services/donations.ts`, `src/hooks/useDonate.ts`, `src/screens/DonateScreen.tsx`, `supabase/functions/create-donation`, `check-donation`, `yookassa-webhook` | ✅ |
| Анонимный профиль + история донатов | `src/providers/AuthProvider.tsx`, `src/screens/ProfileScreen.tsx` | ✅ |
| Флаг эфира через Realtime | `src/providers/LiveStateProvider.tsx` | ✅ |
| Скрытая админка (долгое нажатие + PIN) | `src/admin/AdminGate.tsx`, `src/admin/AdminPanel.tsx`, `supabase/functions/admin-unlock` | ✅ |
| Push «Мы в эфире!» | `src/lib/push.ts`, `src/providers/PushRegistrar.tsx`, `supabase/functions/send-live-notification` | ✅ |
| Схема БД + RLS | `supabase/migrations/20261112000000_init.sql` | ✅ |

**Почему ЮKassa, а не Stripe.** Все суммы в интерфейсе в рублях, а Stripe с российскими картами не работает. ЮKassa подключается через веб-страницу оплаты, поэтому нативный SDK не нужен и приложение работает в Expo Go. Клиент вообще не получает ключей ЮKassa: оплату создаёт Edge Function.

## 1. Архитектура

```
┌──────────── Приложение (Expo SDK 54) ─────────────┐
│ App.tsx                                            │
│  LanguageProvider                                  │
│   AuthProvider ── signInAnonymously() ─────────────┼──► Supabase Auth
│    LiveStateProvider ── Realtime app_state ◄───────┼─── Postgres (app_state)
│     PushRegistrar ── rpc register_push_token ──────┼──► push_tokens
│     NavigationContainer → вкладки                  │
│                                                    │
│ radioAudio.ts (СИНГЛТОН вне React)                 │
│   createAudioPlayer(STREAM_URL), создаётся 1 раз   │
│   ↑ useSyncExternalStore ← useRadioPlayer()        │
│                                                    │
│ LiveScreen:                                        │
│   isAudioPlaying ← useRadioPlayer()  (независимо)  │
│   isVideoLive    ← useLiveState()    (независимо)  │
│   {isVideoLive ? <LiveVideoPlayer muted/>          │
│                : <OfflineBroadcastCard/>}          │
└────────────────────────────────────────────────────┘
Edge Functions (Deno, секреты только тут):
  create-donation        → ЮKassa API → confirmation_url
  check-donation         → ЮKassa API (сверка статуса)
  yookassa-webhook       → ЮKassa API (сверка статуса, телу не доверяем)
  admin-unlock           → проверка ADMIN_PIN → admins
  send-live-notification → exp.host push API
```

### Почему аудио никогда не прерывается
- Плеер создаётся через `createAudioPlayer`, а не через хук `useAudioPlayer`. Хук уничтожал бы плеер при размонтировании экрана.
- `initRadioAudio(url)` идемпотентна: повторный вызов с тем же URL ничего не делает.
- Видео (`expo-video`) создаётся с `muted = true` и `audioMixingMode = 'mixWithOthers'`, поэтому аудиосессию у радио не забирает.
- Когда `isVideoLive` становится false, размонтируется только `<LiveVideoPlayer>`. Аудио о видео ничего не знает.
- Если поток оборвался (`didJustFinish`), а пользователь не нажимал паузу, плеер переподключается через 3 с.

### Таблицы (подробнее в SQL)
| Таблица | Назначение | Клиент может |
|---|---|---|
| `profiles` | `listener_number` (→ «Слушатель_1234»), `avatar_color` | читать свою |
| `donations` | сумма в копейках, сообщение, статус | читать свои (админ — все) |
| `push_tokens` | Expo push-токены | только через RPC `register_push_token` |
| `app_state` (1 строка) | `is_video_live`, `video_url` | читать всем; менять — только админу (RLS `is_admin()`) |
| `admins` | анонимные ID, которые ввели верный PIN | ничего |
| `admin_unlock_attempts` | лимит перебора PIN | ничего |

### Переводы
Новые строки лежат в `src/config/translationsExtra.ts` (ru и en). Исходные 12 словарей не изменены. `t()` в `useLanguage.tsx` сначала ищет ключ в основных словарях, затем в дополнительных. Для uk и kk запасной язык русский, для остальных — английский. Чтобы добавить перевод, допишите объект в `extraTranslations`.

## 2. Установка зависимостей

Выполните в папке `radio-app`:

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-video expo-notifications expo-device expo-constants expo-web-browser
npm run typecheck
```

`npx expo install` подберёт версии, совместимые с SDK 54, и исправит `package.json`, если указанные там версии отличаются.

## 3. Настройка Supabase

1. Создайте проект на https://supabase.com.
2. **Authentication → Sign In / Providers → Anonymous sign-ins → Enable.** В разделе Attack Protection включите CAPTCHA или rate limit.
3. **SQL Editor:** вставьте `supabase/migrations/20261112000000_init.sql` целиком и нажмите Run.
4. **Project Settings → API:** скопируйте Project URL и publishable (или anon) key в `.env` (шаблон в `.env.example`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_KEY=...
   EXPO_PUBLIC_STREAM_URL=...
   EXPO_PUBLIC_METADATA_URL=...
   ```
   ⚠️ `service_role` в `.env` не класть. Всё с префиксом `EXPO_PUBLIC_` попадает внутрь приложения.
5. Задайте секреты и задеплойте функции через Supabase CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase secrets set ADMIN_PIN=<ваш PIN> YOOKASSA_SHOP_ID=<shopId> YOOKASSA_SECRET_KEY=<секретный ключ> DONATION_RETURN_URL=fruktovaya-lavka://donate-complete
   npx supabase functions deploy create-donation
   npx supabase functions deploy check-donation
   npx supabase functions deploy admin-unlock
   npx supabase functions deploy send-live-notification
   npx supabase functions deploy yookassa-webhook --no-verify-jwt
   ```
   `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase подставляет в функции автоматически.

## 4. Настройка ЮKassa

1. Зарегистрируйтесь на https://yookassa.ru. Для старта подойдёт тестовый магазин.
2. В разделе **Интеграция → Ключи API** возьмите `shopId` и секретный ключ. Они идут **только** в `supabase secrets set` (шаг 3.5).
3. В разделе **Интеграция → HTTP-уведомления** укажите URL `https://<ref>.supabase.co/functions/v1/yookassa-webhook` и отметьте события `payment.succeeded` и `payment.canceled`.
4. Тестовая карта: `5555 5555 5555 4477`, любой срок в будущем, любой CVC.

Данные карты вводятся на странице ЮKassa, приложение их не видит. Приложение не собирает email и телефон. Если для чеков по 54-ФЗ понадобится `receipt`, ЮKassa может сама запросить email на своей странице оплаты (настраивается в ЛК).

## 5. Push-уведомления

1. `npm i -g eas-cli`, затем `eas login`, затем `eas init`. Команда пропишет `extra.eas.projectId` в `app.json`.
2. Android: в Firebase создайте проект, скачайте `google-services.json` и загрузите FCM V1 key через `eas credentials`. Пропишите `"googleServicesFile": "./google-services.json"` в `android` в `app.json`.
3. iOS: при `eas build` APNs-ключ создаётся автоматически.
4. В Expo Go на Android push не работают (с SDK 53). Нужна dev-сборка: `eas build --profile apk -p android`.
5. Необязательно: включите Enhanced Security for Push в настройках Expo и задайте `EXPO_ACCESS_TOKEN` в секретах Supabase.

## 6. Как пользоваться админкой

1. На вкладке «Эфир» удерживайте заголовок «РАДИО «ФРУКТОВАЯ ЛАВКА» / Прямой эфир» 2,5 секунды.
2. Введите PIN (тот, что в `ADMIN_PIN`). Текущее устройство станет админом, после этого PIN больше не спрашивается.
3. В пульте:
   - вставьте ссылку на видео (.m3u8) и нажмите «Сохранить ссылку»;
   - переключатель «Видеоэфир ВКЛ/ВЫКЛ» переключит у всех слушателей видео и заглушку за 1–2 секунды;
   - кнопка «Анонс эфира» отправит push всем, но не чаще раза в 5 минут;
   - ниже показаны последние оплаченные донаты с приветами.
4. Снять права: в SQL Editor выполните `delete from admins where user_id = '...';`.

## 7. Проверка

| Что проверить | Ожидаемый результат |
|---|---|
| Запустить без `.env` | Радио играет, донат пишет «сервер не настроен», приложение не падает |
| Play → перейти на другую вкладку → вернуться | Звук не прервался |
| Админ включил эфир | У второго устройства появилось видео **без звука**, радио продолжает играть |
| Админ выключил эфир | Видео исчезло, на его месте заглушка, звук не прервался ни на секунду |
| Донат 100 ₽ тестовой картой | Сообщение «Спасибо!», в профиле запись «Оплачено» |
| Закрыть окно оплаты | Сообщение «Оплата отменена» |
| Неверный PIN 10 раз | «Слишком много попыток», 15 минут блокировки |
| Вызвать `update app_state` не админом | 0 строк изменено (RLS) |

## 8. Ограничения и что можно доделать
- Анонимный профиль привязан к установке: после удаления приложения ID и история теряются. Это сознательное решение Privacy by Design.
- Чат (`ChatScreen`) по-прежнему локальный мок, он не входил в задачу.
- Удалённые и неиспользуемые файлы: `src/services/radio.ts → fetchBroadcastStatus` удалён. `useBroadcastStatus` теперь тонкая обёртка над `useLiveState`.
