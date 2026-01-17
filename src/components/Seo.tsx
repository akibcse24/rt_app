"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Metadata } from 'next';

// ============================================================================
// STRUCTURED DATA (JSON-LD) COMPONENTS
// ============================================================================

interface JsonLdProps {
  data: Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    // Remove any existing JSON-LD scripts for this component
    const existingScripts = document.querySelectorAll(
      'script[type="application/ld+json"][data-routine-tracker]'
    );
    existingScripts.forEach((script) => script.remove());

    // Create and insert new JSON-LD script
    data.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-routine-tracker', `schema-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      const existingScripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-routine-tracker]'
      );
      existingScripts.forEach((script) => script.remove());
    };
  }, [data]);

  return null;
}

// ============================================================================
// SEO COMPONENTS FOR PAGES
// ============================================================================

interface PageSeoProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonicalUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export function generatePageSeo({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.jpg',
  noIndex = false,
  noFollow = false,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  authors = ['Routine Tracker Team'],
  section,
  tags = [],
}: PageSeoProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fullTitle = `${title} | Routine Tracker`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl || baseUrl,
      title: fullTitle,
      description,
      siteName: 'Routine Tracker',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`],
      creator: '@routinetracker',
    },
    alternates: {
      canonical: canonicalUrl || baseUrl,
    },
  };

  // Add article-specific metadata if provided
  if (publishedTime || modifiedTime || authors.length > 0 || section || tags.length > 0) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: publishedTime || modifiedTime,
      modifiedTime: modifiedTime || publishedTime,
      authors: authors.length > 0 ? authors : undefined,
      section,
      tags,
    };
  }

  return metadata;
}

// ============================================================================
// SCHEMA ORG COMPONENTS
// ============================================================================

export function getSoftwareApplicationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Routine Tracker',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    description: 'Build unbreakable discipline with AI-powered task management, goal tracking, and daily motivation.',
    featureList: [
      'AI-powered task management',
      'Focus timer with ambient sounds',
      'Goal tracking and milestones',
      'Achievements and gamification',
      'Analytics and insights',
      'Routine scheduling',
      'Leaderboard and competition',
      'Template marketplace',
    ],
    author: {
      '@type': 'Organization',
      name: 'Routine Tracker',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Routine Tracker',
      url: baseUrl,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: '1250',
    },
    screenshot: `${baseUrl}/og-image.jpg`,
  };
}

export function getOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Routine Tracker',
    url: baseUrl,
    logo: `${baseUrl}/logo.jpg`,
    sameAs: [
      'https://twitter.com/routinetracker',
      'https://github.com/routinetracker',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@routinetracker.app',
      contactType: 'customer support',
    },
  };
}

export function getWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Routine Tracker',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFAQSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ============================================================================
// SEO PROVIDER COMPONENT
// ============================================================================

interface SeoProviderProps {
  children: React.ReactNode;
  additionalSchemas?: Record<string, unknown>[];
}

export function SeoProvider({ children, additionalSchemas = [] }: SeoProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  const schemas = [
    getSoftwareApplicationSchema(),
    getOrganizationSchema(),
    getWebsiteSchema(),
    ...additionalSchemas,
  ];

  return (
    <>
      <JsonLd data={schemas} />
      {children}
    </>
  );
}

// ============================================================================
// PERFORMANCE MONITORING COMPONENT
// ============================================================================

interface PerformanceLayoutShift {
  hadRecentInput: boolean;
  value: number;
  sources?: Array<{ node?: HTMLElement }>;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    fcp: number | null;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

    // Largest Contentful Paint (observer)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lcp = entries[entries.length - 1];
        setMetrics((prev) => ({ ...prev!, lcp: lcp.startTime }));
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (observer)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const firstInput = entries[0] as PerformanceEventTiming;
        const fid = firstInput.processingStart - firstInput.startTime;
        setMetrics((prev) => ({ ...prev!, fid }));
      }
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (observer)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as PerformanceEntry[]) {
        if ('hadRecentInput' in entry) {
          const layoutShift = entry as unknown as PerformanceLayoutShift;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
      }
      setMetrics((prev) => ({ ...prev!, cls: clsValue }));
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS not supported
    }

    setMetrics({
      fcp: fcp?.startTime || null,
      lcp: null,
      fid: null,
      cls: 0,
    });

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // Log metrics to console in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics) {
      console.log('Core Web Vitals:', {
        FCP: metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A',
        LCP: metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A',
        FID: metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A',
        CLS: metrics.cls?.toFixed(4) || 'N/A',
      });
    }
  }, [metrics]);

  return null; // This is a monitoring component, doesn't render anything
}

// ============================================================================
// EXPORTS
// ============================================================================
// All functions and components are already exported at their definition sites
// No additional exports needed here
