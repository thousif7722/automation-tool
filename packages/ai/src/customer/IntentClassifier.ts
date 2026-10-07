import { CustomerIntent } from '@insta-automation/types';

export interface IntentClassificationResult {
  intent: CustomerIntent;
  confidence: number;
  explanation: string;
}

export class IntentClassifier {
  public static classify(message: string): IntentClassificationResult {
    const text = message.toLowerCase().trim();

    // 1. Human agent request
    if (
      text.includes('human') ||
      text.includes('agent') ||
      text.includes('person') ||
      text.includes('representative') ||
      text.includes('real person') ||
      text.includes('talk to someone') ||
      text.includes('customer service') ||
      text.includes('support team')
    ) {
      return {
        intent: 'human_request',
        confidence: 0.98,
        explanation: 'Customer explicitly requested to communicate with a human agent.',
      };
    }

    // 2. Complaint
    if (
      text.includes('horrible') ||
      text.includes('scam') ||
      text.includes('sue') ||
      text.includes('terrible') ||
      text.includes('disappointed') ||
      text.includes('broken') ||
      text.includes('waste of money') ||
      text.includes('report you') ||
      text.includes('attorney') ||
      text.includes('lawyer') ||
      text.includes('manager')
    ) {
      return {
        intent: 'complaint',
        confidence: 0.95,
        explanation: 'Strong complaint signals or high-risk legal/angry language detected.',
      };
    }

    // 3. Refund request
    if (
      text.includes('refund') ||
      text.includes('money back') ||
      text.includes('cancel my order') ||
      text.includes('return my item') ||
      text.includes('chargeback')
    ) {
      return {
        intent: 'refund',
        confidence: 0.94,
        explanation: 'Customer requested a financial refund or order cancellation.',
      };
    }

    // 4. Pricing inquiry
    if (
      text.includes('price') ||
      text.includes('cost') ||
      text.includes('how much') ||
      text.includes('pricing') ||
      text.includes('rates') ||
      text.includes('discount') ||
      text.includes('promo')
    ) {
      return {
        intent: 'pricing',
        confidence: 0.92,
        explanation: 'Inquiry regarding product or service pricing.',
      };
    }

    // 5. Booking / Appointment
    if (
      text.includes('book') ||
      text.includes('appointment') ||
      text.includes('schedule') ||
      text.includes('reserve') ||
      text.includes('consultation') ||
      text.includes('demo slot')
    ) {
      return {
        intent: 'booking',
        confidence: 0.90,
        explanation: 'Customer seeking to schedule an appointment or booking.',
      };
    }

    // 6. Product Availability / Stock
    if (
      text.includes('in stock') ||
      text.includes('available') ||
      text.includes('do you have') ||
      text.includes('size available') ||
      text.includes('when will you restock')
    ) {
      return {
        intent: 'availability',
        confidence: 0.88,
        explanation: 'Inquiry regarding product stock or service availability.',
      };
    }

    // 7. Sales Lead / Purchase intent
    if (
      text.includes('buy') ||
      text.includes('purchase') ||
      text.includes('order') ||
      text.includes('want to get') ||
      text.includes('interested in') ||
      text.includes('checkout')
    ) {
      return {
        intent: 'sales',
        confidence: 0.86,
        explanation: 'Active purchase intent or lead qualification signal.',
      };
    }

    // 8. Customer Support
    if (
      text.includes('help') ||
      text.includes('issue') ||
      text.includes('problem') ||
      text.includes('tracking') ||
      text.includes('where is my') ||
      text.includes('not working') ||
      text.includes('status')
    ) {
      return {
        intent: 'support',
        confidence: 0.85,
        explanation: 'General technical or order support inquiry.',
      };
    }

    // 9. Spam detection
    if (
      text.includes('win $1000') ||
      text.includes('crypto promo') ||
      text.includes('click link below') ||
      text.includes('free followers')
    ) {
      return {
        intent: 'spam',
        confidence: 0.99,
        explanation: 'Commercial spam or malicious link detected.',
      };
    }

    // 10. General Question
    if (text.includes('where') || text.includes('what') || text.includes('hours') || text.includes('location') || text.includes('hi') || text.includes('hello')) {
      return {
        intent: 'general_question',
        confidence: 0.80,
        explanation: 'Standard informational greeting or location query.',
      };
    }

    // Default unknown / ambiguous (low confidence)
    return {
      intent: 'unknown',
      confidence: 0.45,
      explanation: 'Ambiguous or unrecognized customer message.',
    };
  }
}
