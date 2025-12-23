import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export default function StructuredData() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  const currentLang = i18n.language;
  const baseUrl = 'https://meditime-app.com';
  
  // Navigation sitelinks for Google
  const siteNavigationElements = [
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": t('navigation.login'),
      "url": `${baseUrl}/${currentLang}/login`
    },
    {
      "@context": "https://schema.org", 
      "@type": "SiteNavigationElement",
      "name": t('navigation.register'),
      "url": `${baseUrl}/${currentLang}/register`
    },
    // ...about et help supprimés car routes inexistantes
  ];

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": t('app.name'),
    "url": baseUrl
    // SearchAction retiré car la route /search n'existe pas
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": t('app.name'),
    "url": baseUrl,
    "logo": `${baseUrl}/icons/icon-192x192.png`,
    "description": t('app.description'),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "availableLanguage": ["French", "English", "Spanish", "German", "Italian", "Japanese", "Chinese", "Portuguese", "Russian"]
    }
  };

  // Breadcrumbs pour les pages internes
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": t('app.name'),
          "item": `${baseUrl}/${currentLang}`
        }
      ]
    };

    if (pathSegments.length > 1) {
      pathSegments.slice(1).forEach((segment, index) => {
        breadcrumbs.itemListElement.push({
          "@type": "ListItem",
          "position": index + 2,
          "name": t(`navigation.${segment}`, segment),
          "item": `${baseUrl}/${pathSegments.slice(0, index + 2).join('/')}`
        });
      });
    }

    return breadcrumbs;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSite)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization)
        }}
      />
      {siteNavigationElements.map((element, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(element)
          }}
        />
      ))}
      {location.pathname !== `/${currentLang}` && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbs())
          }}
        />
      )}
    </>
  );
}
