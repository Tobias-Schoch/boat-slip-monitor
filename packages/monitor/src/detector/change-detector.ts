import * as Diff from 'diff';
import {
  createModuleLogger,
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
    previousHtmlNormalized: string | null,
    previousHtmlOriginal: string | null,
    currentHtml: string,
    currentNormalizedHtml: string,
    previousHtmlHash: string | null = null,
    currentHtmlHash: string | null = null
  ): Promise<ChangeComparisonResult> {
    // First check - don't trigger critical alerts
    if (!previousHtmlNormalized) {
      return {
        hasChanged: false,
        type: null,
        priority: Priority.INFO,
        confidence: 1.0,
        description: 'Initial check - no previous data'
      };
    }

    // Use hash comparison instead of Levenshtein (prevents memory issues with large HTML)
    const hasSignificantChange = previousHtmlHash !== currentHtmlHash;
    const similarity = hasSignificantChange ? 0.0 : 1.0;

    // Only check for forms/keywords if there's an actual content change
    if (hasSignificantChange) {

      // Check for form detection first (highest priority)
      const currentFormDetection = this.detectForms(currentHtml);
      if (currentFormDetection.detected) {
        // Check if form was already present in previous HTML
        const previousFormDetection = this.detectForms(previousHtmlOriginal || previousHtmlNormalized);
        if (!previousFormDetection.detected) {
          // NEW form detected!
          logger.warn('🚨 CRITICAL: NEW Form detected!', { type: currentFormDetection.type });
          const description = currentFormDetection.type === 'PDF'
            ? '📄 PDF-Antragsformular gefunden! Download jetzt möglich.'
            : '📝 Online-Anmeldeformular entdeckt! Du kannst dich jetzt bewerben.';
          return {
            hasChanged: true,
            type: ChangeType.FORM_DETECTED,
            priority: Priority.CRITICAL,
            confidence: currentFormDetection.confidence,
            description,
            diff: this.generateDiff(previousHtmlOriginal || previousHtmlNormalized, currentHtml)
          };
        }
      }

      // Check for critical keywords
      const currentKeywordMatch = this.detectKeywords(currentNormalizedHtml);
      if (currentKeywordMatch.matched) {
        // Check if same keywords were in previous HTML
        const previousKeywordMatch = this.detectKeywords(previousHtmlNormalized);

        // Find NEW keywords (in current but not in previous)
        const newKeywords = currentKeywordMatch.keywords.filter(
          keyword => !previousKeywordMatch.keywords.includes(keyword)
        );

        if (newKeywords.length > 0) {
          // NEW keywords detected!
          logger.warn('🚨 CRITICAL: NEW Keywords detected!', { newKeywords });
          return {
            hasChanged: true,
            type: ChangeType.KEYWORD_MATCH,
            priority: currentKeywordMatch.priority,
            confidence: currentKeywordMatch.confidence,
            description: currentKeywordMatch.description,
            matchedKeywords: newKeywords,
            diff: this.generateDiff(previousHtmlOriginal || previousHtmlNormalized, currentHtml)
          };
        }
      }
    }

    // If we reach here and there was a significant change, it's a regular content change
    if (hasSignificantChange) {
      return {
        hasChanged: true,
        type: ChangeType.CONTENT,
        priority: Priority.INFO,
        confidence: 1 - similarity,
        description: '📝 Die Seite wurde aktualisiert. Schau dir die Änderungen im Screenshot an.',
        diff: this.generateDiff(previousHtmlOriginal || previousHtmlNormalized, currentHtml)
      };
    }

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
      // More user-friendly descriptions based on keywords
      let description = '🚨 Wichtige Änderung auf der Seite!';
      if (matchedCritical.some(k => k.includes('warteliste') || k.includes('anmeldung'))) {
        description = '⚠️ Die Warteliste könnte bald öffnen! Neue Informationen zur Anmeldung gefunden.';
      } else if (matchedCritical.some(k => k.includes('formular') || k.includes('antrag'))) {
        description = '📝 Anmeldeformular wurde gefunden! Jetzt könnte eine Bewerbung möglich sein.';
      }

      return {
        matched: true,
        priority: Priority.CRITICAL,
        confidence: Math.min(0.9 + (matchedCritical.length * 0.02), 1.0),
        description,
        keywords: matchedCritical
      };
    }

    if (matchedImportant.length > 0) {
      let description = 'ℹ️ Relevante Änderung auf der Seite gefunden.';
      if (matchedImportant.some(k => k.includes('verfügbar') || k.includes('available'))) {
        description = '✅ Neue Verfügbarkeits-Informationen wurden veröffentlicht.';
      } else if (matchedImportant.some(k => k.includes('termin') || k.includes('öffnung'))) {
        description = '📅 Neue Informationen zu Terminen oder Öffnungszeiten.';
      }

      return {
        matched: true,
        priority: Priority.IMPORTANT,
        confidence: Math.min(0.7 + (matchedImportant.length * 0.05), 0.9),
        description,
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
      const diffResult = Diff.createPatch('content', oldContent, newContent, 'Old', 'New');
      return diffResult;
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
    } catch (error) {
      logger.error('Failed to extract form fields', { error });
    }

    return fields;
  }
}

export const changeDetector = new ChangeDetector();
