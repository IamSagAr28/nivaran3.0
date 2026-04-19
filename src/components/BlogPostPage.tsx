import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { getOptimizedImageUrl } from '../shopify/client';
import { formatDate } from '../utils/date';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { useRouter } from '../utils/Router';

interface BlogPostPageProps {
    params: {
        blogHandle: string;
        articleHandle: string;
    };
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ params }) => {
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { navigateTo } = useRouter();
    const { blogHandle, articleHandle } = params;

    useEffect(() => {
        const loadArticle = async () => {
            setLoading(true);
            if (blogHandle && articleHandle) {
                try {
                    const response = await fetch(`/api/blogs/article/${articleHandle}`);
                    if (response.ok) {
                        const data = await response.json();
                        // Ensure compatibility with existing renderer
                        setArticle({
                            ...data,
                            contentHtml: data?.contentHtml ?? data?.content ?? ''
                        });
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

            <main className="flex-grow pt-8 pb-16 bg-[#FFFEF5]">
                {/* Back Button & Header - Inside Container */}
                <div className="container mx-auto px-4 max-w-4xl">
                    <button
                        onClick={() => navigateTo('/')}
                        className="mb-8 text-[#1B4332]/70 hover:text-[#1B4332] transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Articles
                    </button>

                    {/* Title & Meta */}
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#4a3b2c]/70">
                            <div className="flex items-center gap-2 text-[#DBB520] font-bold uppercase tracking-wider">
                                <Calendar className="w-4 h-4" />
                                {formattedDate}
                            </div>
                            {article.authorV2 && (
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-[#4a3b2c]/30 rounded-full"></span>
                                    <User className="w-4 h-4" />
                                    {article.authorV2.name}
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-[#1B4332] leading-tight">
                            {article.title}
                        </h1>
                    </div>

                    {/* Featured Image - standard aspect ratio, rounded */}
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

                    {/* Content Section */}
                    <div className="prose prose-lg prose-stone prose-headings:font-black prose-headings:text-[#1B4332] prose-p:text-[#4a3b2c]/80 prose-a:text-[#DBB520] prose-img:rounded-2xl max-w-none bg-white p-8 md:p-12 rounded-3xl shadow-md border border-[#4a3b2c]/5">
                        <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                    </div>

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
