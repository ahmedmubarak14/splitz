import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set HTML dir attribute based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 rounded-full shadow-card"
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">Toggle language</span>
    </Button>
  );
};

export default LanguageToggle;
