import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { getOptimizedImageUrl } from '../shopify/client';
import { formatDate } from '../utils/date';
import { Calendar, User, ArrowLeft, Clock, Share2, Check } from 'lucide-react';
import { useRouter } from '../utils/Router';
import { apiUrl } from '../utils/shopApi';
import { formatBlogContent } from '../utils/blogFormatter';

interface BlogPostPageProps {
    params: {
        blogHandle: string;
        articleHandle: string;
    };
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ params }) => {
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { navigateTo } = useRouter();
    const blogHandle = params.blogHandle || (params as any).bloghandle || 'news';
    const articleHandle = params.articleHandle || (params as any).articlehandle;

    useEffect(() => {
        const loadArticle = async () => {
            setLoading(true);
            if (articleHandle) {
                try {
                    const response = await fetch(apiUrl(`/api/blogs/article/${articleHandle}`));
                    if (response.ok) {
                        const data = await response.json();
                        setArticle(data);
                    } else {
                        setArticle(null);
                    }
                } catch {
                    setArticle(null);
                }
            }
            setLoading(false);
        };
        loadArticle();

        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, [blogHandle, articleHandle]);

    // Dynamic SEO Meta Tags & Schema.org Structured Data
    useEffect(() => {
        if (!article) return;
        const originalTitle = document.title;

        // 1. Meta Title
        const effectiveTitle = (article.meta_title && article.meta_title.trim())
            ? article.meta_title.trim()
            : `${article.title} | Nivaran Upcyclers Blog`;
        document.title = effectiveTitle;

        // 2. Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        const oldDesc = metaDesc.getAttribute('content');
        const fallbackDesc = article.excerpt || (article.content ? article.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').slice(0, 160) : '') || 'Discover sustainable upcycling insights from Nivaran Upcyclers.';
        const effectiveDesc = (article.meta_description && article.meta_description.trim())
            ? article.meta_description.trim()
            : fallbackDesc;
        metaDesc.setAttribute('content', effectiveDesc);

        // 3. Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        const oldCanonical = canonical.getAttribute('href');
        const defaultCanonical = `https://www.nivaranupcyclers.com/blogs/news/${article.handle || articleHandle}`;
        let effectiveCanonical = defaultCanonical;
        if (article.canonical_url && article.canonical_url.trim()) {
            const raw = article.canonical_url.trim();
            if (/^https?:\/\//i.test(raw)) {
                effectiveCanonical = raw;
            } else if (raw.startsWith('/')) {
                effectiveCanonical = `https://www.nivaranupcyclers.com${raw}`;
            } else {
                effectiveCanonical = `https://www.nivaranupcyclers.com/blogs/news/${raw}`;
            }
        }
        canonical.setAttribute('href', effectiveCanonical);

        // 4. OpenGraph Tags
        const setOgTag = (property: string, content: string) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', property);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };
        setOgTag('og:title', effectiveTitle);
        setOgTag('og:description', effectiveDesc);
        setOgTag('og:url', effectiveCanonical);
        setOgTag('og:type', 'article');
        if (article.image?.url) {
            setOgTag('og:image', article.image.url);
        }

        // 5. Schema.org JSON-LD structured data for BlogPosting
        const scriptId = 'blog-schema-jsonld';
        let schemaScript = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = scriptId;
            schemaScript.type = 'application/ld+json';
            document.head.appendChild(schemaScript);
        }
        const schemaData = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: effectiveDesc,
            image: article.image?.url ? [article.image.url] : undefined,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
                '@type': 'Person',
                name: article.authorV2?.name || 'Nivaran'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Nivaran Upcyclers',
                url: 'https://www.nivaranupcyclers.com/',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://www.nivaranupcyclers.com/favicon.svg'
                }
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': effectiveCanonical
            }
        };
        schemaScript.textContent = JSON.stringify(schemaData);

        return () => {
            try {
                document.title = originalTitle;
                if (oldDesc && metaDesc) metaDesc.setAttribute('content', oldDesc);
                if (oldCanonical && canonical) canonical.setAttribute('href', oldCanonical);
                const s = document.getElementById(scriptId);
                if (s && s.parentNode) s.parentNode.removeChild(s);
            } catch {}
        };
    }, [article, articleHandle]);

    // Parse and format content supporting HTML, Markdown, and plain text
    const formattedHtml = useMemo(() => {
        if (!article) return '';
        const raw = article.contentHtml || article.content || '';
        return formatBlogContent(raw);
    }, [article]);

    // Reading time calculation
    const readTimeMinutes = useMemo(() => {
        if (!article?.content) return 3;
        const words = article.content.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }, [article]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article?.title,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FFFEF5]">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8D548]"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FFFEF5]">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h1 className="text-3xl font-black text-[#1B4332] mb-4">Article Not Found</h1>
                    <p className="text-[#4a3b2c]/80 mb-8 max-w-md">The article you are looking for might have been moved, deleted, or doesn't exist.</p>
                    <button
                        onClick={() => navigateTo('/')}
                        className="px-8 py-3 bg-[#1B4332] text-white rounded-xl font-bold hover:bg-[#1B4332]/90 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const imageUrl = getOptimizedImageUrl(article.image?.url, 1200, 600);
    const formattedDate = formatDate(article.publishedAt);

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFEF5]">
            <Header />

            <style>{`
                /* Beautiful Blog Typography & Heading Styles */
                .blog-content-body {
                    color: #2D3748;
                    font-size: 1.125rem;
                    line-height: 1.85;
                    font-family: inherit;
                }
                .blog-content-body h1,
                .blog-content-body .blog-h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: #1B4332;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    line-height: 1.25;
                    letter-spacing: -0.02em;
                }
                .blog-content-body h2,
                .blog-content-body .blog-h2 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1B4332;
                    margin-top: 2.75rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid rgba(27, 67, 50, 0.12);
                    line-height: 1.3;
                    letter-spacing: -0.01em;
                }
                .blog-content-body h3,
                .blog-content-body .blog-h3 {
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: #1B4332;
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.4;
                }
                .blog-content-body p,
                .blog-content-body .blog-paragraph {
                    font-size: 1.125rem;
                    line-height: 1.85;
                    color: #2D3748;
                    margin-bottom: 1.5rem;
                }
                .blog-content-body ul,
                .blog-content-body .blog-list {
                    list-style-type: disc;
                    margin-top: 1rem;
                    margin-bottom: 1.75rem;
                    padding-left: 1.75rem;
                }
                .blog-content-body ol,
                .blog-content-body .blog-ordered-list {
                    list-style-type: decimal;
                    margin-top: 1rem;
                    margin-bottom: 1.75rem;
                    padding-left: 1.75rem;
                }
                .blog-content-body li {
                    font-size: 1.075rem;
                    line-height: 1.75;
                    color: #2D3748;
                    margin-bottom: 0.5rem;
                }
                .blog-content-body strong,
                .blog-content-body b {
                    font-weight: 700;
                    color: #1B4332;
                }
                .blog-content-body em,
                .blog-content-body i {
                    font-style: italic;
                }
                .blog-content-body a {
                    color: #1B4332;
                    font-weight: 600;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: color 0.15s ease;
                }
                .blog-content-body a:hover {
                    color: #DBB520;
                }
                .blog-content-body blockquote {
                    border-left: 4px solid #F8D548;
                    background-color: rgba(248, 213, 72, 0.08);
                    padding: 1rem 1.5rem;
                    margin: 1.75rem 0;
                    border-radius: 0 12px 12px 0;
                    font-style: italic;
                    color: #2D3748;
                }
                @media (max-width: 640px) {
                    .blog-content-body h2,
                    .blog-content-body .blog-h2 {
                        font-size: 1.45rem;
                        margin-top: 2rem;
                    }
                    .blog-content-body h3,
                    .blog-content-body .blog-h3 {
                        font-size: 1.2rem;
                        margin-top: 1.5rem;
                    }
                    .blog-content-body p,
                    .blog-content-body .blog-paragraph {
                        font-size: 1rem;
                        line-height: 1.75;
                        margin-bottom: 1.25rem;
                    }
                }
            `}</style>

            <main className="flex-grow pt-8 pb-16 bg-[#FFFEF5]">
                {/* Back Button & Header - Inside Container */}
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigateTo('/')}
                            className="text-[#1B4332]/70 hover:text-[#1B4332] transition-colors flex items-center gap-2 font-bold text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Articles
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#1B4332]/20 hover:bg-[#1B4332]/10 transition-colors flex items-center gap-1.5 text-[#1B4332]"
                            title="Share Article"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                            {copied ? 'Link Copied!' : 'Share Article'}
                        </button>
                    </div>

                    {/* Title & Meta Info */}
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#4a3b2c]/70">
                            <div className="flex items-center gap-2 text-[#DBB520] font-bold uppercase tracking-wider">
                                <Calendar className="w-4 h-4" />
                                {formattedDate}
                            </div>
                            <div className="flex items-center gap-1.5 text-[#4a3b2c]/70">
                                <Clock className="w-4 h-4" />
                                {readTimeMinutes} min read
                            </div>
                            {article.authorV2 && (
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-[#4a3b2c]/30 rounded-full"></span>
                                    <User className="w-4 h-4" />
                                    {article.authorV2.name}
                                </div>
                            )}
                        </div>

                        {/* Semantic H1 Title */}
                        <h1 className="text-3xl md:text-5xl font-black text-[#1B4332] leading-tight">
                            {article.title}
                        </h1>

                        {article.excerpt && (
                            <p className="text-lg md:text-xl text-[#4a3b2c]/85 leading-relaxed font-normal pt-2">
                                {article.excerpt}
                            </p>
                        )}
                    </div>

                    {/* Featured Image */}
                    <div className="w-full mb-12 overflow-hidden rounded-3xl shadow-lg border border-[#4a3b2c]/10 bg-white">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={article.image?.altText || article.title}
                                className="w-full h-auto object-cover max-h-[600px]"
                            />
                        ) : (
                            <div className="w-full h-64 bg-[#1B4332] flex items-center justify-center text-white/20">
                                <span className="text-4xl">No Image</span>
                            </div>
                        )}
                    </div>

                    {/* Content Section with Headings & Rich Formatting */}
                    <article className="blog-content-body bg-white p-8 md:p-14 rounded-3xl shadow-md border border-[#4a3b2c]/5">
                        <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />
                    </article>

                    {/* Footer / Read More */}
                    <div className="mt-12 text-center border-t border-[#4a3b2c]/10 pt-12">
                        <button
                            onClick={() => navigateTo('/')}
                            className="px-8 py-3 bg-[#1B4332] text-white rounded-xl font-bold hover:bg-[#1B4332]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center gap-2"
                        >
                            Read More Articles <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPostPage;
