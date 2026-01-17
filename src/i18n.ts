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
                        less: 'LESS',
                        confirm: 'Confirm',
                        override: 'Override',
                        change: 'Change',
                        setOverride: 'Set Override',
                        searching: 'Searching...',
                        initialize: 'Initialize Neural Link'
                    },
                    modal: {
                        satelliteUplink: 'Satellite Uplink Success',
                        searchCity: 'Search city or place',
                        searchPlaceholder: 'e.g. Tokyo, New York, Paris',
                        overrideFailed: 'Override failed. Please try again.',
                        enterCity: 'Enter a city or place name.'
                    },
                    system: {
                        booting: 'BOOTING OS...',
                        systemVersion: 'SYSTEM v2.0',
                        clockOS: 'CLOCK OS',
                        uplinkActive: 'Uplink active...',
                        system: 'System'
                    },
                    voice: {
                        overrideSuccess: 'System override successful. Location set to',
                        overrideFailed: 'Override failed. Satellite link unstable.',
                        systemSync: 'System synchronized. The time is',
                        proceedingOverride: 'Proceeding with manual override.',
                        externalUnavailable: 'Hello Chief. External services unavailable. Initializing local time.',
                        locationConfirm: 'Hello Chief. You are in'
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
                        less: 'MOINS',
                        confirm: 'Confirmer',
                        override: 'Remplacer',
                        change: 'Changer',
                        setOverride: 'Définir le remplacement',
                        searching: 'Recherche...',
                        initialize: 'Initialiser le lien neuronal'
                    },
                    modal: {
                        satelliteUplink: 'Succès de la liaison satellite',
                        searchCity: 'Rechercher une ville ou un lieu',
                        searchPlaceholder: 'ex. Tokyo, New York, Paris',
                        overrideFailed: 'Le remplacement a échoué. Veuillez réessayer.',
                        enterCity: 'Entrez un nom de ville ou de lieu.'
                    },
                    system: {
                        booting: 'DÉMARRAGE OS...',
                        systemVersion: 'SYSTÈME v2.0',
                        clockOS: 'HORLOGE OS',
                        uplinkActive: 'Liaison active...',
                        system: 'Système'
                    },
                    voice: {
                        overrideSuccess: 'Remplacement réussi. Emplacement défini sur',
                        overrideFailed: 'Le remplacement a échoué. Liaison satellite instable.',
                        systemSync: 'Système synchronisé. Il est',
                        proceedingOverride: 'Procéder avec remplacement manuel.',
                        externalUnavailable: 'Bonjour Chef. Services externes indisponibles. Initialisation de l\'heure locale.',
                        locationConfirm: 'Bonjour Chef. Vous êtes à'
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
                        less: 'أقل',
                        confirm: 'تأكيد',
                        override: 'تجاوز',
                        change: 'تغيير',
                        setOverride: 'تعيين التجاوز',
                        searching: 'جاري البحث...',
                        initialize: 'تهيئة الرابط العصبي'
                    },
                    modal: {
                        satelliteUplink: 'نجاح الارتباط بالأقمار الصناعية',
                        searchCity: 'ابحث عن مدينة أو مكان',
                        searchPlaceholder: 'مثال: طوكيو، نيويورك، باريس',
                        overrideFailed: 'فشل التجاوز. يرجى المحاولة مرة أخرى.',
                        enterCity: 'أدخل اسم مدينة أو مكان.'
                    },
                    system: {
                        booting: 'جاري تشغيل النظام...',
                        systemVersion: 'النظام الإصدار 2.0',
                        clockOS: 'نظام الساعة',
                        uplinkActive: 'الارتباط نشط...',
                        system: 'النظام'
                    },
                    voice: {
                        overrideSuccess: 'نجح التجاوز. تم تعيين الموقع إلى',
                        overrideFailed: 'فشل التجاوز. الارتباط بالأقمار الصناعية غير مستقر.',
                        systemSync: 'تمت مزامنة النظام. الوقت هو',
                        proceedingOverride: 'المتابعة مع التجاوز اليدوي.',
                        externalUnavailable: 'مرحباً أيها القائد. الخدمات الخارجية غير متاحة. تهيئة الوقت المحلي.',
                        locationConfirm: 'مرحباً أيها القائد. أنت في'
                    }
                }
            }
        }
    });

export default i18n;
