export type InsightArticle = {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  url?: string;
  imageLinks?: string[];
  sourceName?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
};
