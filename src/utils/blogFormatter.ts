/**
 * Blog Content Formatter
 * Converts HTML, Markdown, or structured plain text into beautifully formatted HTML
 * with proper H1/H2/H3 headings, paragraphs, lists, and inline styles.
 */

export function formatInline(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function formatBlogContent(content?: string | null): string {
  if (!content || typeof content !== 'string') return '';
  const trimmed = content.trim();

  // If already contains rich HTML heading tags, return directly
  const hasHtmlHeadings = /<(h[1-6]|table|blockquote)[^>]*>/i.test(trimmed);
  if (hasHtmlHeadings) {
    return trimmed;
  }

  // If contains HTML paragraphs or breaks without headings, strip or format
  let rawText = trimmed;
  if (/<p[^>]*>/i.test(trimmed) && !/<h[1-6]/i.test(trimmed)) {
    // Convert <p> and <br> into newlines for re-parsing
    rawText = rawText
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '');
  }

  const lines = rawText.split(/\r?\n/);
  const outputHtml: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let currentParagraphLines: string[] = [];
  let isAfterListIntro = false;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const pText = currentParagraphLines.join(' ').trim();
      if (pText) {
        outputHtml.push(`<p class="blog-paragraph">${formatInline(pText)}</p>`);
      }
      currentParagraphLines = [];
    }
  };

  const closeList = () => {
    if (inList) {
      outputHtml.push(`</${inList}>`);
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      isAfterListIntro = false;
      continue;
    }

    // 1. Markdown Headings
    if (line.startsWith('### ')) {
      flushParagraph();
      closeList();
      outputHtml.push(`<h3 class="blog-h3">${formatInline(line.slice(4).trim())}</h3>`);
      isAfterListIntro = false;
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      closeList();
      outputHtml.push(`<h2 class="blog-h2">${formatInline(line.slice(3).trim())}</h2>`);
      isAfterListIntro = false;
      continue;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      closeList();
      outputHtml.push(`<h2 class="blog-h2">${formatInline(line.slice(2).trim())}</h2>`);
      isAfterListIntro = false;
      continue;
    }

    // 2. Numbered Subheadings: e.g. "1. Protection of Rivers and Water Bodies"
    // Short line (<= 85 chars), starts with number dot, doesn't end with a full sentence period
    const numberedHeadingMatch = line.match(/^(\d+)\.\s+([A-Za-z0-9\s:,'’"“”?()/-]{3,85})$/);
    if (numberedHeadingMatch && (!line.endsWith('.') || line.length < 50)) {
      flushParagraph();
      closeList();
      outputHtml.push(`<h3 class="blog-h3">${formatInline(line.replace(/\.$/, ''))}</h3>`);
      isAfterListIntro = false;
      continue;
    }

    // 3. Question or Major Section Headings in plain text:
    // e.g. "What is Pooja Waste Disposal?", "Why Proper Pooja Waste Disposal is Important", "How Nivaran Upcyclers Is Helping..."
    const isQuestionHeading = line.endsWith('?') && line.length < 110 && !line.toLowerCase().startsWith('if ') && !line.toLowerCase().startsWith('when ');
    const isMajorTopicHeading = (
      /^(What|Why|How|Where|When|Who|The|Examples of|Benefits of|Importance of|Types of|Tips for|Key Takeaways|Conclusion|Summary)\b/i.test(line) &&
      line.length < 90 &&
      !line.endsWith('.')
    );
    const isShortTitleCaseHeading = (
      line.length > 5 &&
      line.length < 75 &&
      /^[A-Z][A-Za-z0-9\s:,'’"“”?()/-]+$/.test(line) &&
      !line.endsWith('.') &&
      (i === 0 || lines[i - 1].trim() === '' || i === lines.length - 1 || lines[i + 1]?.trim() === '') &&
      // Check if majority of words are capitalized (Title Case)
      line.split(/\s+/).filter(w => w.length > 3 && /^[A-Z]/.test(w)).length >= 2
    );

    if (isQuestionHeading || isMajorTopicHeading || isShortTitleCaseHeading) {
      flushParagraph();
      closeList();
      outputHtml.push(`<h2 class="blog-h2">${formatInline(line)}</h2>`);
      isAfterListIntro = line.toLowerCase().endsWith('include:') || line.toLowerCase().endsWith('includes:') || line.toLowerCase().endsWith('following:');
      continue;
    }

    // 4. Explicit bullet lists: "- Item" or "* Item" or "• Item"
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (inList !== 'ul') {
        closeList();
        outputHtml.push('<ul class="blog-list">');
        inList = 'ul';
      }
      outputHtml.push(`<li>${formatInline(bulletMatch[1])}</li>`);
      continue;
    }

    // 5. Implicit bullet items following an intro like "Examples of pooja wastes include:"
    if (isAfterListIntro && line.length < 120 && !line.endsWith('.') && !line.includes(':')) {
      flushParagraph();
      if (inList !== 'ul') {
        closeList();
        outputHtml.push('<ul class="blog-list">');
        inList = 'ul';
      }
      outputHtml.push(`<li>${formatInline(line)}</li>`);
      continue;
    }

    // 6. Numbered list item (long sentence): "1. First do this and then..."
    const listNumberMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (listNumberMatch && line.length > 85 && line.endsWith('.')) {
      flushParagraph();
      if (inList !== 'ol') {
        closeList();
        outputHtml.push('<ol class="blog-ordered-list">');
        inList = 'ol';
      }
      outputHtml.push(`<li>${formatInline(listNumberMatch[2])}</li>`);
      continue;
    }

    // Normal paragraph text
    isAfterListIntro = false;
    currentParagraphLines.push(line);
  }

  flushParagraph();
  closeList();

  return outputHtml.join('\n\n');
}
