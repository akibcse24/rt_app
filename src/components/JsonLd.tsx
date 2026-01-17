"use client";

import { useEffect } from "react";

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
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-routine-tracker", `schema-${index}`);
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

// Software Application Schema
export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Routine Tracker",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    description:
      "Build unbreakable discipline with AI-powered task management, goal tracking, and daily motivation.",
    featureList: [
      "AI-powered task management",
      "Focus timer with ambient sounds",
      "Goal tracking and milestones",
      "Achievements and gamification",
      "Analytics and insights",
      "Routine scheduling",
      "Leaderboard and competition",
      "Template marketplace",
    ],
    author: {
      "@type": "Organization",
      name: "Routine Tracker",
      url: "https://routinetracker.app",
    },
    publisher: {
      "@type": "Organization",
      name: "Routine Tracker",
      url: "https://routinetracker.app",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "1250",
    },
    screenshot: "https://routinetracker.app/og-image.jpg",
  };
}

// Organization Schema
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Routine Tracker",
    url: "https://routinetracker.app",
    logo: "https://routinetracker.app/logo.jpg",
    sameAs: [
      "https://twitter.com/routinetracker",
      "https://github.com/routinetracker",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@routinetracker.app",
      contactType: "customer support",
    },
  };
}

// WebSite Schema with Search
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Routine Tracker",
    url: "https://routinetracker.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://routinetracker.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Breadcrumb Schema
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// FAQ Schema
export function getFAQSchema(
  items: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
