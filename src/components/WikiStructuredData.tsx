import Script from 'next/script';

interface WikiStructuredDataProps {
  entity: {
    name: string;
    description?: string;
    imageUrl?: string;
    types: string[];
  };
  averageAIScore?: number | null;
  averageUserScore?: number | null;
  totalRatings?: number;
  analysis?: {
    whyScary: string;
  };
}

export function WikiStructuredData({ 
  entity, 
  averageAIScore, 
  averageUserScore,
  totalRatings,
  analysis 
}: WikiStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `How Scary is ${entity.name}?`,
    "description": entity.description || `Scary analysis of ${entity.name}`,
    "image": entity.imageUrl,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "How Scary"
    },
    "publisher": {
      "@type": "Organization",
      "name": "How Scary",
      "logo": {
        "@type": "ImageObject",
        "url": "https://howscary.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://howscary.com/wiki/${encodeURIComponent(entity.name.toLowerCase().replace(/\s+/g, '-'))}`
    },
    ...(averageAIScore && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageUserScore || averageAIScore,
        "bestRating": "10",
        "worstRating": "0",
        "ratingCount": totalRatings || 1,
        "reviewCount": totalRatings || 1
      }
    }),
    ...(analysis && {
      "articleBody": analysis.whyScary
    })
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}