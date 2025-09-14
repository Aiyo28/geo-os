import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    version: '1.0.0',
    availableAgents: [
      'product-strategy',
      'ui-ux-architect',
      'frontend-dev',
      'backend-security',
      'devops-infrastructure',
      'ios-developer'
    ],
    description: 'Multi-agent orchestration system for GeoOS Next'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectType = 'web', complexity = 5 } = body;

    if (action === 'orchestrate') {
      const projectId = `proj_${Date.now()}`;

      return NextResponse.json({
        success: true,
        projectId,
        plan: {
          phases: [
            { name: 'Strategy', duration: 30, agents: ['product-strategy'] },
            { name: 'Design', duration: 45, agents: ['ui-ux-architect'] },
            { name: 'Development', duration: 120, agents: ['frontend-dev', 'backend-security'] }
          ],
          totalEstimate: 195,
          status: 'planned'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}