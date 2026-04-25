import matter from 'gray-matter';

export type MarkdownFrontmatter = Record<string, unknown>;

export function parseMarkdownFile(content: string): {
  frontmatter: MarkdownFrontmatter;
  body: string;
} {
  const parsed = matter(content);

  return {
    frontmatter: parsed.data,
    body: parsed.content,
  };
}

export function stringifyMarkdownFile(
  frontmatter: MarkdownFrontmatter,
  body: string,
): string {
  return matter.stringify(body, frontmatter);
}
