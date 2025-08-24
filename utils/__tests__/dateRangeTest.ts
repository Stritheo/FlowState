// Simple test to verify Australian timezone date calculations work correctly
// This can be run manually to test the date range logic

export function testAustralianTimezone() {
  // Simulate the date range calculation logic from database service
  const now = new Date();
  const australianNow = new Date(now.toLocaleString("en-US", {timeZone: "Australia/Sydney"}));
  
  const today = australianNow.toISOString().split('T')[0];
  
  // Week calculation (past 7 days including today)
  const weekAgo = new Date(australianNow);
  weekAgo.setDate(weekAgo.getDate() - 6); // 6 days ago + today = 7 days
  const weekStartDate = weekAgo.toISOString().split('T')[0];
  
  // Month calculation (past 30 days including today)
  const monthAgo = new Date(australianNow);
  monthAgo.setDate(monthAgo.getDate() - 29); // 29 days ago + today = 30 days
  const monthStartDate = monthAgo.toISOString().split('T')[0];
  
  console.log('Date Range Test Results:');
  console.log('Today:', today);
  console.log('Week range:', weekStartDate, 'to', today);
  console.log('Month range:', monthStartDate, 'to', today);
  
  // Calculate days between dates to verify
  const weekDays = Math.ceil((australianNow.getTime() - weekAgo.getTime()) / (1000 * 3600 * 24)) + 1;
  const monthDays = Math.ceil((australianNow.getTime() - monthAgo.getTime()) / (1000 * 3600 * 24)) + 1;
  
  console.log('Week days count:', weekDays, '(should be 7)');
  console.log('Month days count:', monthDays, '(should be 30)');
  
  return {
    today,
    weekRange: { start: weekStartDate, end: today, days: weekDays },
    monthRange: { start: monthStartDate, end: today, days: monthDays }
  };
}

// Uncomment to run test
// testAustralianTimezone();