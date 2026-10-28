import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsShell } from '@/components/docs-shell'
import { DOC_PAGES, findDoc } from '@/lib/docs'

type PageProps = {
  params: Promise<{ slug?: string[] }>
}

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = findDoc(slug)
  if (!doc) return {}
  return {
    title: doc.title,
    description: doc.description,
  }
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params
  const doc = findDoc(slug)
  if (!doc) notFound()

  const { default: Content } = await import(`@/content/docs/${doc.file}.mdx`)

  return (
    <DocsShell title={doc.title}>
      <Content />
    </DocsShell>
  )
}
