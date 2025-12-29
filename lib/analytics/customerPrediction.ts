/**
 * PREDICTIVE ANALYTICS ALGORITHM
 * Core differentiator for BALIK.LAGI x Barbershop
 * 
 * This algorithm predicts when a customer will likely visit next
 * based on their historical visit patterns and behavior.
 */

import { format, differenceInDays, addDays, parseISO } from 'date-fns';

export interface CustomerVisitHistory {
  customer_phone: string;
  customer_name: string;
  total_visits: number;
  first_visit_date: string;
  last_visit_date?: string;
  average_days_between_visits?: number;
  visit_dates: string[]; // Array of visit dates
  total_revenue: number;
  average_atv: number;
}

export interface PredictionResult {
  customer_phone: string;
  customer_name: string;
  predicted_next_visit: string; // ISO date string
  confidence_score: number; // 0-100
  days_until_visit: number;
  churn_risk: 'low' | 'medium' | 'high';
  recommendation: string;
  visit_pattern: 'regular' | 'irregular' | 'new' | 'churned';
}

/**
 * Calculate average days between visits
 */
function calculateAverageDaysBetweenVisits(visitDates: string[]): number {
  if (visitDates.length < 2) return 30; // Default for new customers
  
  const sortedDates = visitDates
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  
  let totalDays = 0;
  for (let i = 1; i < sortedDates.length; i++) {
    totalDays += differenceInDays(sortedDates[i], sortedDates[i - 1]);
  }
  
  return Math.round(totalDays / (sortedDates.length - 1));
}

/**
 * Calculate visit pattern regularity
 * Returns coefficient of variation (CV) - lower is more regular
 */
function calculateVisitRegularity(visitDates: string[]): number {
  if (visitDates.length < 3) return 1; // Not enough data
  
  const sortedDates = visitDates
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    intervals.push(differenceInDays(sortedDates[i], sortedDates[i - 1]));
  }
  
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation
  return mean === 0 ? 1 : stdDev / mean;
}

/**
 * Calculate confidence score based on multiple factors
 */
function calculateConfidenceScore(
  totalVisits: number,
  visitRegularity: number,
  daysSinceLastVisit: number,
  averageDaysBetweenVisits: number
): number {
  // Base confidence from visit count
  let confidence = Math.min(totalVisits * 10, 50); // Max 50 from visits
  
  // Add confidence from regularity (inverse of CV)
  const regularityScore = Math.max(0, 30 - (visitRegularity * 30));
  confidence += regularityScore;
  
  // Adjust confidence based on how close we are to predicted date
  const daysRatio = daysSinceLastVisit / averageDaysBetweenVisits;
  if (daysRatio >= 0.8 && daysRatio <= 1.2) {
    confidence += 20; // Very close to expected pattern
  } else if (daysRatio >= 0.6 && daysRatio <= 1.4) {
    confidence += 10; // Somewhat close
  }
  
  return Math.min(Math.round(confidence), 100);
}

/**
 * Calculate churn risk
 */
function calculateChurnRisk(
  daysSinceLastVisit: number,
  averageDaysBetweenVisits: number
): 'low' | 'medium' | 'high' {
  const ratio = daysSinceLastVisit / averageDaysBetweenVisits;
  
  if (ratio < 1.2) return 'low';
  if (ratio < 2.0) return 'medium';
  return 'high';
}

/**
 * Determine visit pattern
 */
function determineVisitPattern(
  totalVisits: number,
  visitRegularity: number,
  daysSinceLastVisit: number,
  averageDaysBetweenVisits: number
): 'regular' | 'irregular' | 'new' | 'churned' {
  if (totalVisits === 1) return 'new';
  if (daysSinceLastVisit > averageDaysBetweenVisits * 3) return 'churned';
  if (visitRegularity < 0.3) return 'regular';
  return 'irregular';
}

/**
 * Generate recommendation
 */
