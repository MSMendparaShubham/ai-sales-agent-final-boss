import { prisma } from '../db/prisma';
import { createNotification } from '../notifications';

interface VoiceBudgetConfig {
  maxSessionSeconds: number;
  dailySessionLimitSeconds: number;
  monthlySessionLimitSeconds: number;
}

export function getVoiceBudgetConfig(): VoiceBudgetConfig {
  return {
    maxSessionSeconds: parseInt(process.env.VOICE_MAX_SESSION_SECONDS || '600', 10), // 10 minutes max per call
    dailySessionLimitSeconds: parseInt(process.env.VOICE_DAILY_SESSION_LIMIT || '3600', 10), // 1 hour per day
    monthlySessionLimitSeconds: parseInt(process.env.VOICE_MONTHLY_SESSION_LIMIT || '36000', 10) // 10 hours per month
  };
}

export async function checkVoiceBudget(workspaceId: string): Promise<{
  allowed: boolean;
  reason?: string;
  config: VoiceBudgetConfig;
}> {
  const provider = process.env.VOICE_AI_PROVIDER || 'gemini';
  
  if (provider !== 'gemini' && !(provider === 'demo' && process.env.DEMO_MODE === 'true')) {
    // Hard AI safety block
    return {
      allowed: false,
      reason: 'PROVIDER_BLOCKED: IntentOS is configured to strictly enforce $0 AI cost. Only Gemini Live or Demo providers are permitted.',
      config: getVoiceBudgetConfig()
    };
  }

  const config = getVoiceBudgetConfig();
  const now = new Date();
  
  const billingPeriodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayPeriodId = `${billingPeriodId}-${String(now.getDate()).padStart(2, '0')}`;

  // Check Monthly Usage
  const monthlyUsageRecords = await prisma.usageLedger.findMany({
    where: {
      workspaceId,
      billingPeriodId,
      type: 'VOICE_SECONDS'
    }
  });
  const monthlyUsed = monthlyUsageRecords.reduce((sum, r) => sum + r.amount, 0);

  if (monthlyUsed >= config.monthlySessionLimitSeconds) {
    return { allowed: false, reason: 'MONTHLY_LIMIT_EXCEEDED', config };
  }

  // Check Daily Usage (stored with a day-specific suffix or we filter by date)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyUsageRecords = await prisma.usageLedger.findMany({
    where: {
      workspaceId,
      billingPeriodId,
      type: 'VOICE_SECONDS',
      createdAt: { gte: todayStart }
    }
  });
  const dailyUsed = dailyUsageRecords.reduce((sum, r) => sum + r.amount, 0);

  if (dailyUsed >= config.dailySessionLimitSeconds) {
    return { allowed: false, reason: 'DAILY_LIMIT_EXCEEDED', config };
  }

  // Warn if approaching daily limit (80%)
  if (dailyUsed >= config.dailySessionLimitSeconds * 0.8) {
    await createNotification(
      workspaceId,
      'USAGE_LIMIT',
      'Daily Voice Budget Approaching',
      `You have used ${Math.round((dailyUsed / config.dailySessionLimitSeconds) * 100)}% of your daily free Gemini Live budget.`,
      'WARNING'
    );
  }

  return { allowed: true, config };
}

export async function persistVoiceSessionUsage(workspaceId: string, durationSeconds: number) {
  const now = new Date();
  const billingPeriodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  await prisma.usageLedger.create({
    data: {
      workspaceId,
      billingPeriodId,
      type: 'VOICE_SECONDS',
      amount: durationSeconds,
      description: 'Gemini Live Session Audio Usage'
    }
  });

  // Also convert to minutes for standard reporting if needed, but seconds is more accurate
}
