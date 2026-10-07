import { CustomerIntent, EscalationReason } from '@insta-automation/types';
import { IntentClassificationResult } from './IntentClassifier';
import { RetrievedKnowledge } from '../knowledge/KnowledgeStore';

export interface EscalationEvaluationResult {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  explanation?: string;
}

export class EscalationEvaluator {
  public static evaluate(
    intentResult: IntentClassificationResult,
    retrievedKnowledge: RetrievedKnowledge[],
    customerMessage: string
  ): EscalationEvaluationResult {
    const textLower = customerMessage.toLowerCase();

    // 1. Explicit Human Request
    if (intentResult.intent === 'human_request') {
      return {
        shouldEscalate: true,
        reason: 'HUMAN_REQUESTED',
        explanation: 'Customer explicitly asked to speak with a human agent.',
      };
    }

    // 2. High-Risk Complaint
    if (
      intentResult.intent === 'complaint' ||
      textLower.includes('sue') ||
      textLower.includes('scam') ||
      textLower.includes('attorney') ||
      textLower.includes('legal action') ||
      textLower.includes('report to bbb') ||
      textLower.includes('fraud')
    ) {
      return {
        shouldEscalate: true,
        reason: 'HIGH_RISK_COMPLAINT',
        explanation: 'Message classified as a high-risk complaint or legal dispute.',
      };
    }

    // 3. Policy Requires Human (e.g. Refunds, Custom Contract Overrides)
    if (intentResult.intent === 'refund') {
      return {
        shouldEscalate: true,
        reason: 'POLICY_REQUIRES_HUMAN',
        explanation: 'Financial refund processing requires human supervisor validation.',
      };
    }

    // 4. Low Confidence Classification
    if (intentResult.confidence < 0.65 || intentResult.intent === 'unknown') {
      return {
        shouldEscalate: true,
        reason: 'LOW_CONFIDENCE',
        explanation: `AI intent classification confidence is low (${Math.round(intentResult.confidence * 100)}%).`,
      };
    }

    // 5. AI Cannot Answer Reliably (No matching business knowledge or missing context)
    const topKnowledgeScore = retrievedKnowledge.length > 0 ? Math.max(...retrievedKnowledge.map((k) => k.score)) : 0;
    if (retrievedKnowledge.length === 0 || topKnowledgeScore < 0.3) {
      // For general greetings, no knowledge is fine; for complex queries, missing knowledge escalates.
      if (intentResult.intent !== 'general_question' && intentResult.intent !== 'sales') {
        return {
          shouldEscalate: true,
          reason: 'UNRELIABLE_ANSWER',
          explanation: 'Insufficient ground-truth business knowledge found to answer query accurately.',
        };
      }
    }

    return {
      shouldEscalate: false,
    };
  }
}
