import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { Text } from 'retro-react'
import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

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

const mono: CSSProperties['fontFamily'] =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

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
    // fenced block: <pre><code class="language-xxx">
    const isBlock = typeof className === 'string' && className.includes('language-')
    if (isBlock) {
      return (
        <code
          className={className}
          style={{
            fontFamily: mono,
            fontSize: 'inherit',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'inherit',
            whiteSpace: 'inherit',
          }}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={className}
        style={{
          fontFamily: mono,
          fontSize: '0.9em',
          background: '#ffffe0',
          border: '1px solid #808080',
          padding: '0 0.3rem',
          color: '#000',
        }}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre
      style={{
        margin: '0 0 1rem',
        padding: '10px 12px',
        overflow: 'auto',
        background: '#ffffe0',
        color: '#000',
        border: '2px solid',
        borderColor: '#808080 #fff #fff #808080',
        fontFamily: mono,
        fontSize: 13,
        lineHeight: 1.5,
        whiteSpace: 'pre',
      }}
      {...props}
    >
      {children}
    </pre>
  ),
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
