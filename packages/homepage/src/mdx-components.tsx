import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { Text } from 'retro-react'
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

function Heading({
  variant,
  children,
  ...props
}: {
  variant: 'h1' | 'h2' | 'h3' | 'h4'
  children?: React.ReactNode
} & ComponentPropsWithoutRef<'div'>) {
  return (
    <Text
      variant={variant}
      sx={{ marginTop: variant === 'h1' ? 0 : '1.25rem', marginBottom: '0.5rem' }}
      {...props}
    >
      {children}
    </Text>
  )
}

function languageFromClassName(className?: string): string | null {
  if (!className) return null
  const match = className.match(/(?:language|lang)-([a-z0-9_+-]+)/i)
  return match?.[1] ?? null
}

function findFencedCodeProps(node: ReactNode): { className?: string } | null {
  let found: { className?: string } | null = null
  Children.forEach(node, (child) => {
    if (found || !isValidElement(child)) return
    const props = child.props as { className?: string; children?: ReactNode }
    const className = typeof props.className === 'string' ? props.className : ''
    // MDX 传入的是自定义 code 组件元素（type 为函数），不是原生 'code'
    if (
      child.type === 'code' ||
      className.includes('language-') ||
      className.includes('hljs')
    ) {
      found = props
      return
    }
    const nested = findFencedCodeProps(props.children)
    if (nested) found = nested
  })
  return found
}

const components: MDXComponents = {
  h1: (props) => <Heading variant="h1" {...props} />,
  h2: (props) => <Heading variant="h2" {...props} />,
  h3: (props) => <Heading variant="h3" {...props} />,
  h4: (props) => <Heading variant="h4" {...props} />,
  p: (props) => (
    <Text variant="paragraph" sx={{ marginBottom: '0.75rem', lineHeight: 1.55 }} {...props} />
  ),
  a: ({ href, children, ...props }) => {
    const to = href ?? '#'
    if (to.startsWith('/')) {
      return (
        <Link href={to} {...props}>
          {children}
        </Link>
      )
    }
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  },
  ul: (props) => (
    <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', color: '#000' }} {...props} />
  ),
  ol: (props) => (
    <ol style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', color: '#000' }} {...props} />
  ),
  li: (props) => <li style={{ marginBottom: '0.25rem', color: '#000' }} {...props} />,
  code: ({ className, children, ...props }) => {
    // fenced block: <pre><code class="language-xxx hljs">
    const isBlock =
      typeof className === 'string' &&
      (className.includes('language-') || className.includes('hljs'))
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={`mdx-inline-code${className ? ` ${className}` : ''}`} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, className, ...props }) => {
    const codeProps = findFencedCodeProps(children)
    const codeClassName =
      typeof codeProps?.className === 'string' ? codeProps.className : className
    const lang = languageFromClassName(codeClassName)

    return (
      <div className="mdx-codeblock" data-language={lang ?? undefined}>
        {lang ? <div className="mdx-codeblock-lang">{lang}</div> : null}
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    )
  },
  table: (props) => (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '0 0 1rem',
        fontSize: 14,
        color: '#000',
      }}
      {...props}
    />
  ),
  th: (props) => (
    <th
      style={{
        textAlign: 'left',
        border: '1px solid #808080',
        padding: '6px 8px',
        background: '#c0c0c0',
      }}
      {...props}
    />
  ),
  td: (props) => (
    <td style={{ border: '1px solid #808080', padding: '6px 8px' }} {...props} />
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
