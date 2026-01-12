import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'ar'],
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        },
        resources: {
            en: {
                translation: {
                    greeting: {
                        morning: 'Good Morning',
                        afternoon: 'Good Afternoon',
                        evening: 'Good Evening',
                        chief: 'Chief'
                    },
                    stats: {
                        timezone: 'Current Timezone',
                        dayOfWeek: 'Day of the week',
                        dayOfYear: 'Day of the year',
                        weekNumber: 'Week number'
                    },
                    button: {
                        more: 'MORE',
                        less: 'LESS'
                    }
                }
            },
            fr: {
                translation: {
                    greeting: {
                        morning: 'Bonjour',
                        afternoon: 'Bon Après-midi',
                        evening: 'Bonsoir',
                        chief: 'Chef'
                    },
                    stats: {
                        timezone: 'Fuseau horaire',
                        dayOfWeek: 'Jour de la semaine',
                        dayOfYear: "Jour de l'année",
                        weekNumber: 'Numéro de semaine'
                    },
                    button: {
                        more: 'PLUS',
                        less: 'MOINS'
                    }
                }
            },
            ar: {
                translation: {
                    greeting: {
                        morning: 'صباح الخير',
                        afternoon: 'مساء الخير',
                        evening: 'مساء الخير',
                        chief: 'القائد'
                    },
                    stats: {
                        timezone: 'المنطقة الزمنية',
                        dayOfWeek: 'يوم الأسبوع',
                        dayOfYear: 'يوم من السنة',
                        weekNumber: 'رقم الأسبوع'
                    },
                    button: {
                        more: 'المزيد',
                        less: 'أقل'
                    }
                }
            }
        }
    });

export default i18n;
