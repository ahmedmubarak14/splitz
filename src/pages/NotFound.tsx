import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`text-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <h1 className="mb-4 text-4xl font-bold text-foreground">{t('notFound.title')}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('notFound.message')}</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          {t('notFound.returnHome')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