function generateRecommendation(
  visitPattern: 'regular' | 'irregular' | 'new' | 'churned',
  churnRisk: 'low' | 'medium' | 'high',
  daysUntilVisit: number
): string {
  if (visitPattern === 'churned') {
    return '🚨 Customer mungkin sudah churn. Kirim promo comeback atau hubungi langsung.';
  }
  
  if (churnRisk === 'high') {
    return '⚠️ Risiko churn tinggi! Kirim reminder atau promo khusus untuk retention.';
  }
  
  if (churnRisk === 'medium') {
    return '📲 Waktu yang tepat untuk mengirim reminder atau promo.';
  }
  
  if (daysUntilVisit <= 3) {
    return '✅ Customer kemungkinan akan datang dalam 1-3 hari ke depan. Pastikan slot tersedia!';
  }
  
  if (daysUntilVisit <= 7) {
    return '📅 Customer diprediksi datang minggu ini. Monitor availability.';
  }
  
  if (visitPattern === 'regular') {
    return '💚 Customer loyal dengan pola kunjungan teratur. Maintain quality service!';
  }
  
  return '📊 Monitor pola kunjungan customer untuk insight lebih baik.';
}

/**
 * Main prediction function
 * Predicts when a customer will likely visit next
 */
export function predictCustomerNextVisit(customer: CustomerVisitHistory): PredictionResult {
  const {
    customer_phone,
    customer_name,
    total_visits,
    last_visit_date,
    visit_dates,
  } = customer;
  
  // Calculate metrics
  const avgDaysBetweenVisits = calculateAverageDaysBetweenVisits(visit_dates);
  const visitRegularity = calculateVisitRegularity(visit_dates);
  
  // Calculate days since last visit
  const lastVisit = last_visit_date ? parseISO(last_visit_date) : parseISO(visit_dates[visit_dates.length - 1]);
  const today = new Date();
  const daysSinceLastVisit = differenceInDays(today, lastVisit);
  
  // Predict next visit date
  const predictedDate = addDays(lastVisit, avgDaysBetweenVisits);
  const daysUntilVisit = differenceInDays(predictedDate, today);
  
  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(
    total_visits,
    visitRegularity,
    daysSinceLastVisit,
    avgDaysBetweenVisits
  );
  
  // Calculate churn risk
  const churnRisk = calculateChurnRisk(daysSinceLastVisit, avgDaysBetweenVisits);
  
  // Determine visit pattern
  const visitPattern = determineVisitPattern(
    total_visits,
    visitRegularity,
    daysSinceLastVisit,
    avgDaysBetweenVisits
  );
  
  // Generate recommendation
  const recommendation = generateRecommendation(visitPattern, churnRisk, daysUntilVisit);
  
  return {
    customer_phone,
    customer_name,
    predicted_next_visit: format(predictedDate, 'yyyy-MM-dd'),
    confidence_score: confidenceScore,
    days_until_visit: daysUntilVisit,
    churn_risk: churnRisk,
    recommendation,
    visit_pattern: visitPattern,
  };
}

/**
 * Batch prediction for multiple customers
 * Returns customers sorted by predicted visit date (nearest first)
 */
export function predictMultipleCustomers(
  customers: CustomerVisitHistory[]
): PredictionResult[] {
  const predictions = customers.map(predictCustomerNextVisit);
  
  // Sort by days until visit (ascending) - customers predicted to come soon first
  return predictions.sort((a, b) => a.days_until_visit - b.days_until_visit);
}

/**
 * Filter customers by upcoming visits within N days
 */
export function getUpcomingVisits(
  customers: CustomerVisitHistory[],
  withinDays: number = 7
): PredictionResult[] {
  const predictions = predictMultipleCustomers(customers);
  return predictions.filter(p => 
    p.days_until_visit >= 0 && 
    p.days_until_visit <= withinDays &&
    p.visit_pattern !== 'churned'
  );
}

/**
 * Get customers at risk of churning
 */
export function getChurnRiskCustomers(
  customers: CustomerVisitHistory[]
): PredictionResult[] {
  const predictions = predictMultipleCustomers(customers);
  return predictions.filter(p => 
    p.churn_risk === 'high' || 
    p.visit_pattern === 'churned'
  );
}
