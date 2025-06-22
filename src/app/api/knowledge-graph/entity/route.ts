import { NextRequest, NextResponse } from 'next/server';
import { knowledgeGraphService } from '@/services/knowledge-graph';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  try {
    const entity = await knowledgeGraphService.getEntityById(id);

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if entity is suitable for our scary wiki
    if (!knowledgeGraphService.isSuitableForScaryWiki(entity)) {
      return NextResponse.json(
        { error: 'Entity is not suitable for scary wiki' },
        { status: 403 }
      );
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error('Knowledge Graph entity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}