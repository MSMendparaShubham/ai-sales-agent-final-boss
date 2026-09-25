import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function clearDemoData() {
  console.log('🧹 Starting cleanup of all demo data...');

  try {
    // 1. Delete Voice & Call Records
    console.log('Clearing transcripts, calls, callbacks, and meeting bookings...');
    await prisma.transcript.deleteMany();
    await prisma.call.deleteMany();
    await prisma.callback.deleteMany();
    await prisma.meetingBooking.deleteMany();

    // 2. Delete Intelligence, Recommendations, and Scoring
    console.log('Clearing recommendations, qualifications, and decision traces...');
    await prisma.recommendation.deleteMany();
    await prisma.qualification.deleteMany();
    await prisma.aIDecisionTrace.deleteMany();
    await prisma.marketSignal.deleteMany();

    // 3. Delete Activity Logs & Notifications
    console.log('Clearing activity logs, notifications, and security events...');
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.securityEvent.deleteMany();
    await prisma.fraudSignal.deleteMany();

    // 4. Delete Leads, Requirements, and Campaigns
    console.log('Clearing lead import rows, leads, requirements, and campaigns...');
    await prisma.leadImportRow.deleteMany();
    await prisma.leadImport.deleteMany();
    await prisma.discoveryJob.deleteMany();
    await prisma.requirement.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.leadSource.deleteMany();

    // 5. Delete Companies
    console.log('Clearing companies...');
    await prisma.company.deleteMany();

    // 6. Delete Knowledge Documents
    console.log('Clearing knowledge documents...');
    await prisma.knowledgeDocument.deleteMany();

    console.log('✅ Successfully removed all demo records!');
    console.log('Your database is now clean and ready for real production leads and campaigns.');
  } catch (error) {
    console.error('❌ Error during demo data cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDemoData();
