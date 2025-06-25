import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // Try to find entity by slug first, then by googleKgId
  let entity = await prisma.scaryEntity.findUnique({
    where: { slug: decodeURIComponent(id) },
    include: {
      analysis: {
        include: {
          dimensionScores: {
            include: {
              dimension: true
            }
          }
        }
      }
    }
  });

  if (!entity) {
    entity = await prisma.scaryEntity.findUnique({
      where: { googleKgId: decodeURIComponent(id) },
      include: {
        analysis: {
          include: {
            dimensionScores: {
              include: {
                dimension: true
              }
            }
          }
        }
      }
    });
  }

  if (!entity) {
    return {
      title: 'Entity Not Found | How Scary',
      description: 'The requested entity could not be found in our scary database.',
    };
  }

  // Calculate average AI score if analysis exists
  let averageScore = null;
  if (entity.analysis && entity.analysis.dimensionScores.length > 0) {
    const totalScore = entity.analysis.dimensionScores.reduce((sum, score) => sum + score.score, 0);
    averageScore = Math.round((totalScore / entity.analysis.dimensionScores.length) * 10) / 10;
  }

  const title = `How Scary is ${entity.name}? | Scary Score: ${averageScore || 'Analyzing...'}`;
  const description = entity.analysis 
    ? `${entity.name} has a scary score of ${averageScore}/10. ${entity.analysis.whyScary.substring(0, 150)}...`
    : `Discover how scary ${entity.name} is. Our AI analyzes horror elements, jump scares, psychological terror, and more to give you a comprehensive scary rating.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: entity.imageUrl ? [entity.imageUrl] : undefined,
      type: 'article',
      siteName: 'How Scary',
      url: `https://howscary.com/wiki/${entity.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: entity.imageUrl ? [entity.imageUrl] : undefined,
    },
    keywords: [
      `how scary is ${entity.name}`,
      `${entity.name} scary rating`,
      `${entity.name} horror analysis`,
      'scary score',
      'horror rating',
      'fear factor',
      entity.entityType.toLowerCase(),
      entity.name,
    ],
    alternates: {
      canonical: `https://howscary.com/wiki/${entity.slug}`,
    },
  };
}

export default function WikiLayout({ children }: Props) {
  return children;
}