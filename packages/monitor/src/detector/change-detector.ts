import { createDiff } from 'diff';
import {
  createModuleLogger,
  calculateSimilarity,
  CRITICAL_KEYWORDS,
  IMPORTANT_KEYWORDS,
  ChangeType,
  Priority,
  ChangeComparisonResult,
  FormField
} from '@boat-monitor/shared';

const logger = createModuleLogger('ChangeDetector');

export class ChangeDetector {
  async detectChanges(
    previousHtml: string | null,
    currentHtml: string,
    currentNormalizedHtml: string
  ): Promise<ChangeComparisonResult> {
    // First check
    if (!previousHtml) {
      logger.info('First check - no previous HTML');
      return {
        hasChanged: false,
        type: null,
        priority: Priority.INFO,
        confidence: 1.0,
        description: 'Initial check - no previous data'
      };
    }

    logger.info('Analyzing content for changes');

    // Check for form detection first (highest priority)
    const formDetection = this.detectForms(currentHtml);
    if (formDetection.detected) {
      logger.info('Form detected!', { type: formDetection.type });
      return {
        hasChanged: true,
        type: ChangeType.FORM_DETECTED,
        priority: Priority.CRITICAL,
        confidence: formDetection.confidence,
        description: `${formDetection.type} form detected on page`,
        diff: this.generateDiff(previousHtml, currentHtml)
      };
    }

    // Check for critical keywords
    const keywordMatch = this.detectKeywords(currentNormalizedHtml);
    if (keywordMatch.matched) {
      logger.warn('Critical keywords detected!', { keywords: keywordMatch.keywords });
      return {
        hasChanged: true,
        type: ChangeType.KEYWORD_MATCH,
        priority: keywordMatch.priority,
        confidence: keywordMatch.confidence,
        description: keywordMatch.description,
        matchedKeywords: keywordMatch.keywords,
        diff: this.generateDiff(previousHtml, currentHtml)
      };
    }

    // Calculate content similarity
    const similarity = calculateSimilarity(previousHtml, currentNormalizedHtml);
    const hasSignificantChange = similarity < 0.95; // 95% similarity threshold

    if (hasSignificantChange) {
      logger.info('Content change detected', { similarity });
      return {
        hasChanged: true,
        type: ChangeType.CONTENT,
        priority: Priority.INFO,
        confidence: 1 - similarity,
        description: `Content changed (${Math.round((1 - similarity) * 100)}% difference)`,
        diff: this.generateDiff(previousHtml, currentHtml)
      };
    }

    logger.info('No significant changes detected', { similarity });
    return {
      hasChanged: false,
      type: null,
      priority: Priority.INFO,
      confidence: 0,
      description: 'No significant changes detected'
    };
  }

