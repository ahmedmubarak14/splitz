import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, listOutline, flash, wallet, trophy } from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NativeMobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { path: '/dashboard', icon: home, label: t('nav.dashboard') },
    { path: '/tasks', icon: listOutline, label: t('nav.tasks') },
    { path: '/focus', icon: flash, label: t('nav.focus') },
    { path: '/expenses', icon: wallet, label: t('nav.expenses') },
    { path: '/challenges', icon: trophy, label: t('nav.challenges') },
  ];

  return (
    <IonTabBar slot="bottom" className="native-tab-bar">
      {tabs.map((tab) => (
        <IonTabButton
          key={tab.path}
          tab={tab.path}
          selected={location.pathname === tab.path}
          onClick={(e) => {
            e.preventDefault();
            navigate(tab.path);
          }}
        >
          <IonIcon icon={tab.icon} />
          <IonLabel>{tab.label}</IonLabel>
        </IonTabButton>
      ))}
    </IonTabBar>
  );
};
