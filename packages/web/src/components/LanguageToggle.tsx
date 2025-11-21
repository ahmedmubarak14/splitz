import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set HTML dir attribute based on language
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language === 'en' ? 'EN' : 'AR';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-all gap-2 min-w-[70px]"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-semibold">{currentLang}</span>
    </Button>
  );
};

export default LanguageToggle;
