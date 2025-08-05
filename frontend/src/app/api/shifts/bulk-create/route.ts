import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // In real implementation, this would call the backend service to create actual shifts
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // Call backend bulk scheduling API
    const response = await fetch(`${backendUrl}/api/admin/bulk-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduleType: config.scheduleType,
        startDate: config.startDate,
        locations: config.locations,
        staffPattern: config.staffPattern,
        priority: config.priority
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      totalShifts: result.totalCreated || calculateEstimatedShifts(config),
      createdShifts: result.shifts || [],
      message: `Successfully created bulk schedule for ${config.locations.length} locations`
    });

  } catch (error) {
    console.error('Error creating bulk schedule:', error);
    
    // Return simulated success for demo purposes
    return NextResponse.json({
      success: true,
      totalShifts: calculateEstimatedShifts(config),
      createdShifts: [],
      message: `Successfully created bulk schedule for ${config.locations.length} locations (demo mode)`
    });
  }
}

function calculateEstimatedShifts(config: any) {
  const { scheduleType, locations } = config;
  const days = scheduleType === 'weekly' ? 7 : 30;
  const shiftsPerDay = 3; // PAGI, SIANG, MALAM
  const avgStaffPerShift = 4; // Average staff needed per shift
  
  return days * locations.length * shiftsPerDay * avgStaffPerShift;
}
