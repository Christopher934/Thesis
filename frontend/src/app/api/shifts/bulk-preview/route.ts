import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Simulate preview generation
    // In real implementation, this would call the backend service
    const previewData = {
      totalShifts: calculateEstimatedShifts(config),
      successRate: 100,
      conflicts: 0,
      estimatedAssignments: generatePreviewAssignments(config),
      recommendations: [
        'All assignments optimized successfully',
        'Workload distributed evenly',
        'No scheduling conflicts detected'
      ]
    };

    return NextResponse.json(previewData);
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

function calculateEstimatedShifts(config: any) {
  const { scheduleType, locations } = config;
  const days = scheduleType === 'weekly' ? 7 : 30;
  const shiftsPerDay = 3; // PAGI, SIANG, MALAM
  const avgStaffPerShift = 4; // Average staff needed per shift
  
  return days * locations.length * shiftsPerDay * avgStaffPerShift;
}

function generatePreviewAssignments(config: any) {
  const { locations, startDate } = config;
  const assignments = [];
  
  // Generate sample assignments for preview
  for (const location of locations) {
    assignments.push({
      location,
      shifts: [
        { type: 'PAGI', count: 4, time: '06:00-14:00' },
        { type: 'SIANG', count: 4, time: '14:00-22:00' },
        { type: 'MALAM', count: 3, time: '22:00-06:00' }
      ]
    });
  }
  
  return assignments;
}
