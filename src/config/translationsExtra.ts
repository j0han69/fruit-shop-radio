/**
 * Новые строки для бэкенд-функций (донаты, профиль, админка, видео).
 * Вынесены отдельно, чтобы не трогать 12 исходных словарей.
 * ru и en — полные. Для остальных языков действует fallback
 * (uk/kk → ru, остальные → en) — см. src/hooks/useLanguage.tsx.
 * Чтобы перевести на другой язык — добавьте объект в `extraTranslations`.
 */
import type { LanguageCode } from './translations';

const ru = {
  videoLive: 'ВИДЕОЭФИР',
  videoError: 'Видео недоступно, но радио продолжает играть',

  donateDisclaimer: 'Оплата через ЮKassa. Мы не собираем имя, телефон и email.',
  donateProcessing: 'Открываем оплату…',
  donateSuccessTitle: 'Спасибо!',
  donateSuccessText: 'Донат получен. Ведущий увидит ваше сообщение.',
  donateCanceled: 'Оплата отменена',
  donatePendingTitle: 'Платёж обрабатывается',
  donatePendingText: 'Статус обновится в профиле, как только банк подтвердит оплату.',
  donateErrorTitle: 'Не получилось',
  donateErrorText: 'Не удалось создать платёж. Проверьте интернет и попробуйте ещё раз.',
  donateBackendOff: 'Сервер оплаты ещё не настроен (нет ключей Supabase в .env).',
  invalidAmountRange: 'Сумма должна быть от 10 до 100 000 ₽.',

  anonymousDescription: 'Анонимный профиль: мы не знаем вашего имени, телефона и email. Профиль хранится только на этом устройстве.',
  donationHistory: 'История поддержки',
  noDonations: 'Пока нет донатов',
  statusSucceeded: 'Оплачено',
  statusPending: 'В обработке',
  statusCanceled: 'Отменено',
  statusFailed: 'Ошибка',
  connecting: 'Подключаемся…',

  adminTitle: 'Пульт ведущего',
  adminPinPrompt: 'Введите PIN ведущего',
  adminUnlock: 'Войти',
  adminWrongPin: 'Неверный PIN',
  adminTooMany: 'Слишком много попыток. Подождите 15 минут.',
  adminLiveToggle: 'Видеоэфир',
  adminLiveOn: 'ВКЛ',
  adminLiveOff: 'ВЫКЛ',
  adminVideoUrl: 'Ссылка на видеопоток (.m3u8)',
  adminSave: 'Сохранить ссылку',
  adminSaved: 'Сохранено',
  adminAnnounce: 'Анонс эфира (push всем)',
  adminAnnounceConfirm: 'Отправить уведомление всем слушателям?',
  adminAnnounceSent: 'Уведомления отправлены',
  adminCooldown: 'Анонс уже отправлялся. Подождите 5 минут.',
  adminForbidden: 'Нет прав администратора',
  adminError: 'Ошибка. Попробуйте ещё раз.',
  adminRecentDonations: 'Последние донаты',
  adminClose: 'Закрыть',
  cancel: 'Отмена',
  confirm: 'Да',
};

export type ExtraTranslationKey = keyof typeof ru;
type ExtraDictionary = Record<ExtraTranslationKey, string>;

const en: ExtraDictionary = {
  videoLive: 'VIDEO LIVE',
  videoError: 'Video is unavailable, but the radio keeps playing',

  donateDisclaimer: 'Payments via YooKassa. We never collect your name, phone or email.',
  donateProcessing: 'Opening payment…',
  donateSuccessTitle: 'Thank you!',
  donateSuccessText: 'Donation received. The host will see your message.',
  donateCanceled: 'Payment canceled',
  donatePendingTitle: 'Payment is processing',
  donatePendingText: 'The status will update in your profile once the bank confirms it.',
  donateErrorTitle: 'Something went wrong',
  donateErrorText: 'Could not create the payment. Check your connection and try again.',
  donateBackendOff: 'The payment server is not configured yet (no Supabase keys in .env).',
  invalidAmountRange: 'The amount must be between 10 and 100,000 ₽.',

  anonymousDescription: 'Anonymous profile: we don’t know your name, phone or email. It is stored only on this device.',
  donationHistory: 'Support history',
  noDonations: 'No donations yet',
  statusSucceeded: 'Paid',
  statusPending: 'Processing',
  statusCanceled: 'Canceled',
  statusFailed: 'Failed',
  connecting: 'Connecting…',

  adminTitle: 'Host console',
  adminPinPrompt: 'Enter the host PIN',
  adminUnlock: 'Unlock',
  adminWrongPin: 'Wrong PIN',
  adminTooMany: 'Too many attempts. Wait 15 minutes.',
  adminLiveToggle: 'Video broadcast',
  adminLiveOn: 'ON',
  adminLiveOff: 'OFF',
  adminVideoUrl: 'Video stream URL (.m3u8)',
  adminSave: 'Save URL',
  adminSaved: 'Saved',
  adminAnnounce: 'Announce broadcast (push to all)',
  adminAnnounceConfirm: 'Send a notification to all listeners?',
  adminAnnounceSent: 'Notifications sent',
  adminCooldown: 'An announcement was sent recently. Wait 5 minutes.',
  adminForbidden: 'No admin rights',
  adminError: 'Error. Please try again.',
  adminRecentDonations: 'Recent donations',
  adminClose: 'Close',
  cancel: 'Cancel',
  confirm: 'Yes',
};

export const extraTranslations: Partial<Record<LanguageCode, Partial<ExtraDictionary>>> & {
  ru: ExtraDictionary;
  en: ExtraDictionary;
} = { ru, en };

/** Языки, для которых запасным словарём выступает русский */
export const RU_FALLBACK_LANGUAGES: readonly LanguageCode[] = ['uk', 'kk'];