  private detectForms(html: string): { detected: boolean; type: string; confidence: number } {
    const htmlLower = html.toLowerCase();

    // Check for HTML forms
    const hasFormTag = /<form[^>]*>/i.test(html);
    const hasInputFields = /<input[^>]*>/i.test(html);
    const hasSubmitButton = /<button[^>]*type=["']?submit["']?[^>]*>/i.test(html) ||
                           /<input[^>]*type=["']?submit["']?[^>]*>/i.test(html);

    if (hasFormTag && hasInputFields && hasSubmitButton) {
      // Check for application-related form fields
      const hasNameField = /name.*input|input.*name/i.test(html);
      const hasEmailField = /email.*input|input.*email/i.test(html);
      const hasAddressField = /address|adresse/i.test(html);

      if (hasNameField || hasEmailField || hasAddressField) {
        return { detected: true, type: 'HTML', confidence: 0.95 };
      }
      return { detected: true, type: 'HTML', confidence: 0.7 };
    }

    // Check for PDF forms
    const hasPdfLink = /\.pdf["'\s>]/i.test(html);
    const hasFormKeywords = /(antrag|formular|application|form).*\.pdf/i.test(html);

    if (hasPdfLink && hasFormKeywords) {
      return { detected: true, type: 'PDF', confidence: 0.85 };
    }

    // Check for online application links
    const hasOnlineApplication = /(online.*antrag|onlineantrag|apply.*online)/i.test(html);
    const hasApplicationUrl = /\/antrag|\/application|\/bewerbung/i.test(html);

    if (hasOnlineApplication || hasApplicationUrl) {
      return { detected: true, type: 'HTML', confidence: 0.8 };
    }

    return { detected: false, type: '', confidence: 0 };
  }

  private detectKeywords(normalizedHtml: string): {
    matched: boolean;
    priority: Priority;
    confidence: number;
    description: string;
    keywords: string[];
  } {
    const htmlLower = normalizedHtml.toLowerCase();
    const matchedCritical: string[] = [];
    const matchedImportant: string[] = [];

    // Check critical keywords
    for (const keyword of CRITICAL_KEYWORDS) {
      if (htmlLower.includes(keyword.toLowerCase())) {
        matchedCritical.push(keyword);
      }
    }

    // Check important keywords
    for (const keyword of IMPORTANT_KEYWORDS) {
      if (htmlLower.includes(keyword.toLowerCase())) {
        matchedImportant.push(keyword);
      }
    }

    if (matchedCritical.length > 0) {
      return {
        matched: true,
        priority: Priority.CRITICAL,
        confidence: Math.min(0.9 + (matchedCritical.length * 0.02), 1.0),
        description: `Critical keywords detected: ${matchedCritical.join(', ')}`,
        keywords: matchedCritical
      };
    }

    if (matchedImportant.length > 0) {
      return {
        matched: true,
        priority: Priority.IMPORTANT,
        confidence: Math.min(0.7 + (matchedImportant.length * 0.05), 0.9),
        description: `Important keywords detected: ${matchedImportant.join(', ')}`,
        keywords: matchedImportant
      };
    }

    return {
      matched: false,
      priority: Priority.INFO,
      confidence: 0,
      description: '',
      keywords: []
    };
  }

  private generateDiff(oldContent: string, newContent: string): string {
    try {
      const diffResult = createDiff(oldContent, newContent);
      return JSON.stringify(diffResult, null, 2);
    } catch (error) {
      logger.error('Failed to generate diff', { error });
      return 'Diff generation failed';
    }
  }

  extractFormFields(html: string): FormField[] {
    const fields: FormField[] = [];

    try {
      // Simple regex-based extraction (could be improved with proper HTML parsing)
      const inputRegex = /<input[^>]*>/gi;
      const inputs = html.match(inputRegex) || [];

      for (const input of inputs) {
        const nameMatch = input.match(/name=["']([^"']+)["']/i);
        const typeMatch = input.match(/type=["']([^"']+)["']/i);
        const placeholderMatch = input.match(/placeholder=["']([^"']+)["']/i);
        const requiredMatch = /required/i.test(input);

        if (nameMatch) {
          fields.push({
            name: nameMatch[1],
            type: typeMatch ? typeMatch[1] : 'text',
            required: requiredMatch,
            placeholder: placeholderMatch ? placeholderMatch[1] : undefined
          });
        }
      }

      // Extract textareas
      const textareaRegex = /<textarea[^>]*>/gi;
      const textareas = html.match(textareaRegex) || [];

      for (const textarea of textareas) {
        const nameMatch = textarea.match(/name=["']([^"']+)["']/i);
        const requiredMatch = /required/i.test(textarea);

        if (nameMatch) {
          fields.push({
            name: nameMatch[1],
            type: 'textarea',
            required: requiredMatch
          });
        }
      }

      logger.info(`Extracted ${fields.length} form fields`);
    } catch (error) {
      logger.error('Failed to extract form fields', { error });
    }

    return fields;
  }
}

export const changeDetector = new ChangeDetector();
